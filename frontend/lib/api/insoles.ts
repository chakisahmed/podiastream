import { apiFetch, apiFetchBlob } from "./client";
import type { InsoleAttachment, InsoleOrder } from "@/types/insole";

export type InsoleOrderInput = {
  patient: string;
  status: InsoleOrder["status"];
  materials_used?: string;
  corrections?: string;
  manufacturing_notes?: string;
  price?: string | null;
  estimated_delivery_date?: string | null;
};

// InsoleOrderViewSet has pagination disabled — the Kanban board always
// wants the full set of orders, not one page at a time.
export function listInsoleOrders() {
  return apiFetch<InsoleOrder[]>("/api/insole-orders/");
}

export function listInsoleOrdersForPatient(patientId: string) {
  return apiFetch<InsoleOrder[]>(`/api/insole-orders/?patient=${patientId}`);
}

export function createInsoleOrder(input: InsoleOrderInput) {
  return apiFetch<InsoleOrder>("/api/insole-orders/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateInsoleOrder(id: string, input: Partial<InsoleOrderInput>) {
  return apiFetch<InsoleOrder>(`/api/insole-orders/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function transitionInsoleOrder(id: string, newStatus: InsoleOrder["status"], comment?: string) {
  return apiFetch<InsoleOrder>(`/api/insole-orders/${id}/transition/`, {
    method: "POST",
    body: JSON.stringify({ status: newStatus, comment: comment ?? "" }),
  });
}

export function deleteInsoleOrder(id: string) {
  return apiFetch<void>(`/api/insole-orders/${id}/`, { method: "DELETE" });
}

export function uploadInsolePhoto(orderId: string, file: File, fileType: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("file_type", fileType);

  return apiFetch<InsoleAttachment>(`/api/insole-orders/${orderId}/attachments/`, {
    method: "POST",
    body: formData,
  });
}

export async function downloadInsoleAttachment(attachment: InsoleAttachment) {
  const blob = await apiFetchBlob(
    `/api/insole-orders/${attachment.insole_order}/attachments/${attachment.id}/download/`
  );
  const extension = attachment.storage_path.split(".").pop();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${attachment.file_type}.${extension}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
