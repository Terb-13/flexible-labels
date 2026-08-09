import { promises as fs } from "fs";
import path from "path";
import seed from "@/data/memphis-register-snapshot.json";
import type { RegisterSnapshot, SnapshotAsset } from "./register-types";

const RUNTIME_PATH = path.join(
  process.cwd(),
  "data",
  "memphis-register-runtime.json"
);

let memorySnapshot: RegisterSnapshot | null = null;

function cloneSeed(): RegisterSnapshot {
  return structuredClone(seed as RegisterSnapshot);
}

export function getRegisterSnapshotSync(): RegisterSnapshot {
  if (memorySnapshot) return memorySnapshot;
  return cloneSeed();
}

export async function getRegisterSnapshot(): Promise<RegisterSnapshot> {
  if (memorySnapshot) return memorySnapshot;

  try {
    const raw = await fs.readFile(RUNTIME_PATH, "utf8");
    memorySnapshot = JSON.parse(raw) as RegisterSnapshot;
    return memorySnapshot;
  } catch {
    memorySnapshot = cloneSeed();
    return memorySnapshot;
  }
}

export async function saveRegisterSnapshot(
  snapshot: RegisterSnapshot
): Promise<RegisterSnapshot> {
  const next: RegisterSnapshot = {
    ...snapshot,
    version: 1,
    generatedAt: new Date().toISOString(),
  };
  memorySnapshot = next;

  try {
    await fs.mkdir(path.dirname(RUNTIME_PATH), { recursive: true });
    await fs.writeFile(RUNTIME_PATH, JSON.stringify(next, null, 2), "utf8");
  } catch {
    // Vercel / read-only FS: keep in-memory for the instance lifetime
  }

  return next;
}

export async function updateAsset(
  assetTag: string,
  patch: Partial<SnapshotAsset>
): Promise<SnapshotAsset | null> {
  const snap = await getRegisterSnapshot();
  const idx = snap.assets.findIndex((a) => a.assetTag === assetTag);
  if (idx < 0) return null;

  const updated: SnapshotAsset = {
    ...snap.assets[idx],
    ...patch,
    assetTag,
    capabilities: patch.capabilities ?? snap.assets[idx].capabilities,
  };
  const assets = [...snap.assets];
  assets[idx] = updated;
  await saveRegisterSnapshot({ ...snap, assets });
  return updated;
}

export async function resetRegisterToSeed(): Promise<RegisterSnapshot> {
  return saveRegisterSnapshot(cloneSeed());
}

export function registerHealth(snapshot: RegisterSnapshot) {
  const presses = snapshot.assets.filter(
    (a) =>
      a.status === "Installed" &&
      a.equipmentType.toLowerCase().includes("press")
  ).length;
  return {
    loaded: true,
    plants: snapshot.plants.length,
    assets: snapshot.assets.length,
    routes: snapshot.routes.filter((r) => r.isActive).length,
    presses,
    plantCode: snapshot.plants[0]?.code ?? null,
  };
}
