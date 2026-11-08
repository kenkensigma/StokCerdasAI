import { z } from "zod";

export const updateStoreSchema = z.object({
  name: z.string().trim().min(2, "Nama toko minimal 2 karakter").max(100),
  address: z.string().trim().max(300).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
});

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

export const createStaffSchema = z.object({
  fullName: z.string().trim().min(2, "Nama staf minimal 2 karakter").max(100),
  email: z.string().trim().toLowerCase().email("Format email staf tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

