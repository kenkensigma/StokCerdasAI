"use client";

import * as React from "react";
import { Plus, Trash2, Edit2, X, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
}

interface CategoryManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategoryChanged: () => void;
}

export function CategoryManagerDialog({
  isOpen,
  onClose,
  categories,
  onCategoryChanged,
}: CategoryManagerDialogProps) {
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal membuat kategori");
      setNewCategoryName("");
      onCategoryChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat kategori");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal memperbarui kategori");
      setEditingId(null);
      onCategoryChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui kategori");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Kategori hanya bisa dihapus jika tidak digunakan produk manapun.`)) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal menghapus kategori");
      onCategoryChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus kategori");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h3 className="font-semibold text-slate-900">Kelola Kategori Produk</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Tutup dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="Nama kategori baru..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={isLoading}
              className="text-xs"
            />
            <Button type="submit" size="sm" isLoading={isLoading} className="shrink-0 gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </Button>
          </form>

          {/* Category List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-md">
            {categories.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">Belum ada kategori</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-3 py-2 text-xs">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 text-xs"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(cat.id)}
                        disabled={isLoading}
                        className="h-8 px-2 text-xs"
                      >
                        Simpan
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="h-8 px-2 text-xs"
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-slate-800 truncate">{cat.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.name);
                          }}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Ubah nama"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100"
                          title="Hapus kategori"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Selesai
          </Button>
        </div>
      </div>
    </div>
  );
}

