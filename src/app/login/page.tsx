"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { authApi } from "@/lib/api/modules/auth";
import { routePaths } from "@/lib/config";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(routePaths.dashboard);
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await authApi.login({ email, password });
      await login(token);
      router.replace(routePaths.dashboard);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError((err.response?.data as { message?: string } | undefined)?.message || "Invalid credentials");
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <section className="w-full max-w-md rounded-2xl p-7 shadow-xl panel">
        <h1 className="text-2xl font-semibold">
          AdminApp Login
        </h1>
        <p className="mt-2 text-sm muted">
          Admins are provisioned via API only. No self-registration.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm muted">
              Email
            </label>
            <input
              className="input w-full"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm muted">
              Password
            </label>
            <input
              className="input w-full"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
