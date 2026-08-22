"use server";

import { loginDemo as loginDemoDoor, logout } from "@/app/auth/actions";

export async function loginDemo(role: "customer" | "employee", next = "/portal") {
  return loginDemoDoor(role, next);
}

export async function logoutDemo() {
  return logout("customer");
}
