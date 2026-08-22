import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoProfile } from "@/lib/auth/demo-session";
import { isSupabaseConfigured } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

export type SessionContext = {
  mode: "demo" | "supabase";
  profile: Profile;
};

function asRole(value: string | undefined): UserRole | null {
  return value === "customer" || value === "employee" ? value : null;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, company_id, job_title")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    return {
      mode: "supabase",
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        company_id: profile.company_id,
        job_title: profile.job_title,
      },
    };
  }

  const cookieStore = await cookies();
  const demoRole = asRole(cookieStore.get("flg_demo_session")?.value);
  if (!demoRole) return null;

  return {
    mode: "demo",
    profile: getDemoProfile(demoRole),
  };
}

export async function requirePortalSession() {
  const session = await getSessionContext();
  if (!session) {
    redirect("/portal/login");
  }
  return session;
}

export async function requireEmployeeSession() {
  const session = await getSessionContext();
  if (!session) {
    redirect("/operations/login");
  }
  if (session.profile.role !== "employee") {
    redirect("/portal");
  }
  return session;
}
