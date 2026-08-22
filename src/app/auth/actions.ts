"use server";

import { redirect } from "next/navigation";
import { homePathFor, loginPathFor } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export async function loginWithPassword(
  door: UserRole,
  formData: FormData
): Promise<{ error: string } | void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || homePathFor(door);

  if (!isSupabaseConfigured()) {
    return { error: "Sign-in is unavailable right now." };
  }
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return { error: error?.message ?? "Could not sign in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== door) {
    await supabase.auth.signOut();
    return {
      error:
        door === "employee"
          ? "This sign-in is for employees."
          : "This portal is for customers.",
    };
  }

  redirect(next.startsWith("/") ? next : homePathFor(door));
}

export async function logout(door: UserRole = "customer") {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore missing env during local preview.
    }
  }
  redirect(loginPathFor(door));
}
