"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

function demoDestination(role: UserRole, next: string) {
  if (role === "employee") {
    return next.startsWith("/operations") ? next : "/operations";
  }
  if (next.startsWith("/operations")) {
    return "/portal";
  }
  if (next.startsWith("/portal") && !next.startsWith("/portal/login")) {
    return next;
  }
  return "/portal";
}

export async function loginDemo(role: UserRole, next = "/portal") {
  if (isSupabaseConfigured()) {
    redirect(role === "employee" ? "/operations/login" : "/portal/login");
  }

  const cookieStore = await cookies();
  cookieStore.set("flg_demo_session", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(demoDestination(role, next));
}

export async function logoutDemo() {
  const cookieStore = await cookies();
  cookieStore.delete("flg_demo_session");
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/portal/login");
}

export async function logoutEmployee() {
  const cookieStore = await cookies();
  cookieStore.delete("flg_demo_session");
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/operations/login");
}
