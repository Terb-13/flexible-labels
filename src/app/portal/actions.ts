"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";

export async function loginDemo(role: UserRole, next = "/portal") {
  const cookieStore = await cookies();
  cookieStore.set("flg_demo_session", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(next);
}

export async function logoutDemo() {
  const cookieStore = await cookies();
  cookieStore.delete("flg_demo_session");
  redirect("/portal/login");
}
