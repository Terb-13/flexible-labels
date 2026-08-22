"use server";

import { logout } from "@/app/auth/actions";

export async function logoutPortal() {
  return logout("customer");
}
