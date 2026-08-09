"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  RegisterSnapshot,
  SnapshotAsset,
} from "@/lib/estimating/register-types";

export function AssetsClient({
  initialSnapshot,
}: {
  initialSnapshot: RegisterSnapshot;
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<SnapshotAsset>>({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const types = useMemo(() => {
    const set = new Set(snapshot.assets.map((a) => a.equipmentType));
    return ["all", ...Array.from(set).sort()];
  }, [snapshot.assets]);

  const filtered = snapshot.assets.filter((a) => {
    if (typeFilter !== "all" && a.equipmentType !== typeFilter) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      a.assetTag.toLowerCase().includes(q) ||
      (a.equipNumber ?? "").toLowerCase().includes(q) ||
      (a.manufacturer ?? "").toLowerCase().includes(q) ||
      (a.model ?? "").toLowerCase().includes(q)
    );
  });

  function startEdit(a: SnapshotAsset) {
    setEditing(a.assetTag);
    setDraft({
      avgSpeedFpm: a.avgSpeedFpm,
      maxMaterialWidthIn: a.maxMaterialWidthIn ?? a.widthIn,
      colorStations: a.colorStations,
      avgMrMinutes: a.avgMrMinutes,
      equipNumber: a.equipNumber,
    });
    setMsg("");
    setError("");
  }

  async function saveEdit(assetTag: string) {
    setError("");
    try {
      const res = await fetch("/api/assets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetTag, patch: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSnapshot((s) => ({
        ...s,
        assets: s.assets.map((a) =>
          a.assetTag === assetTag ? { ...a, ...data.asset } : a
        ),
      }));
      setEditing(null);
      setMsg(`Updated ${assetTag}. New estimates will use these speeds.`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search tag, name, manufacturer…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All equipment types" : t}
            </option>
          ))}
        </select>
      </div>

      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Tag</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Width</th>
              <th className="px-3 py-2">Colors</th>
              <th className="px-3 py-2">Avg FPM</th>
              <th className="px-3 py-2">MR min</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.assetTag} className="border-t align-top">
                <td className="px-3 py-2 font-mono text-xs">{a.assetTag}</td>
                <td className="px-3 py-2">
                  {editing === a.assetTag ? (
                    <Input
                      value={draft.equipNumber ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, equipNumber: e.target.value }))
                      }
                    />
                  ) : (
                    a.equipNumber || a.model || "—"
                  )}
                  <div className="text-xs text-slate-400">
                    {[a.manufacturer, a.model].filter(Boolean).join(" ")}
                  </div>
                </td>
                <td className="px-3 py-2">{a.equipmentType}</td>
                <td className="px-3 py-2">
                  {editing === a.assetTag ? (
                    <Input
                      type="number"
                      className="w-20"
                      value={draft.maxMaterialWidthIn ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          maxMaterialWidthIn: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    a.maxMaterialWidthIn ?? a.widthIn ?? "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  {editing === a.assetTag ? (
                    <Input
                      type="number"
                      className="w-16"
                      value={draft.colorStations ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          colorStations: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    a.colorStations ?? "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  {editing === a.assetTag ? (
                    <Input
                      type="number"
                      className="w-20"
                      value={draft.avgSpeedFpm ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          avgSpeedFpm: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    a.avgSpeedFpm ?? "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  {editing === a.assetTag ? (
                    <Input
                      type="number"
                      className="w-16"
                      value={draft.avgMrMinutes ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          avgMrMinutes: Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    a.avgMrMinutes ?? "—"
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {editing === a.assetTag ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => saveEdit(a.assetTag)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(a)}
                    >
                      Edit
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <h3 className="font-semibold mb-2">Production routes</h3>
        <ul className="text-sm space-y-2">
          {snapshot.routes.map((r) => (
            <li key={r.id} className="border-b pb-2">
              <span className="font-mono text-xs text-slate-500">{r.id}</span>
              <div>
                {r.productType} · press {r.pressAssetTag} ·{" "}
                {r.steps.map((s) => s.label).join(" → ")}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
