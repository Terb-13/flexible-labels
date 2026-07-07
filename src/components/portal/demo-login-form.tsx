"use client";

import { loginDemo } from "@/app/portal/actions";
import { Button } from "@/components/ui/button";

export function DemoLoginForm({ next }: { next: string }) {
  return (
    <>
      <form action={() => loginDemo("customer", next)} className="mt-6">
        <Button type="submit" className="w-full h-12">
          Login as Demo Customer
        </Button>
      </form>
      <form action={() => loginDemo("employee", "/operations")} className="mt-3">
        <Button type="submit" variant="outline" className="w-full h-12">
          Login as FLG Employee (Operations)
        </Button>
      </form>
    </>
  );
}
