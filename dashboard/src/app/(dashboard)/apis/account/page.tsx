"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  name: string;
  email: string;
  plan: "free" | "pro";
  createdAt: string;
  updatedAt: string;
};

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          router.push("/auth/login");
          return;
        }

        const data = await response.json();
        setUser(data);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-800" />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 text-sm text-slate-400 transition hover:text-slate-200"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage your account information.
          </p>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="font-medium text-white">Profile</h2>
            <p className="mt-1 text-sm text-slate-400">
              Your account information.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            <div className="flex items-center justify-between gap-6 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-slate-200">Name</p>
                <p className="mt-1 text-sm text-slate-400">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-slate-200">Email</p>
                <p className="mt-1 text-sm text-slate-400">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-slate-200">Plan</p>
                <p className="mt-1 text-sm capitalize text-slate-400">
                  {user.plan}
                </p>
              </div>

              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium capitalize text-slate-300">
                {user.plan}
              </span>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm font-medium text-slate-200">Member since</p>

              <p className="mt-1 text-sm text-slate-400">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
