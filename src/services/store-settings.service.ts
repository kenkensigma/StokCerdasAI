import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateStoreSchema,
  createStaffSchema,
  type UpdateStoreInput,
  type CreateStaffInput,
} from "@/lib/validations/settings";
import type { Role } from "@/lib/permissions/roles";

export interface StoreMemberItem {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  role: Role;
  createdAt: string;
}

export interface StoreDetails {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
}

/**
 * Gets store details for a given store ID
 */
export async function getStoreDetails(storeId: string): Promise<StoreDetails> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address, phone, created_at")
    .eq("id", storeId)
    .single();

  if (error || !data) {
    throw new Error("Gagal memuat profil toko: " + (error?.message || "Toko tidak ditemukan"));
  }

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    phone: data.phone,
    createdAt: data.created_at,
  };
}

/**
 * Updates store details (OWNER only)
 */
export async function updateStoreDetails(
  storeId: string,
  input: UpdateStoreInput
): Promise<StoreDetails> {
  const validated = updateStoreSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stores")
    .update({
      name: validated.name,
      address: validated.address || null,
      phone: validated.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .select("id, name, address, phone, created_at")
    .single();

  if (error || !data) {
    throw new Error("Gagal memperbarui profil toko: " + (error?.message || ""));
  }

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    phone: data.phone,
    createdAt: data.created_at,
  };
}

/**
 * Lists all team members (OWNER and STAFF) for a given store
 */
export async function getStoreMembers(storeId: string): Promise<StoreMemberItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("store_members")
    .select(`
      id,
      user_id,
      role,
      created_at,
      profiles:user_id (
        id,
        full_name
      )
    `)
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Gagal memuat daftar anggota tim: " + error.message);
  }

  const members: StoreMemberItem[] = (data || []).map((m) => {
    const p = m.profiles as unknown as { id: string; full_name: string } | null;
    return {
      id: m.id,
      userId: m.user_id,
      fullName: p?.full_name || "Pengguna Toko",
      email: null,
      role: m.role as Role,
      createdAt: m.created_at,
    };
  });

  return members;
}

/**
 * Creates a new STAFF user account and attaches them to the store (OWNER only).
 * Uses admin API to auto-confirm email, bypassing SMTP limitations.
 */
export async function createStaffMember(
  storeId: string,
  input: CreateStaffInput
): Promise<StoreMemberItem> {
  const validated = createStaffSchema.parse(input);
  const adminSupabase = createAdminClient();

  // 1. Create user in Supabase Auth
  const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
    email: validated.email,
    password: validated.password,
    email_confirm: true,
    user_metadata: {
      full_name: validated.fullName,
    },
  });

  let userId: string;

  if (createError) {
    if (createError.message.toLowerCase().includes("already") || createError.message.toLowerCase().includes("registered")) {
      const { data: listData } = await adminSupabase.auth.admin.listUsers();
      const existing = listData.users.find((u) => u.email?.toLowerCase() === validated.email.toLowerCase());
      if (existing) {
        userId = existing.id;
      } else {
        throw new Error("Email staf sudah terdaftar pada sistem.");
      }
    } else {
      throw new Error("Gagal membuat akun staf: " + createError.message);
    }
  } else if (!createData.user) {
    throw new Error("Gagal membuat akun staf.");
  } else {
    userId = createData.user.id;
  }

  // 2. Ensure profile exists
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .upsert({
      id: userId,
      full_name: validated.fullName,
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    console.warn("[createStaffMember] Profile upsert note:", profileError.message);
  }

  // 3. Attach user to store_members as STAFF
  const { data: memberData, error: memberError } = await adminSupabase
    .from("store_members")
    .insert({
      store_id: storeId,
      user_id: userId,
      role: "STAFF",
    })
    .select("id, created_at")
    .single();

  if (memberError) {
    if (memberError.code === "23505") {
      throw new Error("Pengguna ini sudah terdaftar sebagai anggota di toko Anda.");
    }
    throw new Error("Gagal menetapkan peran staf: " + memberError.message);
  }

  return {
    id: memberData.id,
    userId,
    fullName: validated.fullName,
    email: validated.email,
    role: "STAFF",
    createdAt: memberData.created_at,
  };
}

