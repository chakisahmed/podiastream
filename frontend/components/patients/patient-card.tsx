import Link from "next/link";
import { MaterialIcon } from "@/components/shared/material-icon";
import type { Patient } from "@/types/patient";

const AVATAR_STYLES = [
  "bg-primary-container text-on-primary-container",
  "bg-tertiary-container text-on-tertiary-container",
  "bg-secondary-fixed-dim text-on-secondary-fixed",
];

function initials(patient: Patient) {
  return `${patient.first_name.charAt(0)}${patient.last_name.charAt(0)}`.toUpperCase();
}

function formatAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const formatted = dob.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const age = Math.floor(
    (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  return `${formatted} (${age} ans)`;
}

export function PatientCard({ patient, index }: { patient: Patient; index: number }) {
  const noteText = [patient.allergies, patient.medical_background]
    .filter(Boolean)
    .join(" — ");
  const age = formatAge(patient.date_of_birth);

  return (
    <Link
      href={`/patients/${patient.id}`}
      className="glass-panel rounded-xl p-5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-headline-md text-headline-md font-bold ${AVATAR_STYLES[index % AVATAR_STYLES.length]}`}
          >
            {initials(patient)}
          </div>
          <div>
            <h2 className="font-headline-md text-[18px] leading-[24px] font-semibold text-on-surface">
              {patient.first_name} {patient.last_name}
            </h2>
            {age && (
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                <MaterialIcon name="calendar_today" className="text-[16px]" /> {age}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {patient.phone && (
          <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <MaterialIcon name="call" className="text-[18px] text-primary" />
            {patient.phone}
          </div>
        )}
        {noteText && (
          <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <MaterialIcon name="sticky_note_2" className="text-[18px] text-secondary mt-0.5" />
            <p className="line-clamp-2">{noteText}</p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between items-center">
        <span
          className={`px-2 py-1 rounded font-label-sm text-label-sm ${
            patient.is_active
              ? "bg-secondary-container/30 text-on-secondary-container"
              : "bg-surface-variant text-on-surface-variant"
          }`}
        >
          {patient.is_active ? "Actif" : "Inactif"}
        </span>
        <MaterialIcon
          name="arrow_forward"
          className="text-outline group-hover:text-primary transition-colors"
        />
      </div>
    </Link>
  );
}
