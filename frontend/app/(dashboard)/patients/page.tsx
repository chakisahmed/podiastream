"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import { PatientCard } from "@/components/patients/patient-card";
import { listPatients } from "@/lib/api/patients";
import type { Patient } from "@/types/patient";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      setError(null);
      listPatients(search)
        .then((data) => {
          setPatients(data.results);
          setCount(data.count);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <>
      <section className="glass-panel rounded-xl p-4 md:p-container-padding flex flex-col md:flex-row gap-gutter items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
        <div className="relative w-full md:max-w-md">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-lg glass-input text-on-surface placeholder:text-outline font-body-md transition-all"
            placeholder="Rechercher un patient..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-gutter w-full md:w-auto">
          <div className="text-body-sm font-body-sm text-outline whitespace-nowrap">
            {count} Patient{count > 1 ? "s" : ""}
          </div>
        </div>
      </section>

      {error && (
        <p className="text-error font-body-sm text-body-sm" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && patients.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
          Aucun patient trouvé.
        </p>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {patients.map((patient, index) => (
          <PatientCard key={patient.id} patient={patient} index={index} />
        ))}
      </section>

      <Link
        href="/patients/nouveau"
        className="fixed md:bottom-stack-lg md:right-stack-lg bottom-24 right-4 z-40 bg-primary text-on-primary w-14 h-14 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center"
        aria-label="Ajouter un patient"
      >
        <MaterialIcon name="add" className="text-[32px]" />
      </Link>
    </>
  );
}
