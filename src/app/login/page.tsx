"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { authApi } from "@/lib/api/modules/auth";
import { AdminAccessError } from "@/lib/admin-auth";
import { appConfig, routePaths } from "@/lib/config";
import { AxiosError } from "axios";
import { Lock, Sparkles } from "lucide-react";
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "admin_required") {
      setError("Admin access required. Sign in with an admin account.");
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await authApi.login({ email, password });
      await login(token);
      router.replace(routePaths.dashboard);
    } catch (err: unknown) {
      if (err instanceof AdminAccessError) {
        setError(err.message);
      } else if (err instanceof AxiosError) {
        if (!err.response) {
          setError(
            "Cannot reach the API. Redeploy the latest adminapp code, set NEXT_PUBLIC_API_BASE_URL on Vercel, keep ngrok running, and check Network — login should call this site's /api/v1/auth/login, not ngrok directly."
          );
        } else {
          setError(
            (err.response?.data as { message?: string } | undefined)?.message ||
              "Invalid credentials"
          );
        }
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen">
      <section
        className="hidden flex-1 flex-col justify-between p-12 lg:flex"
        style={{
          background: "linear-gradient(145deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)",
          color: "#fff",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Sparkles size={22} />
          </span>
          <div>
            <p className="text-lg font-bold">{appConfig.productName}</p>
            <p className="text-sm text-white/70">Admin Console</p>
          </div>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            Run your brokerage platform with confidence
          </h1>
          <p className="mt-4 max-w-lg text-white/80">
            Moderate listings, verify brokers, manage subscriptions, and monitor platform health — all in one place.
          </p>
        </div>
        <p className="text-xs text-white/50">Secured access · Admin accounts only</p>
      </section>

      <section className="flex flex-1 items-center justify-center p-6">
        <article className="panel-elevated w-full max-w-md p-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff" }}
            >
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-bold">{appConfig.productName}</p>
              <p className="text-xs muted">Admin sign in</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm muted">Sign in with your admin credentials.</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                className="input w-full"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                className="input w-full"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p
                className="rounded-xl px-3 py-2 text-sm"
                style={{
                  background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                  color: "var(--danger)",
                }}
              >
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2">
              <Lock size={16} />
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
