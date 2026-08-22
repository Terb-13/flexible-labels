import { cookies } from "next/headers";
import { getDemoProfile } from "@/lib/auth/demo-session";
import { isDemoLoginAllowed, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

export type AppSession = {
  role: UserRole | null;
  profile: Profile | null;
  source: "supabase" | "demo" | null;
  userId: string | null;
};

export async function getAppSession(): Promise<AppSession> {
  if (isSupabaseConfigured()) {
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
      // Fall through to demo cookie for local preview.
    }
  }

  if (!isDemoLoginAllowed()) {
    return { role: null, profile: null, source: null, userId: null };
  }

  const cookieStore = await cookies();
  const demo = cookieStore.get("flg_demo_session")?.value;
  if (demo === "customer" || demo === "employee") {
    return {
      role: demo,
      profile: getDemoProfile(demo),
      source: "demo",
      userId: null,
    };
  }

  return { role: null, profile: null, source: null, userId: null };
}

export function loginPathFor(role: UserRole): string {
  return role === "employee" ? "/operations/login" : "/portal/login";
}

export function homePathFor(role: UserRole): string {
  return role === "employee" ? "/operations" : "/portal";
}
