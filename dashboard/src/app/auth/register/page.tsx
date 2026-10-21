"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { ErrorMessage } from "@/components/ui/error-message";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Plan } from "@/modules/users/user.types";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  plan: Plan;
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    plan: "free",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof RegisterForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message ?? "Registration failed.");
      }

      router.push("/auth/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <AuthCard
        title="Create your account"
        description="Create an account to manage your API gateway."
        footer={
          <>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-400 transition hover:text-blue-300"
            >
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            id="name"
            label="Name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            value={form.name}
            onChange={(value) => handleChange("name", value)}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(value) => handleChange("email", value)}
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(value) => handleChange("password", value)}
          />

          <div>
            <p className="text-sm font-medium text-white">Gateway plan</p>
            <p className="mt-1 text-xs text-slate-400">
              Choose the gateway features available to your account.
            </p>

            <div className="mt-3 space-y-3">
              <label
                className={`block cursor-pointer rounded-lg border p-4 transition ${
                  form.plan === "free"
                    ? "border-blue-500/50 bg-blue-500/5"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value="free"
                  checked={form.plan === "free"}
                  onChange={() =>
                    setForm((current) => ({ ...current, plan: "free" }))
                  }
                  className="sr-only"
                />

                <p className="text-sm font-medium text-white">Free</p>
                <p className="mt-1 text-xs text-slate-400">
                  Basic gateway features.
                </p>
              </label>

              <label
                className={`block cursor-pointer rounded-lg border p-4 transition ${
                  form.plan === "pro"
                    ? "border-blue-500/50 bg-blue-500/5"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value="pro"
                  checked={form.plan === "pro"}
                  onChange={() =>
                    setForm((current) => ({ ...current, plan: "pro" }))
                  }
                  className="sr-only"
                />

                <p className="text-sm font-medium text-white">Pro</p>
                <p className="mt-1 text-xs text-slate-400">
                  Includes additional gateway features.
                </p>
              </label>
            </div>
          </div>

          <ErrorMessage message={error} />

          <SubmitButton
            isSubmitting={isSubmitting}
            submittingText="Creating account..."
          >
            Create account
          </SubmitButton>
        </form>
      </AuthCard>
    </main>
  );
}
