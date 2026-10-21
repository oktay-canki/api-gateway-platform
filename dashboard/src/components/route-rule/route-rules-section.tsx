"use client";

import { useEffect, useState } from "react";

import type {
  HttpMethod,
  RateLimit,
  RateLimitAlgorithm,
} from "@/modules/apis/api.types";
import { HTTP_METHODS } from "@/modules/apis/api.types";
import type { RouteRuleResponse } from "@/modules/route-rules/route-rule.types";
import { formatDuration } from "@/utils/format-duration";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";

type RouteRuleForm = {
  routePattern: string;
  rateLimitOverride: boolean;
  rateLimitAlgorithm: RateLimitAlgorithm;
  maxRequests: string;
  windowMs: string;
  capacity: string;
  refillRate: string;
  refillIntervalMs: string;
  allowedMethodsOverride: boolean;
  allowedMethods: HttpMethod[];
  timeoutOverride: boolean;
  timeoutMs: string;
  retryPolicyOverride: boolean;
  retryEnabled: boolean;
  maxRetries: string;
  retryDelayMs: string;
};

type RouteRulePayload = {
  routePattern: string;
  rateLimit?: RateLimit | null;
  allowedMethods?: HttpMethod[] | null;
  timeoutMs?: number | null;
  retryPolicy?: {
    enabled: boolean;
    maxRetries: number;
    retryDelayMs: number;
  } | null;
};

type RouteRulesSectionProps = {
  apiId: string;
  apiAllowedMethods: HttpMethod[];
  isFreePlan: boolean;
};

type ApiResponseBody = {
  data: unknown;
  message: string | null;
};

const inputClassName =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40";

const checkboxClassName =
  "h-4 w-4 rounded border-slate-700 bg-slate-950 accent-blue-500";

async function readResponse(response: Response): Promise<ApiResponseBody> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data: unknown = await response.json();

      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : null;

      return { data, message };
    } catch {
      return {
        data: null,
        message: `The server returned invalid JSON (HTTP ${response.status}).`,
      };
    }
  }

  const text = await response.text();

  if (text.trim().startsWith("<")) {
    return {
      data: text,
      message: `The server returned an HTML response instead of JSON (HTTP ${response.status}). Check the API route and server logs.`,
    };
  }

  return {
    data: text,
    message: text.trim() || null,
  };
}

function createForm(
  apiAllowedMethods: HttpMethod[],
  rule?: RouteRuleResponse,
): RouteRuleForm {
  const rateLimit = rule?.rateLimit;

  return {
    routePattern: rule?.routePattern ?? "",

    rateLimitOverride: Boolean(rateLimit),
    rateLimitAlgorithm: rateLimit?.algorithm ?? "sliding-window",
    maxRequests:
      rateLimit?.algorithm === "sliding-window"
        ? String(rateLimit.maxRequests)
        : "100",
    windowMs:
      rateLimit?.algorithm === "sliding-window"
        ? String(rateLimit.windowMs)
        : "60000",
    capacity:
      rateLimit?.algorithm === "token-bucket"
        ? String(rateLimit.capacity)
        : "100",
    refillRate:
      rateLimit?.algorithm === "token-bucket"
        ? String(rateLimit.refillRate)
        : "10",
    refillIntervalMs:
      rateLimit?.algorithm === "token-bucket"
        ? String(rateLimit.refillIntervalMs)
        : "1000",

    allowedMethodsOverride: Boolean(rule?.allowedMethods),
    allowedMethods: rule?.allowedMethods ?? [...apiAllowedMethods],

    timeoutOverride: rule?.timeoutMs !== undefined,
    timeoutMs: rule?.timeoutMs !== undefined ? String(rule.timeoutMs) : "5000",

    retryPolicyOverride: Boolean(rule?.retryPolicy),
    retryEnabled: rule?.retryPolicy?.enabled ?? true,
    maxRetries:
      rule?.retryPolicy !== undefined
        ? String(rule.retryPolicy.maxRetries)
        : "3",
    retryDelayMs:
      rule?.retryPolicy !== undefined
        ? String(rule.retryPolicy.retryDelayMs)
        : "1000",
  };
}

function formatRouteRateLimit(rateLimit?: RateLimit): string {
  if (!rateLimit) return "Use API default";

  if (rateLimit.algorithm === "sliding-window") {
    return `${rateLimit.maxRequests} requests / ${formatDuration(rateLimit.windowMs)}`;
  }

  return `${rateLimit.capacity} tokens · refill ${rateLimit.refillRate} every ${formatDuration(rateLimit.refillIntervalMs)}`;
}

function buildPayload(
  form: RouteRuleForm,
  editingRule: RouteRuleResponse | null,
): RouteRulePayload {
  const payload: RouteRulePayload = {
    routePattern: form.routePattern.trim(),
  };

  if (form.rateLimitOverride) {
    payload.rateLimit =
      form.rateLimitAlgorithm === "sliding-window"
        ? {
            algorithm: "sliding-window",
            maxRequests: Number(form.maxRequests),
            windowMs: Number(form.windowMs),
          }
        : {
            algorithm: "token-bucket",
            capacity: Number(form.capacity),
            refillRate: Number(form.refillRate),
            refillIntervalMs: Number(form.refillIntervalMs),
          };
  } else if (editingRule?.rateLimit) {
    payload.rateLimit = null;
  }

  if (form.allowedMethodsOverride) {
    payload.allowedMethods = form.allowedMethods;
  } else if (editingRule?.allowedMethods) {
    payload.allowedMethods = null;
  }

  if (form.timeoutOverride) {
    payload.timeoutMs = Number(form.timeoutMs);
  } else if (editingRule?.timeoutMs !== undefined) {
    payload.timeoutMs = null;
  }

  if (form.retryPolicyOverride) {
    payload.retryPolicy = {
      enabled: form.retryEnabled,
      maxRetries: Number(form.maxRetries),
      retryDelayMs: Number(form.retryDelayMs),
    };
  } else if (editingRule?.retryPolicy) {
    payload.retryPolicy = null;
  }

  return payload;
}

export function RouteRulesSection({
  apiId,
  apiAllowedMethods,
  isFreePlan,
}: RouteRulesSectionProps) {
  const [rules, setRules] = useState<RouteRuleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RouteRuleResponse | null>(
    null,
  );
  const [form, setForm] = useState<RouteRuleForm | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadRules() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/apis/${apiId}/routes`);
        const { data, message } = await readResponse(response);

        if (!response.ok) {
          throw new Error(message ?? "Failed to load route rules.");
        }

        if (isActive) {
          if (!Array.isArray(data)) {
            throw new Error(
              "The server returned an invalid route rules response.",
            );
          }

          setRules(data as RouteRuleResponse[]);
        }
      } catch (error) {
        if (isActive) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load route rules.",
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadRules();

    return () => {
      isActive = false;
    };
  }, [apiId]);

  useEffect(() => {
    if (!isFormOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFormOpen]);

  function updateForm(patch: Partial<RouteRuleForm>) {
    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  function openCreateModal() {
    setEditingRule(null);
    setForm(createForm(apiAllowedMethods));
    setFormError("");
    setActionError("");
    setIsFormOpen(true);
  }

  function openEditModal(rule: RouteRuleResponse) {
    setEditingRule(rule);
    setForm(createForm(apiAllowedMethods, rule));
    setFormError("");
    setActionError("");
    setIsFormOpen(true);
  }

  function closeModal() {
    if (isSaving) return;

    setIsFormOpen(false);
    setEditingRule(null);
    setForm(null);
    setFormError("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) return;

    if (
      form.rateLimitOverride &&
      form.rateLimitAlgorithm === "token-bucket" &&
      isFreePlan
    ) {
      setFormError("Token bucket rate limiting requires a Pro plan.");
      return;
    }

    if (form.allowedMethodsOverride && form.allowedMethods.length === 0) {
      setFormError("Select at least one HTTP method.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const url = editingRule
        ? `/api/apis/${apiId}/routes/${editingRule.id}`
        : `/api/apis/${apiId}/routes`;

      const response = await fetch(url, {
        method: editingRule ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload(form, editingRule)),
      });

      const { data, message } = await readResponse(response);

      if (!response.ok) {
        throw new Error(message ?? "Failed to save route rule.");
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("id" in data) ||
        typeof data.id !== "string"
      ) {
        throw new Error("The server returned an invalid route rule response.");
      }

      const savedRule = data as RouteRuleResponse;

      setRules((current) =>
        editingRule
          ? current.map((rule) => (rule.id === savedRule.id ? savedRule : rule))
          : [savedRule, ...current],
      );

      setIsFormOpen(false);
      setEditingRule(null);
      setForm(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save route rule.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(rule: RouteRuleResponse) {
    const confirmed = window.confirm(
      `Delete the route rule "${rule.routePattern}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(rule.id);
    setActionError("");

    try {
      const response = await fetch(`/api/apis/${apiId}/routes/${rule.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const { message } = await readResponse(response);
        throw new Error(message ?? "Failed to delete route rule.");
      }

      setRules((current) => current.filter((item) => item.id !== rule.id));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to delete route rule.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold text-white">Route Rules</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure route-specific overrides for this API.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Create route rule
        </button>
      </div>

      {loadError && (
        <div className="mt-5">
          <ErrorMessage message={loadError} />
        </div>
      )}

      {actionError && (
        <div className="mt-5">
          <ErrorMessage message={actionError} />
        </div>
      )}

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-400">Loading route rules...</p>
      ) : !loadError && rules.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No route rules yet"
            description="Create a route rule to configure behavior for a specific route pattern."
            action={
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                Create your first route rule
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rules.map((rule) => (
            <article
              key={rule.id}
              className="rounded-lg border border-slate-800 bg-slate-950 p-4 sm:p-5"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <code className="break-all text-sm font-medium text-blue-300">
                    {rule.routePattern}
                  </code>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Rate limit
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatRouteRateLimit(rule.rateLimit)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Allowed methods
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {rule.allowedMethods?.join(" · ") ?? "Use API defaults"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Timeout
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {rule.timeoutMs !== undefined
                          ? formatDuration(rule.timeoutMs)
                          : "Use API default"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Retry policy
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {rule.retryPolicy
                          ? rule.retryPolicy.enabled
                            ? `${rule.retryPolicy.maxRetries} retries · ${formatDuration(rule.retryPolicy.retryDelayMs)} delay`
                            : "Disabled"
                          : "Use API default"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(rule)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(rule)}
                    disabled={deletingId === rule.id}
                    className="rounded-lg border border-red-900/60 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === rule.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
                Updated {new Date(rule.updatedAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}

      {isFormOpen && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editingRule ? "Edit route rule" : "Create route rule"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Route-specific settings override the API defaults.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close"
                className="text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-8 p-6">
                {formError && <ErrorMessage message={formError} />}

                <section>
                  <h3 className="text-sm font-semibold text-white">Route</h3>

                  <label
                    htmlFor="routePattern"
                    className="mt-4 block text-sm text-slate-300"
                  >
                    Route pattern
                  </label>

                  <input
                    id="routePattern"
                    type="text"
                    required
                    autoFocus
                    value={form.routePattern}
                    onChange={(event) =>
                      updateForm({ routePattern: event.target.value })
                    }
                    placeholder="/users/:id or /users/*"
                    className={inputClassName}
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Use :name for a named parameter and * for a wildcard path.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    Rate limiting
                  </h3>

                  <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.rateLimitOverride}
                      onChange={(event) =>
                        updateForm({
                          rateLimitOverride: event.target.checked,
                        })
                      }
                      className={checkboxClassName}
                    />
                    Override API rate limit
                  </label>

                  {!form.rateLimitOverride ? (
                    <p className="mt-2 text-xs text-slate-500">
                      The API-level rate limit will apply to this route.
                    </p>
                  ) : (
                    <>
                      <label className="mt-4 block text-sm text-slate-300">
                        Algorithm
                      </label>

                      <select
                        value={form.rateLimitAlgorithm}
                        onChange={(event) =>
                          updateForm({
                            rateLimitAlgorithm: event.target
                              .value as RateLimitAlgorithm,
                          })
                        }
                        className={inputClassName}
                      >
                        <option value="sliding-window">Sliding window</option>
                        <option value="token-bucket" disabled={isFreePlan}>
                          Token bucket{isFreePlan ? " (Pro plan)" : ""}
                        </option>
                      </select>

                      {isFreePlan && (
                        <p className="mt-2 text-xs text-slate-500">
                          Token bucket rate limiting requires a Pro plan.
                        </p>
                      )}

                      {form.rateLimitAlgorithm === "sliding-window" ? (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="text-sm text-slate-300">
                              Max requests
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={form.maxRequests}
                              onChange={(event) =>
                                updateForm({
                                  maxRequests: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          </div>

                          <div>
                            <label className="text-sm text-slate-300">
                              Window (ms)
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={form.windowMs}
                              onChange={(event) =>
                                updateForm({ windowMs: event.target.value })
                              }
                              className={inputClassName}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="text-sm text-slate-300">
                              Capacity
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={form.capacity}
                              onChange={(event) =>
                                updateForm({ capacity: event.target.value })
                              }
                              className={inputClassName}
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
                              required
                              value={form.refillRate}
                              onChange={(event) =>
                                updateForm({ refillRate: event.target.value })
                              }
                              className={inputClassName}
                            />
                          </div>

                          <div>
                            <label className="text-sm text-slate-300">
                              Refill interval (ms)
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={form.refillIntervalMs}
                              onChange={(event) =>
                                updateForm({
                                  refillIntervalMs: event.target.value,
                                })
                              }
                              className={inputClassName}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    Allowed HTTP methods
                  </h3>

                  <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.allowedMethodsOverride}
                      onChange={(event) =>
                        updateForm({
                          allowedMethodsOverride: event.target.checked,
                        })
                      }
                      className={checkboxClassName}
                    />
                    Override API allowed methods
                  </label>

                  {form.allowedMethodsOverride ? (
                    <>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {HTTP_METHODS.map((method) => {
                          const selected = form.allowedMethods.includes(method);

                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() =>
                                updateForm({
                                  allowedMethods: selected
                                    ? form.allowedMethods.filter(
                                        (item) => item !== method,
                                      )
                                    : [...form.allowedMethods, method],
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

                      {form.allowedMethods.length === 0 && (
                        <p className="mt-2 text-xs text-red-400">
                          Select at least one HTTP method.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      The API-level allowed methods will apply.
                    </p>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    Request timeout
                  </h3>

                  <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.timeoutOverride}
                      onChange={(event) =>
                        updateForm({ timeoutOverride: event.target.checked })
                      }
                      className={checkboxClassName}
                    />
                    Override API timeout
                  </label>

                  {form.timeoutOverride ? (
                    <>
                      <label className="mt-4 block text-sm text-slate-300">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={form.timeoutMs}
                        onChange={(event) =>
                          updateForm({ timeoutMs: event.target.value })
                        }
                        className={inputClassName}
                      />
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      The API-level timeout will apply.
                    </p>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    Retry policy
                  </h3>

                  <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.retryPolicyOverride}
                      onChange={(event) =>
                        updateForm({
                          retryPolicyOverride: event.target.checked,
                        })
                      }
                      className={checkboxClassName}
                    />
                    Override API retry policy
                  </label>

                  {form.retryPolicyOverride ? (
                    <>
                      <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={form.retryEnabled}
                          onChange={(event) =>
                            updateForm({
                              retryEnabled: event.target.checked,
                            })
                          }
                          className={checkboxClassName}
                        />
                        Enable retries for this route
                      </label>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm text-slate-300">
                            Max retries
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="1"
                            required
                            value={form.maxRetries}
                            onChange={(event) =>
                              updateForm({ maxRetries: event.target.value })
                            }
                            className={inputClassName}
                          />
                        </div>

                        <div>
                          <label className="text-sm text-slate-300">
                            Retry delay (ms)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={form.retryDelayMs}
                            onChange={(event) =>
                              updateForm({ retryDelayMs: event.target.value })
                            }
                            className={inputClassName}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      The API-level retry policy will apply.
                    </p>
                  )}
                </section>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving
                    ? "Saving..."
                    : editingRule
                      ? "Save changes"
                      : "Create route rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
