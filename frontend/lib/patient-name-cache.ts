import { getPatient } from "@/lib/api/patients";

const cache = new Map<string, string>();

export async function resolvePatientNames(ids: string[]): Promise<Map<string, string>> {
  const missing = [...new Set(ids)].filter((id) => !cache.has(id));
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
