"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Email atau kata sandi tidak valid");
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk ke akun");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Masuk ke Akun</CardTitle>
        <CardDescription>
          Masukkan email dan kata sandi yang telah terdaftar
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200" role="alert">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Email Akun
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="nama@tokomu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Kata Sandi
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Masuk ke Toko
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        <p>
          Belum memiliki akun toko?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Daftar pemilik toko baru
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Beranda
        </Link>

        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg shadow-xs">
            SC
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">{siteConfig.name}</span>
        </div>
        <p className="text-center text-sm text-slate-500">
          Masuk untuk mengelola stok dan transaksi tokomu
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <React.Suspense
          fallback={
            <Card className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-11 w-full" />
            </Card>
          }
        >
          <LoginForm />
        </React.Suspense>
      </div>
    </div>
  );
}
