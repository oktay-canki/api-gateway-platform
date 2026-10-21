"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ApiResponse } from "@/modules/apis/api.types";
import type { UserResponse } from "@/modules/users/user.types";

export default function Home() {
  const [apis, setApis] = useState<ApiResponse[]>([]);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [apisResponse, userResponse] = await Promise.all([
          fetch("/api/apis"),
          fetch("/api/auth/me"),
        ]);

        const [apisData, userData] = await Promise.all([
          apisResponse.json(),
          userResponse.json(),
        ]);

        if (!apisResponse.ok) {
          throw new Error(apisData.message ?? "Failed to load APIs.");
        }

        if (!userResponse.ok) {
          throw new Error(userData.message ?? "Failed to load account.");
        }

        setApis(apisData);
        setUser(userData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load dashboard.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-200">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            Overview of your APIs and account.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {/* Overview */}
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Total APIs</p>

            <p className="mt-3 text-3xl font-semibold text-white">
              {isLoading ? "—" : apis.length}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              APIs configured in your account
            </p>

            <Link
              href="/apis"
              className="mt-5 inline-block text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              View all APIs →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Current plan</p>

            <p className="mt-3 text-3xl font-semibold capitalize text-white">
              {isLoading ? "—" : (user?.plan ?? "Unavailable")}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Your current subscription
            </p>

            <Link
              href="/account"
              className="mt-5 inline-block text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              Manage account →
            </Link>
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Quick actions</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link
              href="/apis"
              className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-900/80"
            >
              <h3 className="font-medium text-slate-100 transition group-hover:text-blue-400">
                Manage APIs
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Create APIs, configure rate limits, and manage route rules.
              </p>
            </Link>

            <Link
              href="/account"
              className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-900/80"
            >
              <h3 className="font-medium text-slate-100 transition group-hover:text-blue-400">
                Account settings
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                View your account details and subscription plan.
              </p>
            </Link>
          </div>
        </section>

        {/* API list / empty state */}
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Your APIs</h2>

            <Link
              href="/apis"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              View all →
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {isLoading ? (
              <p className="p-6 text-sm text-slate-400">Loading APIs...</p>
            ) : error ? (
              <p className="p-6 text-sm text-slate-400">
                API information is unavailable.
              </p>
            ) : apis.length === 0 ? (
              <div className="p-6">
                <h3 className="font-medium text-white">No APIs yet</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Create your first API to start configuring your gateway.
                </p>

                <Link
                  href="/apis"
                  className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                  Get started
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {apis.slice(0, 5).map((api) => (
                  <Link
                    key={api.id}
                    href={`/apis/${api.id}`}
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-800/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">
                        {api.name}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-400">
                        {api.baseUrl}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          api.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {api.status}
                      </span>

                      <span className="text-slate-500">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
