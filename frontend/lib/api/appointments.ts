import { apiFetch } from "./client";
import type { Appointment } from "@/types/appointment";
import type { PaginatedResponse } from "@/types/patient";

export type AppointmentInput = {
  patient: string;
  appointment_type: Appointment["appointment_type"];
  status: Appointment["status"];
  start_time: string;
  end_time: string;
  notes?: string;
};

export function listAppointments(startISO: string, endISO: string) {
  return apiFetch<PaginatedResponse<Appointment>>(
    `/api/appointments/?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`
  );
}

export function listAppointmentsForPatient(patientId: string) {
  return apiFetch<PaginatedResponse<Appointment>>(
    `/api/appointments/?patient=${patientId}`
  );
}

export function createAppointment(input: AppointmentInput) {
  return apiFetch<Appointment>("/api/appointments/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAppointment(id: string, input: Partial<AppointmentInput>) {
  return apiFetch<Appointment>(`/api/appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAppointment(id: string) {
  return apiFetch<void>(`/api/appointments/${id}/`, { method: "DELETE" });
}
