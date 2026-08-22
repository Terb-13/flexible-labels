import { PRODUCT_OPTIONS } from "@/lib/data/example-catalog";
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

  if (!eqMats.size) return byAttr.length ? byAttr : substrates;
  const matched = byAttr.filter((m) => eqMats.has(m.name));
  return matched.length ? matched : byAttr;
}

/** Names the customer door can show — computed with the full catalog, no equipment sent. */
export function publicMaterialsByProduct(
  catalog: PricingCatalog
): Record<string, string[]> {
  return Object.fromEntries(
    PRODUCT_OPTIONS.map((product) => [
      product,
      materialsForProduct(product, catalog).map((m) => m.name),
    ])
  );
}

/** Substrate list for customer pages — names only, no rates or notes. */
export function toPublicMaterials(materials: Material[]): Material[] {
  return materials
    .filter((m) => m.kind === "substrate" && m.active !== false)
    .map((m) => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      cost_per_sqin: 0,
      cost_per_unit: 0,
      attributes: {
        products: Array.isArray(m.attributes?.products) ? m.attributes.products : [],
      },
      active: true,
    }));
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
