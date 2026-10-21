"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiCard } from "@/components/api/api-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { PageHeader } from "@/components/ui/page-header";
import type { ApiResponse } from "@/modules/apis/api.types";

export default function ApisPage() {
  const [apis, setApis] = useState<ApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadApis = async () => {
      try {
        const response = await fetch("/api/apis");

        if (!response.ok) {
          throw new Error("Failed to load APIs.");
        }

        const data: ApiResponse[] = await response.json();
        setApis(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load APIs.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadApis();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="APIs"
          description="Manage your API gateway configurations."
          action={
            <Link
              href="/apis/new"
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              Create API
            </Link>
          }
        />

        {isLoading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            Loading APIs...
          </div>
        )}

        {!isLoading && error && <ErrorMessage message={error} />}

        {!isLoading && !error && apis.length === 0 && (
          <EmptyState
            title="No APIs yet"
            description="Create your first API to start configuring your gateway."
            action={
              <Link
                href="/apis/new"
                className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                Create API
              </Link>
            }
          />
        )}

        {!isLoading && !error && apis.length > 0 && (
          <div className="grid gap-4">
            {apis.map((api) => (
              <ApiCard key={api.id} api={api} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
