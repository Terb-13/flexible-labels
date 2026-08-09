import type { Profile, UserRole } from "@/types";
import { DEMO_COMPANY } from "@/lib/data/demo-data";
import type { ActorRole } from "@/lib/estimating/estimate-types";

/** Cookie values used by demo auth */
export type DemoSessionValue =
  | "customer"
  | "employee"
  | "employee_cx"
  | "employee_ep";

export const DEMO_CUSTOMER_PROFILE: Profile = {
  id: "demo-customer",
  email: "jenna@acmebrands.co",
  full_name: "Jenna Torres",
  role: "customer",
  company_id: DEMO_COMPANY.id,
  job_title: "Procurement",
};

export const DEMO_EMPLOYEE_CX_PROFILE: Profile = {
  id: "demo-employee-cx",
  email: "sales@flexiblelabelgroup.com",
  full_name: "Alex Rivera",
  role: "employee",
  company_id: null,
  job_title: "Customer Experience",
};

export const DEMO_EMPLOYEE_EP_PROFILE: Profile = {
  id: "demo-employee-ep",
  email: "estimating@flexiblelabelgroup.com",
  full_name: "Sam Okonkwo",
  role: "employee",
  company_id: null,
  job_title: "Estimating & Pricing",
};

/** @deprecated prefer CX/EP specific profiles */
export const DEMO_EMPLOYEE_PROFILE = DEMO_EMPLOYEE_CX_PROFILE;

export function isEmployeeSession(
  session: string | undefined | null
): boolean {
  return (
    session === "employee" ||
    session === "employee_cx" ||
    session === "employee_ep"
  );
}

export function sessionToActorRole(
  session: string | undefined | null
): ActorRole | null {
  if (session === "employee_ep") return "ep";
  if (session === "employee_cx" || session === "employee") return "cx";
  return null;
}

export function getDemoProfileFromSession(
  session: string | undefined | null
): Profile | null {
  if (!session) return null;
  if (session === "customer") return DEMO_CUSTOMER_PROFILE;
  if (session === "employee_ep") return DEMO_EMPLOYEE_EP_PROFILE;
  if (isEmployeeSession(session)) return DEMO_EMPLOYEE_CX_PROFILE;
  return null;
}

export function getDemoProfile(role: UserRole = "customer"): Profile {
  return role === "employee"
    ? DEMO_EMPLOYEE_CX_PROFILE
    : DEMO_CUSTOMER_PROFILE;
}
