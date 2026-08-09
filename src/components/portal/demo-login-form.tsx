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
      <form
        action={() => loginDemo("employee_cx", "/operations/estimating")}
        className="mt-3"
      >
        <Button type="submit" variant="outline" className="w-full h-12">
          Login as Sales / CX
        </Button>
      </form>
      <form
        action={() => loginDemo("employee_ep", "/operations/estimating/queue")}
        className="mt-3"
      >
        <Button type="submit" variant="outline" className="w-full h-12">
          Login as Estimating (E&P)
        </Button>
      </form>
    </>
  );
}
