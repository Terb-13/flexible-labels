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

export interface QuoteSpec {
  productType: string;
  widthIn: number;
  heightIn: number;
  quantity: number;
  colors: number;
  material: string;
  finish?: string;
  variableData?: boolean;
}

export interface QuoteBreakdown {
  materialCost: number;
  pressCost: number;
  finishingCost: number;
  setupCost: number;
  totalCost: number;
  marginPercent: number;
  finalPrice: number;
  marginAmount: number;
  needsApproval: boolean;
  targetMarginPercent: number;
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
