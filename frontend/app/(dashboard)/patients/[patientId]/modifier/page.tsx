"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import { PatientForm } from "@/components/patients/patient-form";
import { getPatient, updatePatient } from "@/lib/api/patients";
import type { Patient, PatientInput } from "@/types/patient";

export default function EditPatientPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId)
      .then(setPatient)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, [patientId]);

  async function handleSubmit(values: PatientInput) {
    setPending(true);
    setError(null);
    try {
      await updatePatient(patientId, values);
      router.push(`/patients/${patientId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
      setPending(false);
    }
  }

  return (
    <>
      <Link
        href={`/patients/${patientId}`}
        className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg hover:bg-white/20 w-fit"
      >
        <MaterialIcon name="arrow_back" />
        <span className="font-label-md text-label-md">Retour au dossier</span>
      </Link>

      <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg">
        Modifier le patient
      </h1>

      {error && (
        <p className="text-error font-body-sm text-body-sm" role="alert">
          {error}
        </p>
      )}

      {patient && (
        <PatientForm
          patient={patient}
          onSubmit={handleSubmit}
          submitLabel="Enregistrer les modifications"
          pending={pending}
        />
      )}
    </>
  );
}
