import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

export type AppSession = {
  role: UserRole | null;
  profile: Profile | null;
  source: "supabase" | null;
  userId: string | null;
};

export async function getAppSession(): Promise<AppSession> {
  if (!isSupabaseConfigured()) {
    return { role: null, profile: null, source: null, userId: null };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, company_id, job_title")
        .eq("id", user.id)
        .single();
      if (profile?.role === "customer" || profile?.role === "employee") {
        return {
          role: profile.role,
          profile: profile as Profile,
          source: "supabase",
          userId: user.id,
        };
      }
    }
  } catch {
    return { role: null, profile: null, source: null, userId: null };
  }

  return { role: null, profile: null, source: null, userId: null };
}

export function loginPathFor(role: UserRole): string {
  return role === "employee" ? "/operations/login" : "/portal/login";
}

export function homePathFor(role: UserRole): string {
  return role === "employee" ? "/operations" : "/portal";
}
