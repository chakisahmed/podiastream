"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import { STATUS_ACCENT_CLASS, STATUS_BADGE_CLASS } from "@/components/agenda/status-styles";
import { listAppointments } from "@/lib/api/appointments";
import { getWeekDays } from "@/lib/calendar-utils";
import { appointmentLabel, resolvePatientNames } from "@/lib/patient-name-cache";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from "@/types/appointment";
import type { Appointment } from "@/types/appointment";

function atStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function atEndOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function durationLabel(start: string, end: string) {
  const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${minutes} min`;
}

export default function DashboardPage() {
  const today = new Date();
  const weekDays = getWeekDays(today);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNames, setPatientNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAppointments(atStartOfDay(today).toISOString(), atEndOfDay(today).toISOString())
      .then(async (data) => {
        const sorted = [...data.results].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        setAppointments(sorted);
        const names = await resolvePatientNames(sorted.map((a) => a.patient));
        setPatientNames(new Map(names));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-gutter">
        <div>
          <h1 className="font-headline-xl text-headline-lg-mobile md:text-headline-xl text-on-surface mb-2">
            Bonjour, Dr. Smith
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Voici votre aperçu de la journée.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/patients/nouveau"
            className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2 text-primary font-label-md hover:bg-white/50 transition-colors border border-primary/30"
          >
            <MaterialIcon name="person_add" />
            Ajouter Patient
          </Link>
          <Link
            href="/agenda"
            className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 font-label-md hover:bg-primary/90 transition-colors shadow-md"
          >
            <MaterialIcon name="calendar_add_on" />
            Nouveau RDV
          </Link>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {weekDays.map((day) => {
            const isToday = day.toDateString() === today.toDateString();
            return (
              <div
                key={day.toISOString()}
                className={`flex flex-col items-center justify-center p-3 rounded-lg w-16 transition-colors border border-transparent ${
                  isToday
                    ? "bg-primary text-on-primary shadow-md border-primary/20"
                    : "bg-white/40 text-on-surface-variant"
                }`}
              >
                <span className="font-label-sm text-label-sm uppercase">
                  {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                </span>
                <span className="font-headline-md text-headline-md">{day.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-6 flex items-center gap-2">
          <MaterialIcon name="event_upcoming" className="text-primary" />
          Aperçu de la journée
        </h2>

        {error && (
          <p className="text-error font-body-sm text-body-sm" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
            Chargement...
          </p>
        ) : appointments.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Aucun rendez-vous aujourd&apos;hui.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appt) => {
              const initials = appointmentLabel(appt, patientNames)
                .split(" ")
                .map((part) => part.charAt(0))
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={appt.id}
                  className="glass-panel rounded-xl p-container-padding flex flex-col relative overflow-hidden group"
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
                        <MaterialIcon name="schedule" className="text-[16px]" />{" "}
                        {durationLabel(appt.start_time, appt.end_time)}
                      </div>
                    </div>
                    <span
                      className={`font-label-sm text-label-sm px-2 py-1 rounded-full border ${STATUS_BADGE_CLASS[appt.status]}`}
                    >
                      {APPOINTMENT_STATUS_LABELS[appt.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-headline-md">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-label-md text-label-md text-on-surface">
                        {appointmentLabel(appt, patientNames)}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {APPOINTMENT_TYPE_LABELS[appt.appointment_type]}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                    {appt.patient ? (
                      <Link
                        href={`/patients/${appt.patient}`}
                        className="text-primary hover:text-primary-container font-label-md text-label-md transition-colors flex items-center gap-1"
                      >
                        Dossier <MaterialIcon name="arrow_forward" className="text-[18px]" />
                      </Link>
                    ) : (
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Pas encore de dossier
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
