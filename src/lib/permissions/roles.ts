export type Role = "OWNER" | "STAFF";

export interface StoreMembership {
  storeId: string;
  userId: string;
  role: Role;
}

export type Permission =
  | "view_dashboard"
  | "view_products"
  | "manage_products" // create, edit, archive
  | "record_sales"
  | "view_sales"
  | "void_sales"
  | "record_stock_in"
  | "adjust_stock"
  | "view_inventory_analysis" // AI analysis & predictions
  | "use_ai_assistant"        // AI business assistant chat
  | "view_reports"            // Financial & business reports
  | "manage_team"
  | "manage_settings";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
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
  ],
  STAFF: [
    "view_dashboard",
    "view_products",
    "record_sales",
    "view_sales",
    "record_stock_in",
  ],
};

/**
 * Check if a role has a given permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Helper to assert OWNER role.
 */
export function isOwner(role: Role): boolean {
  return role === "OWNER";
}

/**
 * Helper to assert STAFF role.
 */
export function isStaff(role: Role): boolean {
  return role === "STAFF";
}

