import { DoorLoginForm } from "@/components/portal/door-login-form";

/** Customer-door only. Employee demo lives on /operations/login. */
export function DemoLoginForm({
  next,
  supabaseConfigured,
}: {
  next: string;
  supabaseConfigured?: boolean;
}) {
  return (
    <DoorLoginForm
      door="customer"
      next={next}
      supabaseConfigured={supabaseConfigured}
    />
  );
}
