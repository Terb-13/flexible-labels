import { ASSET_REGISTRY, MEMPHIS_RATE_CARD } from "@/lib/data/asset-registry";
import { MATERIAL_MASTER } from "@/lib/data/material-master";
import type { PricingRegistries } from "@/types";

/** Default in-process registries. Swap for a Supabase load when connected. */
export function getDefaultRegistries(): PricingRegistries {
  return {
    materials: MATERIAL_MASTER.filter((m) => m.active),
    assets: ASSET_REGISTRY.filter((a) => a.active),
    rateCard: MEMPHIS_RATE_CARD,
  };
}
