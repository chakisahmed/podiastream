"use client";

import { MaterialIcon } from "@/components/shared/material-icon";
import { appointmentLabel } from "@/lib/patient-name-cache";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from "@/types/appointment";
import type { Appointment } from "@/types/appointment";
import { STATUS_ACCENT_CLASS, STATUS_BADGE_CLASS } from "./status-styles";

export function DayView({
  appointments,
  patientNames,
  onSelect,
}: {
  appointments: Appointment[];
  patientNames: Map<string, string>;
  onSelect: (appointment: Appointment) => void;
}) {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
        Aucun rendez-vous ce jour-là.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
      {sorted.map((appt) => (
        <button
          key={appt.id}
          onClick={() => onSelect(appt)}
          className="glass-panel rounded-xl p-container-padding flex flex-col relative overflow-hidden text-left hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all"
        >
          <div className={`absolute top-0 left-0 w-1 h-full ${STATUS_ACCENT_CLASS[appt.status]}`} />
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-headline-md text-headline-md text-on-surface">
                {new Date(appt.start_time).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <MaterialIcon name="schedule" className="text-[16px]" />
                {Math.round(
                  (new Date(appt.end_time).getTime() - new Date(appt.start_time).getTime()) / 60000
                )}{" "}
                min
              </div>
            </div>
            <span
              className={`font-label-sm text-label-sm px-2 py-1 rounded-full border ${STATUS_BADGE_CLASS[appt.status]}`}
            >
              {APPOINTMENT_STATUS_LABELS[appt.status]}
            </span>
          </div>
          <h3 className="font-label-md text-label-md text-on-surface">
            {appointmentLabel(appt, patientNames)}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {APPOINTMENT_TYPE_LABELS[appt.appointment_type]}
          </p>
        </button>
      ))}
    </div>
  );
}
