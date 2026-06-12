"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/shared/material-icon";
import { PatientForm } from "@/components/patients/patient-form";
import { createPatient } from "@/lib/api/patients";
import type { PatientInput } from "@/types/patient";

export default function NewPatientPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: PatientInput) {
    setPending(true);
    setError(null);
    try {
      const patient = await createPatient(values);
      router.push(`/patients/${patient.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
      setPending(false);
    }
  }

  return (
    <>
      <Link
        href="/patients"
        className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg hover:bg-white/20 w-fit"
      >
        <MaterialIcon name="arrow_back" />
        <span className="font-label-md text-label-md">Retour aux patients</span>
      </Link>

      <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg">
        Nouveau patient
      </h1>

      {error && (
        <p className="text-error font-body-sm text-body-sm" role="alert">
          {error}
        </p>
      )}

      <PatientForm onSubmit={handleSubmit} submitLabel="Créer le patient" pending={pending} />
    </>
  );
}
