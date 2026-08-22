import type { Material, PricingCatalog } from "@/types";

export function materialGroup(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("foil")) return "Specialty";
  if (n.includes("vinyl")) return "Durable / outdoor";
  if (n.includes("bopp") || n.includes("pet")) return "Film";
  return "Other";
}

/**
 * Substrates allowed for a catalog product via material attributes
 * and equipment capabilities. No invented stocks.
 */
export function materialsForProduct(
  product: string,
  catalog: Pick<PricingCatalog, "materials" | "equipment">
): Material[] {
  const substrates = catalog.materials.filter(
    (m) => m.kind === "substrate" && m.active !== false
  );
  const byAttr = substrates.filter((m) => {
    const products = m.attributes?.products;
    if (Array.isArray(products) && products.length) {
      return products.includes(product);
    }
    return true;
  });

  const eqMats = new Set<string>();
  for (const eq of catalog.equipment ?? []) {
    if (eq.active === false) continue;
    const cap = eq.capabilities ?? {};
    if (cap.products?.length && product && !cap.products.includes(product)) {
      continue;
    }
    for (const mat of cap.materials ?? []) eqMats.add(mat);
  }

  if (!eqMats.size) return byAttr;
  return byAttr.filter((m) => eqMats.has(m.name));
}

export function groupedMaterials(materials: Material[]): {
  group: string;
  items: Material[];
}[] {
  const order = ["Film", "Durable / outdoor", "Specialty", "Other"];
  const map = new Map<string, Material[]>();
  for (const material of materials) {
    const group = materialGroup(material.name);
    const list = map.get(group) ?? [];
    list.push(material);
    map.set(group, list);
  }
  return order
    .filter((g) => map.has(g))
    .map((group) => ({ group, items: map.get(group) ?? [] }));
}
