import { apiFetch } from "./client";
import type {
  ConsultationNote,
  PaginatedResponse,
  Patient,
  PatientInput,
} from "@/types/patient";

export function listPatients(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<PaginatedResponse<Patient>>(`/api/patients/${query}`);
}

export function getPatient(id: string) {
  return apiFetch<Patient>(`/api/patients/${id}/`);
}

// Django's DateField/DecimalField reject "" (unlike CharField-based fields,
// which treat it as blank) — send null instead for the fields left empty.
function sanitize(input: PatientInput) {
  return {
    ...input,
    date_of_birth: input.date_of_birth || null,
    shoe_size: input.shoe_size || null,
  };
}

export function createPatient(input: PatientInput) {
  return apiFetch<Patient>("/api/patients/", {
    method: "POST",
    body: JSON.stringify(sanitize(input)),
  });
}

export function updatePatient(id: string, input: PatientInput) {
  return apiFetch<Patient>(`/api/patients/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(sanitize(input)),
  });
}

export function deletePatient(id: string) {
  return apiFetch<void>(`/api/patients/${id}/`, { method: "DELETE" });
}

export function listConsultationNotes(patientId: string) {
  return apiFetch<PaginatedResponse<ConsultationNote>>(
    `/api/consultation-notes/?patient=${patientId}`
  );
}

export function createConsultationNote(
  patientId: string,
  input: Pick<ConsultationNote, "motif" | "bilan_podologique" | "diagnostic" | "treatment_plan">
) {
  return apiFetch<ConsultationNote>("/api/consultation-notes/", {
    method: "POST",
    body: JSON.stringify({ patient: patientId, ...input }),
  });
}
