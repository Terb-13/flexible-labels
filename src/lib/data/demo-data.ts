import type {
  AccountKpis,
  Company,
  Invoice,
  Order,
  Product,
  Proof,
  ProofComment,
  ScheduleJob,
} from "@/types";

export const DEMO_COMPANY: Company = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Acme Brands",
  margin_percent: 32,
  is_reseller: false,
  target_margin_percent: 28,
};

export const DEMO_RESELLER: Company = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Print Partners Reseller",
  margin_percent: 18,
  is_reseller: true,
  target_margin_percent: 22,
};

export const PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "roll-labels",
    name: "Roll Labels",
    categoryLabel: "PRIMARY PACKAGING",
    description:
      "High-speed flexo and digital. Prime labels, tamper-evident, linerless.",
    tags: ["BOPP • PET • Paper", "Up to 10 colors"],
    idealFor: "Food & beverage, CPG, industrial, pharma.",
    image: "/images/rolls.jpg",
    aiPrompt: "Roll Labels - BOPP or PET for beverage or CPG",
  },
  {
    id: "2",
    slug: "die-cut-stickers",
    name: "Custom Die-Cut Stickers",
    categoryLabel: "PRODUCT & PROMO",
    description:
      "Any shape or size. Kiss-cut or through-cut on dozens of materials.",
    tags: ["Vinyl • Poly • Kraft • Clear"],
    idealFor: "Retail packaging, electronics, events, product branding.",
    image: "/images/hero.jpg",
    aiPrompt: "Custom Die-Cut Stickers - any shape, short or long run",
  },
  {
    id: "3",
    slug: "bumper-stickers",
    name: "Bumper Stickers",
    categoryLabel: "OUTDOOR & PROMO",
    description:
      "Heavy-duty 3–4 mil vinyl with UV laminate. Weatherproof for years.",
    tags: ["UV laminate • Removable or permanent"],
    idealFor: "Vehicles, political, events, outdoor equipment branding.",
    image: "/images/bumper.jpg",
    aiPrompt: "Bumper Stickers - 3-4 mil vinyl with UV protection",
  },
  {
    id: "4",
    slug: "magnets",
    name: "Custom Magnets",
    categoryLabel: "REUSABLE & RETAIL",
    description:
      "Vehicle magnets, fridge magnets, and industrial strength options.",
    tags: ['0.020" or 0.030" • Full color'],
    idealFor: "Vehicles, retail displays, calendars, industrial equipment.",
    image: "/images/magnets.jpg",
    aiPrompt: "Custom Magnets - vehicle or fridge strength",
  },
  {
    id: "5",
    slug: "packaging-tape",
    name: "Printed Packaging Tape",
    categoryLabel: "BRANDED SHIPPING",
    description:
      "Custom 2\" and 3\" tape with your logo and message. Kraft or white.",
    tags: ["Up to 3 colors • 1,000+ yard rolls"],
    idealFor: "E-commerce, fulfillment centers, branded unboxing experience.",
    image: "/images/tape.jpg",
    aiPrompt: "Printed Packaging Tape - custom logo tape",
  },
  {
    id: "6",
    slug: "foil",
    name: "Foil Embossing & Specialty",
    categoryLabel: "PREMIUM FINISHES",
    description:
      "Hot foil, blind emboss, soft-touch, high-build varnish, spot UV.",
    tags: ["Metallic & matte foils"],
    idealFor: "Spirits, cosmetics, premium CPG, awards & certificates.",
    image: "/images/facility.jpg",
    aiPrompt: "Foil Embossing and specialty finishes",
  },
  {
    id: "7",
    slug: "variable-data",
    name: "Variable Data / QR / Serialized",
    categoryLabel: "DATA & COMPLIANCE",
    description:
      "Sequential numbering, QR codes, barcodes, batch coding at full production speed.",
    tags: ["Serialization • UID • Pharma ready"],
    idealFor: "Medical devices, traceability, promotions, asset tracking.",
    image: "/images/prepress.jpg",
    aiPrompt: "Variable data, QR codes, serialized labels",
  },
  {
    id: "8",
    slug: "parking-decals",
    name: "Parking Decals & Permits",
    categoryLabel: "VEHICLE & ACCESS",
    description:
      "Durable window decals, hang tags, and serialized permits. Tamper-evident options.",
    tags: ["Static cling • Serial numbers • UV stable"],
    idealFor: "Universities, apartments, municipalities, corporate fleets.",
    image: "/images/bumper.jpg",
    aiPrompt: "Parking decals and permits - serialized",
  },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: "o1",
    order_number: "FLG-48302",
    company_id: DEMO_COMPANY.id,
    description: "Apex Brewing 16oz Rolls",
    quantity: 62500,
    status: "On Press",
    ship_by: "Mar 10",
    progress: 55,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o2",
    order_number: "FLG-48102",
    company_id: DEMO_COMPANY.id,
    description: "Horizon Foods Jar Labels",
    quantity: 41000,
    status: "Printing",
    ship_by: "Mar 12",
    progress: 64,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o3",
    order_number: "FLG-48219",
    company_id: DEMO_COMPANY.id,
    description: "Acme Spring Refresh 12oz",
    quantity: 53000,
    status: "Rewind / Inspection",
    ship_by: "Mar 18",
    progress: 87,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o4",
    order_number: "FLG-47851",
    company_id: DEMO_COMPANY.id,
    description: "Delta ChemGuard Safety",
    quantity: 27200,
    status: "Finishing Line",
    ship_by: "Mar 15",
    progress: 71,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o5",
    order_number: "FLG-47988",
    company_id: DEMO_COMPANY.id,
    description: "Pinnacle Promo Die-Cuts",
    quantity: 8200,
    status: "Proof Approved",
    ship_by: "Mar 11",
    progress: 42,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o6",
    order_number: "FLG-48341",
    company_id: DEMO_COMPANY.id,
    description: "Metro Fleet UV Bumpers",
    quantity: 9800,
    status: "Finishing Line",
    ship_by: "Mar 14",
    progress: 78,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o7",
    order_number: "FLG-48407",
    company_id: DEMO_COMPANY.id,
    description: "Summit Pharma Tamper Vials",
    quantity: 18400,
    status: "Rewind / Inspection",
    ship_by: "Mar 16",
    progress: 91,
    total_amount: null,
    completed_at: null,
  },
  {
    id: "o8",
    order_number: "FLG-48422",
    company_id: DEMO_COMPANY.id,
    description: "Titan Branded Tape 3in",
    quantity: 14500,
    status: "Prepress",
    ship_by: "Mar 13",
    progress: 28,
    total_amount: null,
    completed_at: null,
  },
];

export const DEMO_HISTORY: Order[] = [
  {
    id: "h1",
    order_number: "FLG-47721",
    company_id: DEMO_COMPANY.id,
    description: "Apex Brewing 16oz Roll Labels - Matte BOPP",
    quantity: 62000,
    status: "Completed",
    ship_by: "Feb 12, 2026",
    progress: 100,
    total_amount: 4280,
    completed_at: "2026-02-12",
  },
  {
    id: "h2",
    order_number: "FLG-47588",
    company_id: DEMO_COMPANY.id,
    description: "Pinnacle Retail Die-Cut Stickers - Matte Vinyl",
    quantity: 14500,
    status: "Completed",
    ship_by: "Jan 28, 2026",
    progress: 100,
    total_amount: 1920,
    completed_at: "2026-01-28",
  },
  {
    id: "h3",
    order_number: "FLG-47402",
    company_id: DEMO_COMPANY.id,
    description: "Metro City Fleet Bumper Stickers - UV Vinyl",
    quantity: 8200,
    status: "Completed",
    ship_by: "Jan 9, 2026",
    progress: 100,
    total_amount: 1350,
    completed_at: "2026-01-09",
  },
  {
    id: "h4",
    order_number: "FLG-47266",
    company_id: DEMO_COMPANY.id,
    description: "Horizon Foods 4oz Jar Labels - Gloss BOPP",
    quantity: 39000,
    status: "Completed",
    ship_by: "Dec 19, 2025",
    progress: 100,
    total_amount: 2610,
    completed_at: "2025-12-19",
  },
  {
    id: "h5",
    order_number: "FLG-47119",
    company_id: DEMO_COMPANY.id,
    description: "Summit Pharma Tamper-Evident Vials",
    quantity: 22500,
    status: "Completed",
    ship_by: "Nov 26, 2025",
    progress: 100,
    total_amount: 3740,
    completed_at: "2025-11-26",
  },
  {
    id: "h6",
    order_number: "FLG-46981",
    company_id: DEMO_COMPANY.id,
    description: "Delta ChemGuard Chemical Safety Rolls",
    quantity: 31000,
    status: "Completed",
    ship_by: "Oct 15, 2025",
    progress: 100,
    total_amount: 2450,
    completed_at: "2025-10-15",
  },
  {
    id: "h7",
    order_number: "FLG-46840",
    company_id: DEMO_COMPANY.id,
    description: "Titan Logistics 3in Branded Packaging Tape",
    quantity: 12800,
    status: "Completed",
    ship_by: "Sep 25, 2025",
    progress: 100,
    total_amount: 980,
    completed_at: "2025-09-25",
  },
  {
    id: "h8",
    order_number: "FLG-46755",
    company_id: DEMO_COMPANY.id,
    description: "Acme Brands Foil Embossed Die-Cuts",
    quantity: 7600,
    status: "Completed",
    ship_by: "Feb 27, 2026",
    progress: 100,
    total_amount: 1580,
    completed_at: "2026-02-27",
  },
];

export const DEMO_INVOICES: Invoice[] = [
  {
    id: "i1",
    invoice_number: "INV-24091",
    company_id: DEMO_COMPANY.id,
    amount: 1840,
    issued_at: "Feb 11",
    due_at: "Mar 12",
    status: "Pending",
  },
  {
    id: "i2",
    invoice_number: "INV-23944",
    company_id: DEMO_COMPANY.id,
    amount: 720,
    issued_at: "Jan 28",
    due_at: "Feb 27",
    status: "Paid",
  },
  {
    id: "i3",
    invoice_number: "INV-24012",
    company_id: DEMO_COMPANY.id,
    amount: 3150,
    issued_at: "Feb 3",
    due_at: "Mar 4",
    status: "Overdue",
  },
  {
    id: "i4",
    invoice_number: "INV-24105",
    company_id: DEMO_COMPANY.id,
    amount: 940,
    issued_at: "Feb 19",
    due_at: "Mar 21",
    status: "Pending",
  },
];

export const DEMO_PROOF: Proof = {
  id: "p1",
  company_id: DEMO_COMPANY.id,
  title: "Spring Refresh 2026",
  brand: "ACME",
  product_name: "Classic Sparkling 12oz",
  proof_number: "PRF-2841",
  material: "Matte BOPP • Permanent adhesive • 6 colors",
  status: "Awaiting your review",
  image_url: "/images/prepress.jpg",
};

export const DEMO_PROOF_COMMENTS: ProofComment[] = [
  {
    id: "c1",
    proof_id: "p1",
    author: "Jenna T.",
    body: "Color looks slightly darker than last run.",
    created_at: "Feb 28, 10:14am",
  },
  {
    id: "c2",
    proof_id: "p1",
    author: "Prepress",
    body: "Adjusted saturation — new proof attached.",
    created_at: "Feb 28, 11:02am",
  },
];

export const GANTT_DAYS = [
  "Mar 3",
  "Mar 4",
  "Mar 5",
  "Mar 6",
  "Mar 7",
  "Mar 8",
  "Mar 9",
  "Mar 10",
  "Mar 11",
  "Mar 12",
  "Mar 13",
  "Mar 14",
  "Mar 15",
  "Mar 16",
  "Mar 17",
  "Mar 18",
  "Mar 19",
];

export const GANTT_RESOURCES = [
  "Press Line 1 (Flexo)",
  "Press Line 2 (Flexo)",
  "Digital Press",
  "Finishing Line",
  "Rewind / Inspection",
] as const;

export const RESOURCE_COLORS: Record<string, string> = {
  "Press Line 1 (Flexo)": "bg-teal",
  "Press Line 2 (Flexo)": "bg-cta",
  "Digital Press": "bg-blue-500",
  "Finishing Line": "bg-purple-500",
  "Rewind / Inspection": "bg-emerald-600",
};

export const DEMO_SCHEDULE_JOBS: ScheduleJob[] = [
  {
    id: "j1",
    job_number: "J-3011",
    name: "Apex Brewing 16oz Rolls",
    quantity: "62.5k",
    resource: "Press Line 1 (Flexo)",
    start_day: 0,
    duration: 4,
    due_date: "Mar 10",
    material: "Matte BOPP",
    company_id: DEMO_COMPANY.id,
  },
  {
    id: "j2",
    job_number: "J-3015",
    name: "Horizon Foods Jar Labels",
    quantity: "41k",
    resource: "Press Line 2 (Flexo)",
    start_day: 1,
    duration: 3,
    due_date: "Mar 12",
    material: "Gloss BOPP",
    company_id: DEMO_COMPANY.id,
  },
  {
    id: "j3",
    job_number: "J-3020",
    name: "Pinnacle Promo Die-Cuts",
    quantity: "8.2k",
    resource: "Digital Press",
    start_day: 2,
    duration: 2,
    due_date: "Mar 11",
    material: "Matte Vinyl",
    company_id: DEMO_COMPANY.id,
  },
  {
    id: "j4",
    job_number: "J-3024",
    name: "Delta ChemGuard Safety",
    quantity: "27.2k",
    resource: "Press Line 1 (Flexo)",
    start_day: 5,
    duration: 3,
    due_date: "Mar 15",
    material: "Chem-Resist PET",
    company_id: DEMO_COMPANY.id,
  },
  {
    id: "j5",
    job_number: "J-3028",
    name: "Titan Branded Tape 3in",
    quantity: "14.5k",
    resource: "Finishing Line",
    start_day: 4,
    duration: 2,
    due_date: "Mar 13",
    material: "Printed Kraft Tape",
    company_id: DEMO_COMPANY.id,
  },
  {
    id: "j6",
    job_number: "J-3032",
    name: "Metro Fleet UV Bumpers",
    quantity: "9.8k",
    resource: "Finishing Line",
    start_day: 7,
    duration: 2,
    due_date: "Mar 14",
    material: "UV Vinyl",
    company_id: DEMO_COMPANY.id,
  },
  {
    id: "j7",
    job_number: "J-3036",
    name: "Summit Pharma Tamper Vials",
    quantity: "18.4k",
    resource: "Rewind / Inspection",
    start_day: 9,
    duration: 2,
    due_date: "Mar 16",
    material: "Tamper-Evident PET",
    company_id: DEMO_COMPANY.id,
  },
  {
    id: "j8",
    job_number: "J-3041",
    name: "Acme Spring Refresh 12oz",
    quantity: "53k",
    resource: "Rewind / Inspection",
    start_day: 12,
    duration: 2,
    due_date: "Mar 18",
    material: "Matte BOPP",
    company_id: DEMO_COMPANY.id,
  },
];

export const DEMO_KPIS: AccountKpis = {
  ytdVolume: 142850,
  ytdGrowthPercent: 18,
  onTimePercent: 96,
  openInvoicesAmount: 2780,
  openInvoicesCount: 2,
  overdueCount: 1,
  activeOrders: 8,
  inProduction: 5,
  avgLeadTimeDays: 6.2,
  leadTimeDelta: -0.8,
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
  "beverage-fridge": {
    title: "Matte BOPP + Permanent Acrylic",
    why: "Best condensation resistance and premium appearance for refrigerated beverage.",
  },
  outdoor: {
    title: "3 mil Polyester + UV Laminate",
    why: "3–5 year outdoor life. Excellent for bumper stickers and equipment.",
  },
  industrial: {
    title: "Chemical-Resistant Vinyl / PET",
    why: "High-performance adhesive survives solvents and abrasion.",
  },
  default: {
    title: "Premium Matte BOPP",
    why: "Versatile, excellent print quality, cost-effective for most CPG and retail.",
  },
};

export function getBotResponse(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("bumper") || m.includes("outdoor"))
    return "Bumper stickers use 3-4 mil UV-stabilized vinyl with laminate. Excellent for 3-5 years outdoor. Want a quote for a specific size?";
  if (m.includes("magnet"))
    return "We offer 20 mil and 30 mil magnets. Vehicle magnets are 30 mil. Fridge and display are typically 20 mil. Tell me the application and I'll recommend the right weight.";
  if (m.includes("tape") || m.includes("packaging"))
    return "Printed packaging tape comes in 2\" and 3\" widths. We can print up to 3 colors on kraft or white. Lead time is usually 5 days. What quantity are you looking at?";
  if (m.includes("material") || m.includes("recommend"))
    return m.includes("beverage") || m.includes("refrigerat")
      ? "Matte BOPP + permanent acrylic adhesive is ideal for refrigerated beverages."
      : "BOPP for most CPG, polyester for durability and heat, vinyl for outdoor. Give me environment and quantity.";
  if (m.includes("quote") || m.includes("price") || m.includes("cost"))
    return "Typical 10k 2x3 matte BOPP rolls run $1,180–$1,360. Bumper stickers and magnets are priced by square inch. I can give you a precise number — what are the specs?";
  if (m.includes("lead") || m.includes("turn"))
    return "Standard is 5–7 business days from approved proof. Rush (2–3 days) is available.";
  if (m.includes("status") || m.includes("48219"))
    return "Order FLG-48219 is currently in Finishing. Expected ship March 11.";
  if (m.includes("variable") || m.includes("qr"))
    return "Full variable data and QR at production speeds with very little added cost.";
  return "Happy to help. Tell me dimensions, quantity, application, and environment and I'll give you an immediate recommendation or quote.";
}
