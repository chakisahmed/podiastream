import { apiFetch, apiFetchBlob } from "./client";
import { DOCUMENT_TYPE_LABELS } from "@/types/document";
import type { PaginatedResponse } from "@/types/patient";
import type { DocumentType, PatientDocument } from "@/types/document";

export function listDocumentsForPatient(patientId: string) {
  return apiFetch<PaginatedResponse<PatientDocument>>(`/api/documents/?patient=${patientId}`);
}

export function deleteDocument(id: string) {
  return apiFetch<void>(`/api/documents/${id}/`, { method: "DELETE" });
}

export async function downloadDocument(document: PatientDocument) {
  const blob = await apiFetchBlob(`/api/documents/${document.id}/download/`);
  const extension = document.storage_path.split(".").pop();
  const filename = `${DOCUMENT_TYPE_LABELS[document.document_type]}.${extension}`;

  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function uploadPatientDocument(
  patientId: string,
  file: File,
  documentType: DocumentType,
  appointmentId?: string | null
) {
  const formData = new FormData();
  formData.append("patient", patientId);
  formData.append("document_type", documentType);
  if (appointmentId) formData.append("appointment", appointmentId);
  formData.append("file", file);

  return apiFetch<PatientDocument>("/api/documents/", {
    method: "POST",
    body: formData,
  });
}
