import { apiFetch } from "./client";
import type {
  ConsumptionRule,
  ConsumptionTrigger,
  StockItem,
  StockMovement,
  SuggestedOrder,
} from "@/types/inventory";

export type StockItemInput = {
  name: string;
  sku?: string;
  category: StockItem["category"];
  unit: string;
  minimum_quantity: string;
  pack_size: string;
  supplier_name?: string;
  supplier_lead_time_days?: number;
  unit_cost?: string | null;
  notes?: string;
  is_active?: boolean;
};

// StockItemViewSet has pagination disabled — a cabinet's whole catalog is a
// couple dozen items at most, and the low-stock / ordering views need all
// of them at once.
export function listStockItems() {
  return apiFetch<StockItem[]>("/api/stock-items/");
}

export function createStockItem(input: StockItemInput) {
  return apiFetch<StockItem>("/api/stock-items/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStockItem(id: string, input: Partial<StockItemInput>) {
  return apiFetch<StockItem>(`/api/stock-items/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteStockItem(id: string) {
  return apiFetch<void>(`/api/stock-items/${id}/`, { method: "DELETE" });
}

export function listStockMovements(itemId: string) {
  return apiFetch<StockMovement[]>(`/api/stock-items/${itemId}/movements/`);
}

export function recordDelivery(itemId: string, quantity: string, unitCost: string | null, note: string) {
  return apiFetch<StockItem>(`/api/stock-items/${itemId}/deliveries/`, {
    method: "POST",
    body: JSON.stringify({ quantity, unit_cost: unitCost, note }),
  });
}

export function recordAdjustment(itemId: string, quantityDelta: string, note: string) {
  return apiFetch<StockItem>(`/api/stock-items/${itemId}/adjustments/`, {
    method: "POST",
    body: JSON.stringify({ quantity_delta: quantityDelta, note }),
  });
}

export function recordCount(itemId: string, countedQuantity: string, note: string) {
  return apiFetch<StockItem>(`/api/stock-items/${itemId}/counts/`, {
    method: "POST",
    body: JSON.stringify({ counted_quantity: countedQuantity, note }),
  });
}

export function listLowStockItems() {
  return apiFetch<StockItem[]>("/api/stock-items/low-stock/");
}

export function listSuggestedOrders(monthsHistory?: number) {
  const query = monthsHistory ? `?months_history=${monthsHistory}` : "";
  return apiFetch<SuggestedOrder[]>(`/api/stock-items/suggested-orders/${query}`);
}

export function listConsumptionRules(itemId?: string) {
  const query = itemId ? `?item=${itemId}` : "";
  return apiFetch<ConsumptionRule[]>(`/api/consumption-rules/${query}`);
}

export function createConsumptionRule(itemId: string, trigger: ConsumptionTrigger, quantityPerUnit: string) {
  return apiFetch<ConsumptionRule>("/api/consumption-rules/", {
    method: "POST",
    body: JSON.stringify({ item: itemId, trigger, quantity_per_unit: quantityPerUnit }),
  });
}

export function deleteConsumptionRule(id: string) {
  return apiFetch<void>(`/api/consumption-rules/${id}/`, { method: "DELETE" });
}
