import { createClient } from "@/lib/supabase/server";
import { hasPermission, type Permission, type Role } from "@/lib/permissions/roles";
import type { Database } from "@/types/database.types";

export interface ActiveStoreContext {
  storeId: string;
  storeName: string;
  role: Role;
  userId: string;
  userEmail: string;
  userName: string;
}

/**
 * Retrieves the current authenticated user from Supabase Auth.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Retrieves the user's profile record.
 */
export async function getCurrentProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

/**
 * Retrieves all store memberships for the current user.
 */
export async function getUserStoreMemberships(userId: string) {
  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("store_members")
    .select("id, store_id, role, created_at, stores(id, name, address, phone)")
    .eq("user_id", userId);

  if (error || !members) {
    return [];
  }

  return members;
}

/**
 * Resolves the user's active store context.
 * In MVP, small retail users have one active store.
 */
export async function getActiveStoreContext(): Promise<ActiveStoreContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getCurrentProfile(user.id);
  const memberships = await getUserStoreMemberships(user.id);

  if (!memberships || memberships.length === 0) {
    return null;
  }

  const primaryMembership = memberships[0];
  const store = primaryMembership.stores as unknown as Database["public"]["Tables"]["stores"]["Row"] | null;

  return {
    storeId: primaryMembership.store_id,
    storeName: store?.name || "Toko Retail",
    role: primaryMembership.role as Role,
    userId: user.id,
    userEmail: user.email || "",
    userName: profile?.full_name || user.user_metadata?.full_name || "Pengguna",
  };
}

/**
 * Asserts the user is authenticated. Throws an Error if not.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

/**
 * Asserts the user has an active store membership and optionally checks permission.
 */
export async function requireStoreMember(permission?: Permission): Promise<ActiveStoreContext> {
  const context = await getActiveStoreContext();

  if (!context) {
    throw new Error("NO_STORE_MEMBERSHIP");
  }

  if (permission && !hasPermission(context.role, permission)) {
    throw new Error("FORBIDDEN");
  }

  return context;
}

