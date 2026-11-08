import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "@/lib/validations/auth";
import type { Role } from "@/lib/permissions/roles";

export interface AuthResult {
  user: {
    id: string;
    email: string;
  };
  store?: {
    id: string;
    name: string;
    role: Role;
  };
}

/**
 * Registers an OWNER user, creates their profile, creates the store, and assigns OWNER role atomically.
 */
export async function registerOwner(input: RegisterInput): Promise<AuthResult> {
  const validated = registerSchema.parse(input);

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Create user via admin client with auto-confirmed email (bypasses Supabase SMTP rate limit)
  let userId: string;
  const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
    email: validated.email,
    password: validated.password,
    email_confirm: true,
    user_metadata: {
      full_name: validated.ownerName,
    },
  });

  if (createError) {
    // If the user was already created during an earlier attempt before running SQL
    if (
      createError.message.toLowerCase().includes("already") ||
      createError.message.toLowerCase().includes("registered")
    ) {
      const { data: listData } = await adminSupabase.auth.admin.listUsers();
      const existingUser = listData.users.find(
        (u) => u.email?.toLowerCase() === validated.email.toLowerCase()
      );
      if (existingUser) {
        userId = existingUser.id;
        // Ensure email is confirmed and password updated
        await adminSupabase.auth.admin.updateUserById(userId, {
          password: validated.password,
          email_confirm: true,
          user_metadata: {
            full_name: validated.ownerName,
          },
        });
      } else {
        throw new Error("Email sudah terdaftar. Silakan gunakan email lain atau masuk.");
      }
    } else {
      throw new Error(createError.message || "Gagal membuat akun pengguna");
    }
  } else if (!createData.user) {
    throw new Error("Gagal membuat akun pengguna");
  } else {
    userId = createData.user.id;
  }

  // 2. Call atomic store & owner provisioning RPC via admin client
  const { data: provisionData, error: provisionError } = await adminSupabase.rpc(
    "provision_store_and_owner",
    {
      p_user_id: userId,
      p_full_name: validated.ownerName,
      p_store_name: validated.storeName,
    }
  );

  if (provisionError) {
    console.error("Store provisioning error:", provisionError);
    throw new Error("Gagal menginisialisasi data toko: " + provisionError.message);
  }

  // 3. Establish user session cookies in browser
  await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password,
  });

  const storeInfo = provisionData as {
    store_id: string;
    store_name: string;
    role: Role;
  };

  return {
    user: {
      id: userId,
      email: validated.email,
    },
    store: {
      id: storeInfo.store_id,
      name: storeInfo.store_name,
      role: storeInfo.role,
    },
  };
}

/**
 * Authenticates a user with email and password and verifies store membership.
 */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const validated = loginSchema.parse(input);

  const supabase = await createClient();

  // 1. Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password,
  });

  if (authError || !authData.user) {
    throw new Error("Email atau kata sandi tidak sesuai");
  }

  const userId = authData.user.id;

  // 2. Verify store membership
  const { data: members, error: memberError } = await supabase
    .from("store_members")
    .select("store_id, role, stores(id, name)")
    .eq("user_id", userId)
    .limit(1);

  if (memberError || !members || members.length === 0) {
    throw new Error("Akun ini belum terdaftar di toko manapun. Hubungi pemilik tokomu.");
  }

  const member = members[0];
  const store = member.stores as unknown as { id: string; name: string } | null;

  return {
    user: {
      id: userId,
      email: authData.user.email || validated.email,
    },
    store: {
      id: member.store_id,
      name: store?.name || "Toko Retail",
      role: member.role as Role,
    },
  };
}

/**
 * Signs out the current user session and clears auth cookies.
 */
export async function logoutUser(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

