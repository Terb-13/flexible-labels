export const CUSTOMER_WIZARD_STEPS = [
  { id: "customer", label: "Account", shortLabel: "Account" },
  { id: "specs", label: "Product & Specs", shortLabel: "Specs" },
  { id: "material", label: "Material & Files", shortLabel: "Material" },
  { id: "review", label: "Your Price", shortLabel: "Price" },
] as const;

export const INTERNAL_WIZARD_STEPS = [
  { id: "customer", label: "Customer", shortLabel: "Customer" },
  { id: "specs", label: "Product & Specs", shortLabel: "Specs" },
  { id: "material", label: "Material & Files", shortLabel: "Material" },
  { id: "review", label: "Review & Price", shortLabel: "Price" },
  { id: "output", label: "Approval & Ticket", shortLabel: "Output" },
] as const;

export type WizardStepId =
  | (typeof CUSTOMER_WIZARD_STEPS)[number]["id"]
  | (typeof INTERNAL_WIZARD_STEPS)[number]["id"];

export type WizardStepDef = {
  id: WizardStepId;
  label: string;
  shortLabel: string;
};
