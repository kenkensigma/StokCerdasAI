import { z } from "zod";

export const registerSchema = z
  .object({
    ownerName: z
      .string()
      .trim()
      .min(2, "Nama pemilik minimal 2 karakter")
      .max(100, "Nama pemilik maksimal 100 karakter"),
    storeName: z
      .string()
      .trim()
      .min(2, "Nama toko minimal 2 karakter")
      .max(100, "Nama toko maksimal 100 karakter"),
    email: z
      .string()
      .trim()
      .email("Format email tidak valid")
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter")
      .max(100, "Kata sandi maksimal 100 karakter"),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi kata sandi minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .toLowerCase(),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

