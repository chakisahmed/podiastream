import { APPOINTMENT_TYPE_LABELS } from "@/types/appointment";
import type { Appointment } from "@/types/appointment";

export type StockCategory = "consommable" | "matiere_premiere" | "autre";

export const STOCK_CATEGORY_LABELS: Record<StockCategory, string> = {
  consommable: "Consommable",
  matiere_premiere: "Matière première",
  autre: "Autre",
};

export type StockItem = {
  id: string;
  name: string;
  sku: string;
  category: StockCategory;
  unit: string;
  current_quantity: string;
  minimum_quantity: string;
  pack_size: string;
  supplier_name: string;
  supplier_lead_time_days: number;
  unit_cost: string | null;
  notes: string;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
};

export type MovementType = "livraison" | "utilisation" | "inventaire" | "ajustement";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  livraison: "Livraison fournisseur",
  utilisation: "Consommation",
  inventaire: "Comptage / correction",
  ajustement: "Ajustement manuel",
};

export const MOVEMENT_TYPE_ICONS: Record<MovementType, string> = {
  livraison: "local_shipping",
  utilisation: "medical_services",
  inventaire: "fact_check",
  ajustement: "tune",
};

export type StockMovement = {
  id: string;
  item: string;
  movement_type: MovementType;
  quantity_delta: string;
  unit_cost: string | null;
  appointment: string | null;
  insole_order: string | null;
  note: string;
  created_by: string | null;
  created_at: string;
};

// Every real visit type, minus "absence" (blocked time, not a visit that
// consumes anything), plus the insole-fabrication trigger — mirrors
// ConsumptionRule.TRIGGER_CHOICES on the backend.
export const INSOLE_ORDER_TRIGGER = "insole_order" as const;

export type ConsumptionTrigger = Exclude<Appointment["appointment_type"], "absence"> | typeof INSOLE_ORDER_TRIGGER;

export const CONSUMPTION_TRIGGER_LABELS: Record<ConsumptionTrigger, string> = {
  bilan_podologique: APPOINTMENT_TYPE_LABELS.bilan_podologique,
  remise_semelles: APPOINTMENT_TYPE_LABELS.remise_semelles,
  soin_pedicurie: APPOINTMENT_TYPE_LABELS.soin_pedicurie,
  suivi_controle: APPOINTMENT_TYPE_LABELS.suivi_controle,
  [INSOLE_ORDER_TRIGGER]: "Fabrication d'une paire de semelles",
};

export const CONSUMPTION_TRIGGERS = Object.keys(CONSUMPTION_TRIGGER_LABELS) as ConsumptionTrigger[];

export type ConsumptionRule = {
  id: string;
  item: string;
  trigger: ConsumptionTrigger;
  quantity_per_unit: string;
};

export type SuggestedOrder = {
  item: StockItem;
  expected_usage_next_month: string;
  suggested_order_quantity: string;
};
