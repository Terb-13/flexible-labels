"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RegisterImport() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [dryRun, setDryRun] = useState<{
    plants: number;
    assets: number;
    routes: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function validate() {
    setError("");
    setMsg("");
    try {
      const snap = JSON.parse(jsonText);
      if (!snap.plants?.length || !Array.isArray(snap.assets) || !Array.isArray(snap.routes)) {
        throw new Error("Snapshot must include plants, assets, and routes arrays");
      }
      setDryRun({
        plants: snap.plants.length,
        assets: snap.assets.length,
        routes: snap.routes.length,
      });
    } catch (e) {
      setDryRun(null);
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  async function commit() {
    setError("");
    try {
      const snap = JSON.parse(jsonText);
      const res = await fetch("/api/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: snap }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setMsg(
        `Committed ${data.health.assets} assets / ${data.health.routes} routes for ${data.health.plantCode}`
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
  }

  async function reset() {
    setError("");
    try {
      const res = await fetch("/api/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setMsg("Reset to Memphis seed register.");
      setJsonText("");
      setDryRun(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    }
  }

  return (
    <div className="bg-white border rounded-2xl p-6 space-y-4">
      <p className="text-sm text-slate-600">
        Paste a register snapshot JSON (same shape as the Memphis seed). Dry-run
        validates structure; commit replaces the in-app register used by the
        estimating engine.
      </p>
      <Textarea
        rows={14}
        className="font-mono text-xs"
        placeholder='{"version":1,"plants":[...],"assets":[...],"routes":[...]}'
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={validate}>
          Dry-run
        </Button>
        <Button onClick={commit} disabled={!dryRun}>
          Commit import
        </Button>
        <Button variant="outline" onClick={reset}>
          Reset to Memphis seed
        </Button>
      </div>
      {dryRun && (
        <p className="text-sm text-slate-600">
          Dry-run OK: {dryRun.plants} plant(s), {dryRun.assets} assets,{" "}
          {dryRun.routes} routes.
        </p>
      )}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
