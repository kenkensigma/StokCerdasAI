"use client";

import * as React from "react";
import type { Role } from "@/lib/permissions/roles";

export interface AuthSessionState {
  role: Role | null;
  isOwner: boolean;
  isStaff: boolean;
  userName: string;
  storeName: string;
  isLoading: boolean;
}

export function useAuthSession(): AuthSessionState {
  const [state, setState] = React.useState<AuthSessionState>({
    role: null,
    isOwner: false,
    isStaff: false,
    userName: "",
    storeName: "",
    isLoading: true,
  });

  React.useEffect(() => {
    let isCancelled = false;

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((json) => {
        if (!isCancelled && json.data) {
          const role = json.data.role as Role;
          setState({
            role,
            isOwner: role === "OWNER",
            isStaff: role === "STAFF",
            userName: json.data.userName || "Pengguna",
            storeName: json.data.storeName || "Toko",
            isLoading: false,
          });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return state;
}

