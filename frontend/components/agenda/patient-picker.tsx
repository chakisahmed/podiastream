"use client";

import { useEffect, useState } from "react";
import { listPatients } from "@/lib/api/patients";
import type { Patient } from "@/types/patient";

export function PatientPicker({
  value,
  onChange,
}: {
  value: { id: string; label: string } | null;
  onChange: (patient: { id: string; label: string } | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      listPatients(query).then((data) => setResults(data.results));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  if (value) {
    return (
      <div className="glass-input rounded-lg px-3 py-2 flex items-center justify-between">
        <span className="font-body-sm text-body-sm text-on-surface">{value.label}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-on-surface-variant hover:text-error font-label-sm text-label-sm"
        >
          Changer
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        className="glass-input rounded-lg px-3 py-2 text-on-surface w-full"
        placeholder="Rechercher un patient existant..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full glass-modal rounded-lg overflow-hidden max-h-48 overflow-y-auto">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-primary/10 font-body-sm text-body-sm"
                onClick={() => {
                  onChange({ id: p.id, label: `${p.first_name} ${p.last_name}` });
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
              >
                {p.first_name} {p.last_name}
                {p.phone && (
                  <span className="text-on-surface-variant"> — {p.phone}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
