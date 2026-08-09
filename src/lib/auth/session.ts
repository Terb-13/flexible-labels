import { cookies } from "next/headers";
import {
  getDemoProfileFromSession,
  isEmployeeSession,
  sessionToActorRole,
  type DemoSessionValue,
} from "@/lib/auth/demo-session";
import type { ActorRole } from "@/lib/estimating/estimate-types";
import type { Profile } from "@/types";

export interface AppSession {
  demoValue: DemoSessionValue;
  profile: Profile;
  actorRole: ActorRole | null;
  isEmployee: boolean;
}

export async function getAppSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get("flg_demo_session")?.value as
    | DemoSessionValue
    | undefined;
  if (!value) return null;
  const profile = getDemoProfileFromSession(value);
  if (!profile) return null;
  return {
    demoValue: value,
    profile,
    actorRole: sessionToActorRole(value),
    isEmployee: isEmployeeSession(value),
  };
}

export async function requireEmployeeSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session?.isEmployee) {
    throw new Error("Employee sign-in required");
  }
  return session;
}
