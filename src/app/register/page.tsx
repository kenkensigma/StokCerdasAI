"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";

export default function RegisterPage() {
  const router = useRouter();
  const [ownerName, setOwnerName] = React.useState("");
  const [storeName, setStoreName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName,
          storeName,
          email,
          password,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Pendaftaran gagal");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftar");
    } finally {
      setIsLoading(false);
    }
  };

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
          Registrasi toko retail baru dan mulai kelola stok dengan rapi
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Daftarkan Toko Baru</CardTitle>
            <CardDescription>
              Akun pendaftaran pertama akan secara otomatis menjadi Pemilik Toko (OWNER).
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
                  htmlFor="ownerName"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Nama Lengkap Pemilik
                </label>
                <Input
                  id="ownerName"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="storeName"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Nama Toko Retail / Kelontong
                </label>
                <Input
                  id="storeName"
                  type="text"
                  placeholder="Contoh: Toko Berkah Jaya"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email Akun
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="budi@tokoberkah.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
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
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Konfirmasi Kata Sandi
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ketik ulang kata sandi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Daftarkan Toko Sekarang
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            <p>
              Sudah memiliki akun toko?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Masuk ke akun toko
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
