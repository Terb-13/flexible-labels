export type UserRole = "customer" | "employee";

export type ProductCategory =
  | "roll-labels"
  | "die-cut-stickers"
  | "bumper-stickers"
  | "magnets"
  | "packaging-tape"
  | "foil"
  | "variable-data"
  | "parking-decals";

export type CompanyType = "dtc" | "reseller";
export type EquipmentStage = "printer" | "seamer" | "finisher" | "shipping";
export type MaterialKind = "substrate" | "dye";
export type JobStatus = "scheduled" | "running" | "done";
export type JobStepStatus = "pending" | "running" | "done";
export type QuoteStatus = "draft" | "pending_approval" | "approved" | "sent";

export interface Product {
  id: string;
  slug: ProductCategory;
  name: string;
  categoryLabel: string;
  description: string;
  tags: string[];
  idealFor: string;
  image: string;
  aiPrompt: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_id: string | null;
  job_title: string | null;
}

export interface Company {
  id: string;
  name: string;
  margin_percent: number;
  is_reseller: boolean;
  target_margin_percent: number;
  discount_percent: number;
}

export interface EquipmentCapabilities {
  products?: string[];
  types?: string[];
  materials?: string[];
  max_width_in?: number;
  max_colors?: number;
}

export interface Equipment {
  id: string;
  name: string;
  stage: EquipmentStage;
  cost_rate: number;
  run_speed: number;
  waste_percent: number;
  capabilities: EquipmentCapabilities;
  setup_time_minutes: number;
  notes?: string;
  active?: boolean;
}

export interface Material {
  id: string;
  name: string;
  kind: MaterialKind;
  cost_per_sqin: number;
  cost_per_unit: number;
  attributes: Record<string, unknown>;
  notes?: string;
  active?: boolean;
}

export interface RouteMatchAttributes {
  products?: string[];
  types?: string[];
  materials?: string[];
  min_quantity?: number;
  max_quantity?: number;
}

export interface RouteStep {
  id: string;
  route_id: string;
  stage: EquipmentStage;
  step_order: number;
}

export interface ProductionRoute {
  id: string;
  name: string;
  match_attributes: RouteMatchAttributes;
  is_default: boolean;
  steps: RouteStep[];
}

export interface PricingCatalog {
  equipment: Equipment[];
  materials: Material[];
  routes: ProductionRoute[];
  source: "supabase" | "example";
}

export interface Order {
  id: string;
  order_number: string;
  company_id: string;
  description: string;
  quantity: number;
  status: string;
  ship_by: string;
  progress: number;
  total_amount: number | null;
  completed_at: string | null;
  quote_id?: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  amount: number;
  issued_at: string;
  due_at: string;
  status: "Pending" | "Paid" | "Overdue";
}

export interface Proof {
  id: string;
  company_id: string;
  title: string;
  brand: string;
  product_name: string;
  proof_number: string;
  material: string;
  status: string;
  image_url: string;
}

export interface ProofComment {
  id: string;
  proof_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface JobStep {
  id: string;
  job_id: string;
  equipment_id: string;
  route_step_id: string | null;
  planned_hours: number;
  actual_hours: number | null;
  actual_waste: number | null;
  status: JobStepStatus;
  step_order: number;
  equipment?: Equipment;
  started_at?: string;
  ended_at?: string;
}

export interface ScheduleJob {
  id: string;
  job_number: string;
  name: string;
  quantity: string;
  company_id: string;
  material: string;
  due_date: string;
  quote_id: string | null;
  order_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: JobStatus;
  steps: JobStep[];
  /** @deprecated display-only leftovers from the demo gantt */
  resource?: string | null;
  start_day?: number | null;
  duration?: number | null;
}

export interface QuoteSpec {
  product: string;
  type: string;
  material: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
  colors: number;
  finish?: string;
  variableData?: boolean;
  /** @deprecated use product */
  productType?: string;
}

export interface RouteCostLine {
  stage: EquipmentStage;
  equipmentId: string;
  equipmentName: string;
  hours: number;
  cost: number;
  qualified: boolean;
  setupMinutes: number;
  wastePercent: number;
}

export interface QuoteBreakdown {
  materialCost: number;
  substrateCost: number;
  dyeCost: number;
  pressCost: number;
  seamerCost: number;
  finishingCost: number;
  shippingCost: number;
  setupCost: number;
  totalCost: number;
  marginPercent: number;
  finalPrice: number;
  marginAmount: number;
  needsApproval: boolean;
  targetMarginPercent: number;
  discountPercent: number;
  companyMarginPercent: number;
  routeName: string;
  routeId: string;
  lines: RouteCostLine[];
  catalogSource: "supabase" | "example";
}

export interface SavedQuote {
  id: string;
  company_id: string;
  spec: QuoteSpec;
  breakdown: QuoteBreakdown;
  status: QuoteStatus;
  needs_approval: boolean;
  order_id: string | null;
  created_at: string;
}

export interface ParsedDocumentSpec {
  product?: string;
  productType?: string;
  type?: string;
  widthIn?: number;
  heightIn?: number;
  quantity?: number;
  colors?: number;
  material?: string;
  finish?: string;
  variableData?: boolean;
  notes?: string;
  missingFields: string[];
  confidence: number;
}

export interface AccountKpis {
  ytdVolume: number;
  ytdGrowthPercent: number;
  onTimePercent: number;
  openInvoicesAmount: number;
  openInvoicesCount: number;
  overdueCount: number;
  activeOrders: number;
  inProduction: number;
  avgLeadTimeDays: number;
  leadTimeDelta: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
