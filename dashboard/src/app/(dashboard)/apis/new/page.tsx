"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorMessage } from "@/components/ui/error-message";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  HTTP_METHODS,
  type ApiResponse,
  type RateLimitAlgorithm,
} from "@/modules/apis/api.types";
import type { UserResponse } from "@/modules/users/user.types";

type CreatedApi = {
  api: ApiResponse;
  key: string;
};

export default function NewApiPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [rateLimitAlgorithm, setRateLimitAlgorithm] =
    useState<RateLimitAlgorithm>("sliding-window");

  const [maxRequests, setMaxRequests] = useState("100");
  const [windowMs, setWindowMs] = useState("60000");

  const [capacity, setCapacity] = useState("100");
  const [refillRate, setRefillRate] = useState("10");
  const [refillIntervalMs, setRefillIntervalMs] = useState("1000");

  const [allowedMethods, setAllowedMethods] = useState<string[]>([
    ...HTTP_METHODS,
  ]);

  const [timeoutMs, setTimeoutMs] = useState("10000");

  const [retryEnabled, setRetryEnabled] = useState(false);
  const [maxRetries, setMaxRetries] = useState("3");
  const [retryDelayMs, setRetryDelayMs] = useState("500");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createdApi, setCreatedApi] = useState<CreatedApi | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          throw new Error("Failed to load user.");
        }

        const data: UserResponse = await response.json();
        setUser(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load user.",
        );
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  const toggleMethod = (method: string) => {
    setAllowedMethods((current) =>
      current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method],
    );
  };

  const handleAlgorithmChange = (algorithm: RateLimitAlgorithm) => {
    if (algorithm === "token-bucket" && user?.plan === "free") {
      return;
    }

    setRateLimitAlgorithm(algorithm);
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const rateLimit =
        rateLimitAlgorithm === "sliding-window"
          ? {
              enabled: rateLimitEnabled,
              algorithm: "sliding-window",
              maxRequests: Number(maxRequests),
              windowMs: Number(windowMs),
            }
          : {
              enabled: rateLimitEnabled,
              algorithm: "token-bucket",
              capacity: Number(capacity),
              refillRate: Number(refillRate),
              refillIntervalMs: Number(refillIntervalMs),
            };

      const response = await fetch("/api/apis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          baseUrl,
          rateLimit,
          allowedMethods,
          timeoutMs: Number(timeoutMs),
          retryPolicy: {
            enabled: retryEnabled,
            maxRetries: Number(maxRetries),
            retryDelayMs: Number(retryDelayMs),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to create API.");
      }

      setCreatedApi({
        api: data.api,
        key: data.key,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create API.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!createdApi) return;

    await navigator.clipboard.writeText(createdApi.key);
    setCopied(true);
  };

  if (isLoadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            Loading...
          </div>
        </div>
      </main>
    );
  }

  if (createdApi) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-xl">
          <PageHeader
            title="API created successfully"
            description="Your API key has been generated. Copy it now and store it somewhere secure."
          />

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                API key
              </p>

              <div className="mt-3 flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-950 p-4">
                <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-200">
                  {createdApi.key}
                </code>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-amber-900/50 bg-amber-950/30 p-4">
              <p className="text-sm font-medium text-amber-400">
                Save this key now
              </p>

              <p className="mt-1 text-sm text-amber-400/80">
                For security reasons, the full API key will not be shown again.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => router.push(`/apis/${createdApi.api.id}`)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Link
            href="/apis"
            className="text-sm text-slate-400 transition hover:text-slate-200"
          >
            ← Back to APIs
          </Link>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Create API
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Configure a new API gateway connection.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-medium">General</h2>

            <p className="mt-1 text-sm text-slate-400">
              Basic information about the upstream API.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Name
                </label>

                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="My API"
                  required
                  maxLength={100}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label
                  htmlFor="baseUrl"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Base URL
                </label>

                <input
                  id="baseUrl"
                  type="url"
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="https://api.example.com"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>
          </section>

          {/* Rate limiting */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium">Rate limiting</h2>

                <p className="mt-1 text-sm text-slate-400">
                  Control how many requests can reach the upstream API.
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={rateLimitEnabled}
                  onChange={(event) =>
                    setRateLimitEnabled(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/40"
                />
                Enabled
              </label>
            </div>

            {rateLimitEnabled && (
              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="algorithm"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Algorithm
                  </label>

                  <select
                    id="algorithm"
                    value={rateLimitAlgorithm}
                    onChange={(event) =>
                      handleAlgorithmChange(
                        event.target.value as RateLimitAlgorithm,
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="sliding-window">Sliding window</option>

                    <option
                      value="token-bucket"
                      disabled={user?.plan === "free"}
                    >
                      Token bucket{user?.plan === "free" ? " (Pro)" : ""}
                    </option>
                  </select>

                  {user?.plan === "free" && (
                    <p className="mt-2 text-xs text-slate-500">
                      Token bucket rate limiting is available on the Pro plan.
                    </p>
                  )}
                </div>

                {rateLimitAlgorithm === "sliding-window" ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="maxRequests"
                        className="mb-2 block text-sm font-medium text-slate-200"
                      >
                        Max requests
                      </label>

                      <input
                        id="maxRequests"
                        type="number"
                        min="1"
                        value={maxRequests}
                        onChange={(event) => setMaxRequests(event.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="windowMs"
                        className="mb-2 block text-sm font-medium text-slate-200"
                      >
                        Window (ms)
                      </label>

                      <input
                        id="windowMs"
                        type="number"
                        min="1"
                        value={windowMs}
                        onChange={(event) => setWindowMs(event.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="capacity"
                          className="mb-2 block text-sm font-medium text-slate-200"
                        >
                          Capacity
                        </label>

                        <input
                          id="capacity"
                          type="number"
                          min="1"
                          value={capacity}
                          onChange={(event) => setCapacity(event.target.value)}
                          required
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="refillRate"
                          className="mb-2 block text-sm font-medium text-slate-200"
                        >
                          Refill rate
                        </label>

                        <input
                          id="refillRate"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={refillRate}
                          onChange={(event) =>
                            setRefillRate(event.target.value)
                          }
                          required
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="refillIntervalMs"
                        className="mb-2 block text-sm font-medium text-slate-200"
                      >
                        Refill interval (ms)
                      </label>

                      <input
                        id="refillIntervalMs"
                        type="number"
                        min="1"
                        value={refillIntervalMs}
                        onChange={(event) =>
                          setRefillIntervalMs(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Allowed methods */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-medium">Allowed HTTP methods</h2>

            <p className="mt-1 text-sm text-slate-400">
              Select which HTTP methods this API accepts.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {HTTP_METHODS.map((method) => {
                const selected = allowedMethods.includes(method);

                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => toggleMethod(method)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                        : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>

            {allowedMethods.length === 0 && (
              <p className="mt-3 text-sm text-red-400">
                At least one method must be selected.
              </p>
            )}
          </section>

          {/* Request settings */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-medium">Request settings</h2>

            <p className="mt-1 text-sm text-slate-400">
              Configure how long the gateway waits for the upstream API.
            </p>

            <div className="mt-6 max-w-sm">
              <label
                htmlFor="timeoutMs"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Timeout (ms)
              </label>

              <input
                id="timeoutMs"
                type="number"
                min="1"
                value={timeoutMs}
                onChange={(event) => setTimeoutMs(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </section>

          {/* Retry policy */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium">Retry policy</h2>

                <p className="mt-1 text-sm text-slate-400">
                  Automatically retry failed upstream requests.
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={retryEnabled}
                  onChange={(event) => setRetryEnabled(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/40"
                />
                Enabled
              </label>
            </div>

            {retryEnabled && (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="maxRetries"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Max retries
                  </label>

                  <input
                    id="maxRetries"
                    type="number"
                    min="0"
                    max="5"
                    value={maxRetries}
                    onChange={(event) => setMaxRetries(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label
                    htmlFor="retryDelayMs"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Retry delay (ms)
                  </label>

                  <input
                    id="retryDelayMs"
                    type="number"
                    min="0"
                    value={retryDelayMs}
                    onChange={(event) => setRetryDelayMs(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>
            )}
          </section>

          <ErrorMessage message={error} />

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/apis"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Cancel
            </Link>

            <SubmitButton
              isSubmitting={isSubmitting}
              submittingText="Creating..."
            >
              Create API
            </SubmitButton>
          </div>
        </form>
      </div>
    </main>
  );
}
