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

export interface ScheduleJob {
  id: string;
  job_number: string;
  name: string;
  quantity: string;
  resource: string;
  start_day: number;
  duration: number;
  due_date: string;
  material: string;
  company_id: string;
}

export type MaterialCategory =
  | "substrate"
  | "adhesive"
  | "laminate"
  | "ink"
  | "packaging"
  | "prepress";

export type AssetKind =
  | "press_flexo"
  | "press_digital"
  | "finishing"
  | "rewind"
  | "laminator"
  | "specialty";

export interface Material {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  /** Dollars per thousand square inches when unit is msi. */
  costPerMsi: number;
  /** Dollars per each / hour / pound when unit is not msi. */
  costPerUnit: number;
  unit: "msi" | "each" | "hour" | "lb";
  wasteFactor: number;
  coverageFactor?: number;
  aliases: string[];
  recommendedFor: string[];
  attributes: {
    thicknessMil?: number;
    outdoorRated?: boolean;
    condensationResistant?: boolean;
    chemicalResistant?: boolean;
    description?: string;
  };
  active: boolean;
}

export interface PlantAsset {
  id: string;
  tag: string;
  name: string;
  kind: AssetKind;
  manufacturer: string;
  model: string;
  plantCode: string;
  hourlyRate: number;
  electricityPerHour: number;
  setupMinutes: number;
  setupMinutesPerColor: number;
  avgSpeedFpm: number;
  maxSpeedFpm: number;
  maxWebWidthIn: number;
  colorStations: number;
  plateCostPerColor: number;
  wastePercent: number;
  capabilities: string[];
  ganttResource: string;
  active: boolean;
}

export interface RateCard {
  id: string;
  prepressBase: number;
  vdpSetup: number;
  vdpPerThousand: number;
  defaultLabelsPerRoll: number;
  rollsPerCarton: number;
  defaultAdhesiveId: string;
  defaultInkId: string;
  defaultCoreId: string;
  defaultCartonId: string;
}

export interface PricingRegistries {
  materials: Material[];
  assets: PlantAsset[];
  rateCard: RateCard;
}

export interface QuoteSpec {
  productType: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
  colors: number;
  material: string;
  finish?: string;
  variableData?: boolean;
  adhesive?: string;
  labelsPerRoll?: number;
  notes?: string;
}

export interface CostBucket {
  key:
    | "material"
    | "press"
    | "ink"
    | "setup"
    | "finishing"
    | "packaging"
    | "prepress";
  label: string;
  amount: number;
}

export interface QuoteBreakdown {
  materialCost: number;
  pressCost: number;
  inkCost: number;
  setupCost: number;
  finishingCost: number;
  packagingCost: number;
  prepressCost: number;
  totalCost: number;
  /** Actual sell-side margin: (price - cost) / price * 100 */
  marginPercent: number;
  /** Customer markup used to set the selling price. */
  appliedMarginPercent: number;
  finalPrice: number;
  marginAmount: number;
  needsApproval: boolean;
  targetMarginPercent: number;
  recommendedAssetId: string;
  recommendedAssetName: string;
  recommendedResource: string;
  routeSteps: string[];
  materialSku: string;
  materialName: string;
  across: number;
  runMinutes: number;
  rationale: string[];
  buckets: CostBucket[];
}

export interface ParsedDocumentSpec {
  productType?: string;
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
  source?: "text" | "pdf" | "excel" | "image" | "unknown";
}

export type EstimateStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "ticketed";

export interface SavedEstimate {
  id: string;
  companyId: string;
  companyName: string;
  createdBy: string;
  spec: QuoteSpec;
  breakdown: QuoteBreakdown;
  status: EstimateStatus;
  needsApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalDecision {
  id: string;
  estimateId: string;
  decidedBy: string;
  decidedAt: string;
  decision: "approved" | "rejected";
  reason: string;
  actualMarginPercent: number;
  targetMarginPercent: number;
}

export interface JobTicket {
  id: string;
  ticketNumber: string;
  estimateId: string;
  companyId: string;
  companyName: string;
  productType: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
  colors: number;
  materialSku: string;
  materialName: string;
  finish?: string;
  variableData: boolean;
  recommendedAssetId: string;
  recommendedAssetName: string;
  recommendedResource: string;
  routeSteps: string[];
  internalRefs: {
    estimateId: string;
    approvalId?: string;
    companyId: string;
  };
  createdAt: string;
  scheduled: boolean;
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
