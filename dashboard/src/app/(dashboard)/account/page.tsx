"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorMessage } from "@/components/ui/error-message";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Plan, UserResponse } from "@/modules/users/user.types";

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserResponse | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          throw new Error("Failed to load account information.");
        }

        const data: UserResponse = await response.json();

        setUser(data);
        setSelectedPlan(data.plan);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load account information.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const handlePlanChange = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedPlan || !user || selectedPlan === user.plan) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/auth/plan", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
        }),
      });

      const data: UserResponse = await response.json();

      if (!response.ok) {
        throw new Error("Failed to change plan.");
      }

      setUser(data);
      setSelectedPlan(data.plan);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to change plan.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "This will permanently delete your account and all associated data. This action cannot be undone. Continue?",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete account.");
      }

      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete account.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <main className="px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Account"
          description="Manage your account and gateway plan."
        />

        {isLoading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            Loading account information...
          </div>
        )}

        {!isLoading && error && <ErrorMessage message={error} />}

        {!isLoading && !error && user && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="font-medium text-white">Profile</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Your account information.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Name
                    </p>
                    <p className="mt-1 text-sm text-slate-200">{user.name}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Email
                    </p>
                    <p className="mt-1 text-sm text-slate-200">{user.email}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="font-medium text-white">Gateway plan</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose which gateway features are available to your account.
                </p>

                <form onSubmit={handlePlanChange} className="mt-6">
                  <div className="space-y-3">
                    <label
                      className={`block cursor-pointer rounded-lg border p-4 transition ${
                        selectedPlan === "free"
                          ? "border-blue-500/50 bg-blue-500/5"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value="free"
                        checked={selectedPlan === "free"}
                        onChange={() => setSelectedPlan("free")}
                        className="sr-only"
                      />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">Free</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Basic gateway features.
                          </p>
                        </div>

                        {user.plan === "free" && (
                          <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-400">
                            Current
                          </span>
                        )}
                      </div>
                    </label>

                    <label
                      className={`block cursor-pointer rounded-lg border p-4 transition ${
                        selectedPlan === "pro"
                          ? "border-blue-500/50 bg-blue-500/5"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value="pro"
                        checked={selectedPlan === "pro"}
                        onChange={() => setSelectedPlan("pro")}
                        className="sr-only"
                      />

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">Pro</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Includes additional gateway features.
                          </p>
                        </div>

                        {user.plan === "pro" && (
                          <span className="rounded-full border border-blue-900/50 bg-blue-950/40 px-2.5 py-1 text-xs font-medium text-blue-400">
                            Current
                          </span>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="mt-5">
                    <SubmitButton
                      isSubmitting={isSaving}
                      submittingText="Changing plan..."
                    >
                      Change plan
                    </SubmitButton>
                  </div>
                </form>
              </section>
            </div>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="font-medium text-white">Account details</h2>
              <p className="mt-1 text-sm text-slate-400">
                Your account identifier.
              </p>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Account ID
                </p>
                <p className="mt-1 break-all font-mono text-sm text-slate-300">
                  {user.id}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-red-900/50 bg-slate-900 p-6">
              <h2 className="font-medium text-red-400">Danger zone</h2>
              <p className="mt-1 text-sm text-slate-400">
                Permanently delete your account and all associated data.
              </p>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="mt-5 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-950/60 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting account..." : "Delete account"}
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
