"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDuration } from "@/utils/format-duration";
import { formatRateLimit } from "@/utils/format-rate-limit";
import {
  ApiResponse,
  HTTP_METHODS,
  RateLimitAlgorithm,
} from "@/modules/apis/api.types";
import { UserResponse } from "@/modules/users/user.types";
import { RouteRulesSection } from "@/components/route-rule/route-rules-section";

type EditForm = {
  name: string;
  baseUrl: string;
  rateLimitAlgorithm: RateLimitAlgorithm;
  rateLimitEnabled: boolean;
  maxRequests: string;
  windowMs: string;
  capacity: string;
  refillRate: string;
  refillIntervalMs: string;
  allowedMethods: string[];
  timeoutMs: string;
  retryEnabled: boolean;
  maxRetries: string;
  retryDelayMs: string;
};

export default function ApiDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const apiId = params.apiId as string;

  const [api, setApi] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [regeneratedKey, setRegeneratedKey] = useState<string | null>(null);
  const [regenerateError, setRegenerateError] = useState("");

  useEffect(() => {
    async function loadApi() {
      try {
        const response = await fetch(`/api/apis/${apiId}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load API.");
        }

        setApi(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load API.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadApi();
  }, [apiId]);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load user.");
        }

        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (!isEditOpen) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isEditOpen]);

  function openEditModal() {
    if (!api) return;

    const rateLimit = api.rateLimit;

    setEditForm({
      name: api.name,
      baseUrl: api.baseUrl,
      rateLimitAlgorithm: rateLimit.algorithm,
      rateLimitEnabled: rateLimit.enabled,

      maxRequests:
        rateLimit.algorithm === "sliding-window"
          ? String(rateLimit.maxRequests)
          : "100",

      windowMs:
        rateLimit.algorithm === "sliding-window"
          ? String(rateLimit.windowMs)
          : "60000",

      capacity:
        rateLimit.algorithm === "token-bucket"
          ? String(rateLimit.capacity)
          : "100",

      refillRate:
        rateLimit.algorithm === "token-bucket"
          ? String(rateLimit.refillRate)
          : "10",

      refillIntervalMs:
        rateLimit.algorithm === "token-bucket"
          ? String(rateLimit.refillIntervalMs)
          : "1000",

      allowedMethods: api.allowedMethods,
      timeoutMs: String(api.timeoutMs),
      retryEnabled: api.retryPolicy.enabled,
      maxRetries: String(api.retryPolicy.maxRetries),
      retryDelayMs: String(api.retryPolicy.retryDelayMs),
    });

    setEditError("");
    setIsEditOpen(true);
  }

  function handleAlgorithmChange(algorithm: RateLimitAlgorithm) {
    if (algorithm === "token-bucket" && user?.plan === "free") {
      return;
    }

    if (!editForm) return;

    setEditForm({
      ...editForm,
      rateLimitAlgorithm: algorithm,
    });
  }

  async function handleSave() {
    if (!editForm) return;

    if (editForm.allowedMethods.length === 0) {
      setEditError("At least one HTTP method must be allowed.");
      return;
    }

    if (
      editForm.rateLimitAlgorithm === "token-bucket" &&
      user?.plan === "free"
    ) {
      setEditError("Token bucket rate limiting requires a Pro plan.");
      return;
    }

    setIsSaving(true);
    setEditError("");

    try {
      const rateLimit =
        editForm.rateLimitAlgorithm === "sliding-window"
          ? {
              enabled: editForm.rateLimitEnabled,
              algorithm: "sliding-window" as const,
              maxRequests: Number(editForm.maxRequests),
              windowMs: Number(editForm.windowMs),
            }
          : {
              enabled: editForm.rateLimitEnabled,
              algorithm: "token-bucket" as const,
              capacity: Number(editForm.capacity),
              refillRate: Number(editForm.refillRate),
              refillIntervalMs: Number(editForm.refillIntervalMs),
            };

      const response = await fetch(`/api/apis/${apiId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          baseUrl: editForm.baseUrl,
          rateLimit,
          allowedMethods: editForm.allowedMethods,
          timeoutMs: Number(editForm.timeoutMs),
          retryPolicy: {
            enabled: editForm.retryEnabled,
            maxRetries: Number(editForm.maxRetries),
            retryDelayMs: Number(editForm.retryDelayMs),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to update API.");
      }

      setApi(data);
      setIsEditOpen(false);
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Failed to update API.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegenerateKey() {
    if (!api) return;

    const confirmed = window.confirm(
      "This will replace the current API key. The old key will stop working after the gateway configuration is refreshed. Continue?",
    );

    if (!confirmed) return;

    setIsRegeneratingKey(true);
    setRegenerateError("");
    setRegeneratedKey(null);

    try {
      const response = await fetch(`/api/apis/${api.id}/regenerate-key`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to regenerate API key.");
      }

      setApi(data.api);
      setRegeneratedKey(data.key);
    } catch (error) {
      setRegenerateError(
        error instanceof Error
          ? error.message
          : "Failed to regenerate API key.",
      );
    } finally {
      setIsRegeneratingKey(false);
    }
  }

  async function handleDelete() {
    if (!api) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${api.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/apis/${api.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Failed to delete API.");
      }

      router.push("/apis");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete API.",
      );
      setIsDeleting(false);
    }
  }

  async function handleCopyKey() {
    if (!regeneratedKey) return;

    await navigator.clipboard.writeText(regeneratedKey);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-200">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-slate-400">Loading API...</p>
        </div>
      </main>
    );
  }

  if (error || !api) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-200">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/apis"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to APIs
          </Link>

          <div className="mt-8 rounded-xl border border-red-900/50 bg-red-950/20 p-6">
            <h1 className="text-lg font-semibold text-white">
              Unable to load API
            </h1>

            <p className="mt-2 text-sm text-red-300">
              {error || "API not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-200">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link
            href="/apis"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to APIs
          </Link>

          <button
            type="button"
            onClick={openEditModal}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Edit API
          </button>
        </div>

        {/* Header */}
        <div className="mt-8 flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">{api.name}</h1>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  api.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {api.status}
              </span>
            </div>

            <p className="mt-2 break-all text-sm text-slate-400">
              {api.baseUrl}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* API information */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">
              API Information
            </h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Name
                </p>
                <p className="mt-1 text-sm text-slate-200">{api.name}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className="mt-1 text-sm capitalize text-slate-200">
                  {api.status}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Base URL
                </p>
                <p className="mt-1 break-all font-mono text-sm text-slate-200">
                  {api.baseUrl}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Created
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {new Date(api.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Last updated
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {new Date(api.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Authentication
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  The API key is only shown once when it is created or
                  regenerated.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegenerateKey}
                disabled={isRegeneratingKey}
                className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRegeneratingKey ? "Regenerating..." : "Regenerate key"}
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Key prefix
              </p>

              <p className="mt-2 font-mono text-sm text-slate-200">
                {api.apiKeyPrefix}••••••••
              </p>
            </div>

            {regenerateError && (
              <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
                {regenerateError}
              </div>
            )}

            {regeneratedKey && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-medium text-amber-300">
                  New API key
                </p>

                <p className="mt-1 text-sm text-amber-200/80">
                  Copy this key now. It will not be shown again.
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200">
                    {regeneratedKey}
                  </code>

                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Rate limiting */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">Rate limiting</h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Algorithm
                </p>
                <p className="mt-1 text-sm capitalize text-slate-200">
                  {api.rateLimit.enabled
                    ? api.rateLimit.algorithm.replace("-", " ")
                    : "Disabled"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Limit
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatRateLimit(api.rateLimit)}
                </p>
              </div>
            </div>
          </section>

          {/* Request settings */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">
              Request settings
            </h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Timeout
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatDuration(api.timeoutMs)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Allowed methods
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {api.allowedMethods.map((method) => (
                    <span
                      key={method}
                      className="rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Retry policy */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">Retry policy</h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {api.retryPolicy.enabled ? "Enabled" : "Disabled"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Max retries
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {api.retryPolicy.maxRetries}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Retry delay
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {formatDuration(api.retryPolicy.retryDelayMs)}
                </p>
              </div>
            </div>
          </section>

          {/* Route rules */}
          <RouteRulesSection
            apiId={api.id}
            apiAllowedMethods={api.allowedMethods}
            isFreePlan={user?.plan === "free"}
          />

          {/* Danger zone */}
          <section className="rounded-xl border border-red-900/50 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-red-400">Danger zone</h2>

            <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Delete this API
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Permanently delete this API and its configuration.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete API"}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Edit modal */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Edit API</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Update the API configuration.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
                className="text-slate-400 transition hover:text-white disabled:opacity-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8 p-6">
              {editError && (
                <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
                  {editError}
                </div>
              )}

              {/* General */}
              <section>
                <h3 className="text-sm font-semibold text-white">General</h3>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm text-slate-300">Name</label>

                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          name: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300">Base URL</label>

                    <input
                      type="url"
                      value={editForm.baseUrl}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          baseUrl: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
              </section>

              {/* Rate limiting */}
              <section>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-white">
                    Rate limiting
                  </h3>

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={editForm.rateLimitEnabled}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          rateLimitEnabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                    />
                    Enabled
                  </label>
                </div>

                <div className="mt-4">
                  <label className="text-sm text-slate-300">Algorithm</label>

                  <select
                    value={editForm.rateLimitAlgorithm}
                    onChange={(e) =>
                      handleAlgorithmChange(
                        e.target.value as RateLimitAlgorithm,
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="sliding-window">Sliding window</option>

                    <option
                      value="token-bucket"
                      disabled={user?.plan === "free"}
                    >
                      Token bucket
                      {user?.plan === "free" ? " (Pro)" : ""}
                    </option>
                  </select>

                  {user?.plan === "free" && (
                    <p className="mt-2 text-xs text-slate-500">
                      Token bucket rate limiting is available on the Pro plan.
                    </p>
                  )}
                </div>

                {editForm.rateLimitAlgorithm === "sliding-window" ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-300">
                        Max requests
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={editForm.maxRequests}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            maxRequests: e.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">
                        Window (ms)
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={editForm.windowMs}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            windowMs: e.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-300">Capacity</label>

                      <input
                        type="number"
                        min="1"
                        value={editForm.capacity}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            capacity: e.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">
                        Refill rate
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editForm.refillRate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            refillRate: e.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">
                        Refill interval (ms)
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={editForm.refillIntervalMs}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            refillIntervalMs: e.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Allowed methods */}
              <section>
                <h3 className="text-sm font-semibold text-white">
                  Allowed HTTP methods
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {HTTP_METHODS.map((method) => {
                    const selected = editForm.allowedMethods.includes(method);

                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            allowedMethods: selected
                              ? editForm.allowedMethods.filter(
                                  (item) => item !== method,
                                )
                              : [...editForm.allowedMethods, method],
                          })
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          selected
                            ? "border-blue-500 bg-blue-600 text-white"
                            : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                        }`}
                      >
                        {method}
                      </button>
                    );
                  })}
                </div>

                {editForm.allowedMethods.length === 0 && (
                  <p className="mt-2 text-xs text-red-400">
                    Select at least one HTTP method.
                  </p>
                )}
              </section>

              {/* Request settings */}
              <section>
                <h3 className="text-sm font-semibold text-white">
                  Request settings
                </h3>

                <div className="mt-4">
                  <label className="text-sm text-slate-300">Timeout (ms)</label>

                  <input
                    type="number"
                    min="1"
                    value={editForm.timeoutMs}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        timeoutMs: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </section>

              {/* Retry policy */}
              <section>
                <h3 className="text-sm font-semibold text-white">
                  Retry policy
                </h3>

                <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={editForm.retryEnabled}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        retryEnabled: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                  />
                  Enable retry policy
                </label>

                {editForm.retryEnabled && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-300">
                        Max retries
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={editForm.maxRetries}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            maxRetries: e.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">
                        Retry delay (ms)
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={editForm.retryDelayMs}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            retryDelayMs: e.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoadingUser}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
