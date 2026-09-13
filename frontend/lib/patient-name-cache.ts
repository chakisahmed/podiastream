import { getPatient } from "@/lib/api/patients";

const cache = new Map<string, string>();

export async function resolvePatientNames(
  ids: (string | null)[]
): Promise<Map<string, string>> {
  const present = ids.filter((id): id is string => Boolean(id));
  const missing = [...new Set(present)].filter((id) => !cache.has(id));
  await Promise.all(
    missing.map(async (id) => {
      try {
        const patient = await getPatient(id);
        cache.set(id, `${patient.first_name} ${patient.last_name}`);
      } catch {
        cache.set(id, "Patient");
      }
    })
  );
  return cache;
}

/** What to show for an appointment: the linked patient's name, or the name it
 * was booked under when nobody has a record yet. */
export function appointmentLabel(
  appointment: { patient: string | null; booked_name: string },
  names: Map<string, string>
): string {
  if (appointment.patient) return names.get(appointment.patient) ?? "...";
  return appointment.booked_name || "Sans nom";
}
