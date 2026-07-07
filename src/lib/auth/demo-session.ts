import type { Profile, UserRole } from "@/types";
import { DEMO_COMPANY } from "@/lib/data/demo-data";

export const DEMO_CUSTOMER_PROFILE: Profile = {
  id: "demo-customer",
  email: "jenna@acmebrands.co",
  full_name: "Jenna Torres",
  role: "customer",
  company_id: DEMO_COMPANY.id,
  job_title: "Procurement",
};

export const DEMO_EMPLOYEE_PROFILE: Profile = {
  id: "demo-employee",
  email: "ops@flexiblelabelgroup.com",
  full_name: "Morgan Lee",
  role: "employee",
  company_id: null,
  job_title: "Production Manager",
};

export function getDemoProfile(role: UserRole = "customer"): Profile {
  return role === "employee" ? DEMO_EMPLOYEE_PROFILE : DEMO_CUSTOMER_PROFILE;
}
