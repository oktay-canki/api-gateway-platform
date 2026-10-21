"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { ErrorMessage } from "@/components/ui/error-message";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof LoginForm, value: string) => {
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message ?? "Login failed.");
      }

      router.push("/home");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <AuthCard
        title="Welcome back"
        description="Sign in to manage your API gateway."
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-blue-400 transition hover:text-blue-300"
            >
              Create one
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
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
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(value) => handleChange("password", value)}
          />

          <ErrorMessage message={error} />

          <SubmitButton
            isSubmitting={isSubmitting}
            submittingText="Signing in..."
          >
            Sign in
          </SubmitButton>
        </form>
      </AuthCard>
    </main>
  );
}
