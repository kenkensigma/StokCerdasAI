"use client";

import * as React from "react";
import {
  Store,
  Users,
  ShieldCheck,
  UserPlus,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Mail,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleRestrictedCard } from "@/components/auth/role-restricted-card";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { StoreDetails, StoreMemberItem } from "@/services/store-settings.service";

export default function SettingsPage() {
  const { isOwner, isLoading: isAuthLoading } = useAuthSession();
  const [activeTab, setActiveTab] = React.useState<"store" | "team">("store");

  // Store profile states
  const [store, setStore] = React.useState<StoreDetails | null>(null);
  const [storeName, setStoreName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [isStoreLoading, setIsStoreLoading] = React.useState(true);
  const [isSavingStore, setIsSavingStore] = React.useState(false);

  // Team states
  const [members, setMembers] = React.useState<StoreMemberItem[]>([]);
  const [isTeamLoading, setIsTeamLoading] = React.useState(true);
  const [isAddStaffOpen, setIsAddStaffOpen] = React.useState(false);
  const [staffName, setStaffName] = React.useState("");
  const [staffEmail, setStaffEmail] = React.useState("");
  const [staffPassword, setStaffPassword] = React.useState("");
  const [isCreatingStaff, setIsCreatingStaff] = React.useState(false);

  // Global feedbacks
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
  };

  // 1. Fetch Store Profile on mount
  React.useEffect(() => {
    let isCancelled = false;

    fetch("/api/settings/store")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data toko.");
        return res.json();
      })
      .then((json) => {
        if (!isCancelled) {
          const s: StoreDetails = json.data;
          setStore(s);
          setStoreName(s.name);
          setPhone(s.phone || "");
          setAddress(s.address || "");
        }
      })
      .catch(() => {
        if (!isCancelled) showError("Gagal mengambil data toko.");
      })
      .finally(() => {
        if (!isCancelled) setIsStoreLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Fetch Team Members on mount
  React.useEffect(() => {
    let isCancelled = false;

    fetch("/api/settings/staff")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil daftar tim.");
        return res.json();
      })
      .then((json) => {
        if (!isCancelled) {
          setMembers(json.data || []);
        }
      })
      .catch(() => {
        if (!isCancelled) showError("Gagal mengambil daftar tim.");
      })
      .finally(() => {
        if (!isCancelled) setIsTeamLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle Save Store Profile
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      showError("Nama toko tidak boleh kosong.");
      return;
    }

    setIsSavingStore(true);
    try {
      const res = await fetch("/api/settings/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: storeName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || "Gagal memperbarui profil toko");
      }

      const resJson = await res.json();
      if (resJson.data) {
        setStore(resJson.data);
        setStoreName(resJson.data.name);
        setPhone(resJson.data.phone || "");
        setAddress(resJson.data.address || "");
      }
      showSuccess("Profil toko berhasil diperbarui!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal memperbarui profil toko");
    } finally {
      setIsSavingStore(false);
    }
  };

  // Handle Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      showError("Seluruh kolom staf wajib diisi.");
      return;
    }

    if (staffPassword.length < 8) {
      showError("Password staf minimal 8 karakter.");
      return;
    }

    setIsCreatingStaff(true);
    try {
      const res = await fetch("/api/settings/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: staffName.trim(),
          email: staffEmail.trim(),
          password: staffPassword,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || "Gagal membuat akun staf");
      }

      if (resJson.data) {
        setMembers((prev) => [...prev, resJson.data]);
      }

      showSuccess(`Akun staf "${staffName}" berhasil dibuat!`);
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setIsAddStaffOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal membuat akun staf");
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  if (!isAuthLoading && !isOwner) {
    return (
      <RoleRestrictedCard
        title="Pengaturan Toko — Khusus Pemilik Toko"
        description="Halaman profil toko dan penambahan akun staf hanya dapat diakses oleh Pemilik Toko (OWNER). Akun Anda terdaftar sebagai Staf Toko (STAFF) dengan wewenang operasional kasir dan stok fisik."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan Toko & Manajemen Tim
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola profil bisnis toko dan otorisasi peran anggota tim kasir operasional.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab("store")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "store"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Store className="h-4 w-4" />
          Profil Toko
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "team"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          Tim & Staf Kasir ({members.length})
        </button>
      </div>

      {/* Tab 1: Profil Toko */}
      {activeTab === "store" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Bisnis Toko</CardTitle>
                <CardDescription className="text-xs">
                  Informasi ini ditampilkan pada laporan, antarmuka kasir, dan identitas toko
                </CardDescription>
              </CardHeader>

              <CardContent>
                {isStoreLoading ? (
                  <div className="space-y-4 py-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveStore} className="space-y-4 text-xs sm:text-sm">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-slate-400" />
                        Nama Toko *
                      </label>
                      <Input
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Contoh: Toko Berkah Mandiri"
                        required
                        className="text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        Nomor Telepon / WhatsApp
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        Alamat Toko
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Contoh: Jl. Sudirman No. 45, Denpasar"
                        rows={3}
                        className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs sm:text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSavingStore}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSavingStore ? "Menyimpan..." : "Simpan Perubahan"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  Isolasi Data Toko (Tenant)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  Setiap toko di <strong>StokCerdas AI</strong> memiliki partisi database independen yang dilindungi oleh <strong>Row-Level Security (RLS) PostgreSQL</strong>.
                </p>
                <p>
                  Staf atau pihak lain dari toko berbeda tidak dapat melihat maupun mengakses produk, transaksi, dan metrik tokomu.
                </p>
                <div className="pt-2 border-t border-slate-200 text-slate-400">
                  ID Toko: <span className="font-mono text-slate-600">{store?.id || "-"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Tim & Staf Kasir */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Daftar Anggota Tim & Kasir
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Kelola staf yang memiliki hak mencatat penjualan kasir dan penerimaan stok
                </CardDescription>
              </div>

              <div>
                <Button
                  onClick={() => setIsAddStaffOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  Tambah Akun Staf
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {isTeamLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : members.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Belum ada staf terdaftar selain pemilik toko.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 px-3 font-semibold">Nama Anggota</th>
                        <th className="py-2.5 px-3 font-semibold">Peran Akses</th>
                        <th className="py-2.5 px-3 font-semibold">Hak Otorisasi</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Tanggal Terdaftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              {m.fullName}
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            {m.role === "OWNER" ? (
                              <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300 font-bold">
                                OWNER (Pemilik)
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="font-semibold text-slate-700">
                                STAFF (Kasir)
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {m.role === "OWNER"
                              ? "Akses penuh (kelola tim, void transaksi, AI, stok, pengaturan)"
                              : "Operasional harian (kasir POS, catat stok masuk, cek stok)"}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500">
                            {formatDate(m.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal Dialog: Tambah Staf Baru */}
          {isAddStaffOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Tambah Akun Staf Baru
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Buat akun staf kasir operasional untuk mencatat penjualan harian di toko Anda.
                  </p>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Nama Lengkap Staf *
                    </label>
                    <Input
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      Email Staf (Untuk Login) *
                    </label>
                    <Input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="Contoh: budi.kasir@tokoberkah.com"
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                      Password Akun *
                    </label>
                    <Input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  <div className="p-3 bg-blue-50/70 rounded-md border border-blue-100 text-xs text-blue-800">
                    Akun staf otomatis terverifikasi dan dapat langsung login melalui halaman login toko.
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddStaffOpen(false)}
                      disabled={isCreatingStaff}
                      className="text-xs"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreatingStaff}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      {isCreatingStaff ? "Mendaftarkan..." : "Daftarkan Staf"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
