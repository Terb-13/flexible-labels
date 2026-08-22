"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginDemo } from "@/app/portal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Door = "customer" | "employee";

function safeNext(door: Door, next: string) {
  if (door === "employee") {
    return next.startsWith("/operations") ? next : "/operations";
  }
  if (next.startsWith("/portal") && !next.startsWith("/portal/login")) {
    return next;
  }
  return "/portal";
}

export function DoorLoginForm({
  door,
  next,
  supabaseConfigured,
}: {
  door: Door;
  next: string;
  supabaseConfigured?: boolean;
}) {
  const configured =
    supabaseConfigured ?? isSupabaseConfigured();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!configured) {
    const destination = safeNext(door, next);
    return (
      <form action={() => loginDemo(door, destination)} className="mt-6">
        <Button type="submit" className="w-full h-12">
          {door === "employee"
            ? "Login as Demo FLG Employee"
            : "Login as Demo Customer"}
        </Button>
      </form>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError("Sign-in did not return a user.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        setError("Signed in, but no profile was found.");
        return;
      }

      if (door === "employee") {
        if (profile.role !== "employee") {
          router.replace("/portal");
          router.refresh();
          return;
        }
        router.replace(safeNext("employee", next));
        router.refresh();
        return;
      }

      router.replace(safeNext("customer", next));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 text-left">
      <div className="space-y-1.5">
        <Label htmlFor={`${door}-email`}>Email</Label>
        <Input
          id={`${door}-email`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${door}-password`}>Password</Label>
        <Input
          id={`${door}-password`}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full h-12" disabled={pending}>
        {pending
          ? "Signing in…"
          : door === "employee"
            ? "Sign in to Operations"
            : "Sign in to Customer Portal"}
      </Button>
    </form>
  );
}
