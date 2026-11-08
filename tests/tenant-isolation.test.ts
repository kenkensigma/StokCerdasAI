import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission, isOwner, isStaff, type Role, type Permission } from "../src/lib/permissions/roles";

interface UserSession {
  userId: string;
  storeId: string;
  role: Role;
}

/**
 * Tenant isolation simulator function.
 * Enforces that an operation targeted at targetStoreId is only permitted if the session storeId matches.
 */
function verifyStoreAccess(session: UserSession, targetStoreId: string): boolean {
  return session.storeId === targetStoreId;
}

/**
 * Authorization simulator function.
 * Enforces both store boundary AND permission requirement.
 */
function authorizeOperation(
  session: UserSession,
  targetStoreId: string,
  permission: Permission
): { allowed: boolean; reason?: string } {
  if (!verifyStoreAccess(session, targetStoreId)) {
    return { allowed: false, reason: "CROSS_STORE_ACCESS_DENIED" };
  }

  if (!hasPermission(session.role, permission)) {
    return { allowed: false, reason: "INSUFFICIENT_ROLE_PERMISSION" };
  }

  return { allowed: true };
}

test("OWNER has full store permissions", () => {
  const ownerSession: UserSession = {
    userId: "user-owner-001",
    storeId: "store-alpha-001",
    role: "OWNER",
  };

  assert.strictEqual(isOwner(ownerSession.role), true);
  assert.strictEqual(isStaff(ownerSession.role), false);

  const permissions: Permission[] = [
    "view_dashboard",
    "view_products",
    "manage_products",
    "record_sales",
    "view_sales",
    "void_sales",
    "record_stock_in",
    "adjust_stock",
    "view_inventory_analysis",
    "use_ai_assistant",
    "view_reports",
    "manage_team",
    "manage_settings",
  ];

  for (const perm of permissions) {
    const check = authorizeOperation(ownerSession, "store-alpha-001", perm);
    assert.strictEqual(check.allowed, true, `Owner should have ${perm}`);
  }
});

test("STAFF has restricted operational permissions and cannot execute OWNER actions", () => {
  const staffSession: UserSession = {
    userId: "user-staff-001",
    storeId: "store-alpha-001",
    role: "STAFF",
  };

  assert.strictEqual(isOwner(staffSession.role), false);
  assert.strictEqual(isStaff(staffSession.role), true);

  // Allowed operational operations
  const allowedPerms: Permission[] = [
    "view_dashboard",
    "view_products",
    "record_sales",
    "view_sales",
    "record_stock_in",
  ];

  for (const perm of allowedPerms) {
    const check = authorizeOperation(staffSession, "store-alpha-001", perm);
    assert.strictEqual(check.allowed, true, `Staff should be allowed ${perm}`);
  }

  // Forbidden operations (restricted to OWNER only)
  const forbiddenPerms: Permission[] = [
    "manage_products",
    "void_sales",
    "adjust_stock",
    "view_inventory_analysis",
    "use_ai_assistant",
    "view_reports",
    "manage_team",
    "manage_settings",
  ];

  for (const perm of forbiddenPerms) {
    const check = authorizeOperation(staffSession, "store-alpha-001", perm);
    assert.strictEqual(check.allowed, false, `Staff must not have ${perm}`);
    assert.strictEqual(check.reason, "INSUFFICIENT_ROLE_PERMISSION");
  }
});

test("Tenant Isolation: Store A member cannot access Store B resources", () => {
  const storeAOwner: UserSession = {
    userId: "user-owner-a",
    storeId: "store-aaa-111",
    role: "OWNER",
  };

  const storeBStaff: UserSession = {
    userId: "user-staff-b",
    storeId: "store-bbb-222",
    role: "STAFF",
  };

  // Store A owner trying to access Store B
  const crossAccessA = authorizeOperation(storeAOwner, "store-bbb-222", "view_products");
  assert.strictEqual(crossAccessA.allowed, false);
  assert.strictEqual(crossAccessA.reason, "CROSS_STORE_ACCESS_DENIED");

  // Store B staff trying to access Store A
  const crossAccessB = authorizeOperation(storeBStaff, "store-aaa-111", "record_sales");
  assert.strictEqual(crossAccessB.allowed, false);
  assert.strictEqual(crossAccessB.reason, "CROSS_STORE_ACCESS_DENIED");
});

