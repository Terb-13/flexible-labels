import type {
  AccountKpis,
  Company,
  Invoice,
  Order,
  Product,
  Proof,
  ProofComment,
} from "@/types";

export const DEMO_COMPANY: Company = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "EXAMPLE Buyer (DTC)",
  margin_percent: 25,
  is_reseller: false,
  target_margin_percent: 20,
  discount_percent: 0,
};

export const DEMO_RESELLER: Company = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "EXAMPLE Buyer (Reseller)",
  margin_percent: 20,
  is_reseller: true,
  target_margin_percent: 15,
  discount_percent: 10,
};

/** Other tenants — never shown in the EXAMPLE Buyer portal. */
const NORTHLINE_ID = "00000000-0000-4000-8000-000000000011";
const HARBOR_ID = "00000000-0000-4000-8000-000000000012";
const RIDGE_ID = "00000000-0000-4000-8000-000000000013";

export const PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "packaging-kits",
    name: "Packaging / Kits",
    categoryLabel: "PACKAGING",
    description:
      "Custom cartons, device kits, inserts, and assembly — design through pack-out.",
    tags: ["Cartons • Kits • Inserts"],
    idealFor: "Telecom, electronics, wireless distributors.",
    image: "/images/tape.jpg",
    aiPrompt: "Packaging / Kits - cartons, inserts, device kits",
  },
  {
    id: "2",
    slug: "labels",
    name: "Labels",
    categoryLabel: "LABELS",
    description:
      "Roll labels, barcodes, and product labels. Process is the production route.",
    tags: ["Process = route"],
    idealFor: "Product ID, compliance, food & beverage, industrial.",
    image: "/images/rolls.jpg",
    aiPrompt: "Labels - roll labels and barcodes",
  },
  {
    id: "3",
    slug: "signs",
    name: "Signs",
    categoryLabel: "SIGNS",
    description:
      "Facility, safety, tow-away, and identification signs for industrial and property sites.",
    tags: ["Facility • Safety • Property"],
    idealFor: "Towing, property management, industrial operations.",
    image: "/images/facility.jpg",
    aiPrompt: "Signs - industrial and property signage",
  },
  {
    id: "4",
    slug: "decals",
    name: "Decals",
    categoryLabel: "DECALS",
    description:
      "Durable decals for equipment, vehicles, and outdoor use.",
    tags: ["Durable • Outdoor"],
    idealFor: "Wastewater, industrial, fleet, property.",
    image: "/images/bumper.jpg",
    aiPrompt: "Decals - durable outdoor and equipment",
  },
  {
    id: "5",
    slug: "electronic-serialized",
    name: "Electronic / Serialized",
    categoryLabel: "ELECTRONIC",
    description:
      "Serialized labels, activation cards, and electronics-kit identification.",
    tags: ["Serialization • UID"],
    idealFor: "Mobile devices, wireless, asset tracking.",
    image: "/images/prepress.jpg",
    aiPrompt: "Electronic / Serialized - serialized labels and activation cards",
  },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: "o1",
    order_number: "SG-1001",
    company_id: DEMO_COMPANY.id,
    description: "EXAMPLE Buyer device kit pack-out",
    quantity: 2500,
    status: "On Press",
    ship_by: "Mar 10",
    progress: 55,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o2",
    order_number: "SG-1002",
    company_id: NORTHLINE_ID,
    description: "Northline carton run",
    quantity: 1200,
    status: "Printing",
    ship_by: "Mar 12",
    progress: 64,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o3",
    order_number: "SG-1003",
    company_id: DEMO_COMPANY.id,
    description: "EXAMPLE Buyer serialized labels",
    quantity: 8000,
    status: "Finishing",
    ship_by: "Mar 18",
    progress: 87,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o4",
    order_number: "SG-1004",
    company_id: HARBOR_ID,
    description: "Harbor facility signs",
    quantity: 40,
    status: "Proof Approved",
    ship_by: "Mar 15",
    progress: 42,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o5",
    order_number: "SG-1005",
    company_id: RIDGE_ID,
    description: "Ridge equipment decals",
    quantity: 600,
    status: "Prepress",
    ship_by: "Mar 14",
    progress: 28,
    total_amount: null,
    completed_at: null,
  },
];

export const DEMO_HISTORY: Order[] = [
  {
    id: "h1",
    order_number: "SG-0901",
    company_id: NORTHLINE_ID,
    description: "Northline insert cards",
    quantity: 4000,
    status: "Completed",
    ship_by: "Feb 12, 2026",
    progress: 100,
    total_amount: 100,
    completed_at: "2026-02-12",
  },
  {
    id: "h2",
    order_number: "SG-0902",
    company_id: DEMO_COMPANY.id,
    description: "EXAMPLE Buyer carton family",
    quantity: 1800,
    status: "Completed",
    ship_by: "Jan 28, 2026",
    progress: 100,
    total_amount: 200,
    completed_at: "2026-01-28",
  },
  {
    id: "h3",
    order_number: "SG-0903",
    company_id: HARBOR_ID,
    description: "Harbor tow-away signs",
    quantity: 24,
    status: "Completed",
    ship_by: "Jan 9, 2026",
    progress: 100,
    total_amount: 50,
    completed_at: "2026-01-09",
  },
];

export const DEMO_INVOICES: Invoice[] = [
  {
    id: "i1",
    invoice_number: "INV-EX-101",
    company_id: DEMO_COMPANY.id,
    amount: 100,
    issued_at: "Feb 11",
    due_at: "Mar 12",
    status: "Pending",
  },
  {
    id: "i2",
    invoice_number: "INV-EX-102",
    company_id: DEMO_COMPANY.id,
    amount: 200,
    issued_at: "Jan 28",
    due_at: "Feb 27",
    status: "Paid",
  },
];

export const DEMO_PROOF: Proof = {
  id: "p1",
  company_id: DEMO_COMPANY.id,
  title: "EXAMPLE kit proof",
  brand: "EXAMPLE",
  product_name: "Device kit carton",
  proof_number: "PRF-EX-1",
  material: "EXAMPLE Kit board / carton",
  status: "Awaiting your review",
  image_url: "/images/prepress.jpg",
};

export const DEMO_PROOF_COMMENTS: ProofComment[] = [
  {
    id: "c1",
    proof_id: "p1",
    author: "Buyer",
    body: "Please confirm insert fold matches the tray.",
    created_at: "Feb 28, 10:14am",
  },
  {
    id: "c2",
    proof_id: "p1",
    author: "Prepress",
    body: "Updated fold diagram attached.",
    created_at: "Feb 28, 11:02am",
  },
];

export const DEMO_KPIS: AccountKpis = {
  ytdVolume: 12000,
  ytdGrowthPercent: 0,
  onTimePercent: 0,
  openInvoicesAmount: 100,
  openInvoicesCount: 1,
  overdueCount: 0,
  activeOrders: 2,
  inProduction: 2,
  avgLeadTimeDays: 0,
  leadTimeDelta: 0,
};

export const ORDER_TIMELINE_STAGES = [
  "Order Received",
  "Proof Submitted",
  "Proof Approved",
  "Prepress",
  "On Press",
  "Finishing & QC",
  "Shipping",
];

export const MATERIAL_RECOMMENDATIONS: Record<
  string,
  { title: string; why: string }
> = {
  packaging: {
    title: "EXAMPLE Kit board / carton",
    why: "Template only — Summit will assign the real carton/kit stock.",
  },
  labels: {
    title: "EXAMPLE Label substrate",
    why: "Template only — process is the production route, not a plant rate.",
  },
  signs: {
    title: "EXAMPLE Sign board",
    why: "Template only — wide-format stock is not a published Summit rate.",
  },
  decals: {
    title: "EXAMPLE Decal vinyl",
    why: "Template only — outdoor durability claims wait on Summit materials.",
  },
  default: {
    title: "Ask for the product type",
    why: "EXAMPLE catalog has names only until Summit provides stocks and rates.",
  },
};

export function getBotResponse(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("packag") || m.includes("kit") || m.includes("carton"))
    return "Packaging and kits are a self-serve quote type in this demo. Share size, quantity, and whether you need inserts or assembly.";
  if (m.includes("sign"))
    return "Signs are on the quote door. Finished size and quantity are enough to start an EXAMPLE estimate.";
  if (m.includes("decal"))
    return "Decals are a quote type here. Tell me size, quantity, and indoor vs outdoor.";
  if (m.includes("serial") || m.includes("electronic") || m.includes("telecom"))
    return "Electronic / serialized work is a demo product type. No plant rates are loaded — estimates are EXAMPLE stubs.";
  if (m.includes("label"))
    return "Labels use process = route in this demo. Start a quote with size, colors, and quantity.";
  if (m.includes("quote") || m.includes("price") || m.includes("cost"))
    return "Use Get a quote for a self-serve EXAMPLE estimate. Numbers are stubs until Summit loads plant rates.";
  if (m.includes("lead") || m.includes("turn"))
    return "Lead times are not published in this demo. Ask your Summit contact after the quote is saved.";
  if (m.includes("status"))
    return "Sign in to the customer portal to see orders on your account only.";
  return "This demo adds a self-serve quote door. Tell me product type, size, and quantity — or open Get a quote.";
}
