"use client";

import { useState } from "react";
import { loginDemo, loginWithPassword } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/types";

export function DoorLoginForm({
  door,
  next,
  allowDemo,
}: {
  door: UserRole;
  next: string;
  allowDemo: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await loginWithPassword(door, formData);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  return (
    <div className="mt-6 space-y-4 text-left">
      <form action={onSubmit} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-1"
            required
          />
        </div>
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full h-12" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {allowDemo && (
        <form action={() => loginDemo(door, next)}>
          <Button type="submit" variant="outline" className="w-full h-12">
            {door === "employee"
              ? "Local preview — continue as employee"
              : "Local preview — continue as customer"}
          </Button>
        </form>
      )}
    </div>
  );
}
