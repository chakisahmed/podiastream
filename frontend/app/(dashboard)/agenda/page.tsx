"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import { AppointmentModal } from "@/components/agenda/appointment-modal";
import { CalendarHeader, type ViewMode } from "@/components/agenda/calendar-header";
import { DayView } from "@/components/agenda/day-view";
import { MonthView } from "@/components/agenda/month-view";
import { WeekView } from "@/components/agenda/week-view";
import { listAppointments } from "@/lib/api/appointments";
import {
  formatPeriodLabel,
  getMonthWeeks,
  getWeekDays,
  rangeForView,
  shiftDate,
} from "@/lib/calendar-utils";
import { resolvePatientNames } from "@/lib/patient-name-cache";
import type { Appointment } from "@/types/appointment";

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("semaine");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNames, setPatientNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalState, setModalState] = useState<
    | { mode: "closed" }
    | { mode: "create"; start: Date; end?: Date }
    | { mode: "edit"; appointment: Appointment }
  >({ mode: "closed" });

  function defaultStartAt9(date: Date) {
    const d = new Date(date);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  function reload() {
    setLoading(true);
    setError(null);
    const { start, end } = rangeForView(viewMode, currentDate);
    listAppointments(start.toISOString(), end.toISOString())
      .then(async (data) => {
        setAppointments(data.results);
        const names = await resolvePatientNames(data.results.map((a) => a.patient));
        setPatientNames(new Map(names));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [viewMode, currentDate]);

  function closeModal(shouldReload: boolean) {
    setModalState({ mode: "closed" });
    if (shouldReload) reload();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-headline-xl text-headline-lg-mobile md:text-headline-xl text-on-surface">
          Agenda
        </h1>
        <button
          onClick={() => setModalState({ mode: "create", start: defaultStartAt9(currentDate) })}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 font-label-md hover:bg-primary/90 transition-colors shadow-md"
        >
          <MaterialIcon name="calendar_add_on" />
          Nouveau RDV
        </button>
      </div>

      <CalendarHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        periodLabel={formatPeriodLabel(viewMode, currentDate)}
        onPrev={() => setCurrentDate((d) => shiftDate(viewMode, d, -1))}
        onNext={() => setCurrentDate((d) => shiftDate(viewMode, d, 1))}
        onToday={() => setCurrentDate(new Date())}
      />

      {error && (
        <p className="text-error font-body-sm text-body-sm" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
          Chargement...
        </p>
      ) : (
        <>
          {viewMode === "jour" && (
            <DayView
              appointments={appointments}
              patientNames={patientNames}
              onSelect={(appointment) => setModalState({ mode: "edit", appointment })}
            />
          )}
          {viewMode === "semaine" && (
            <WeekView
              days={getWeekDays(currentDate)}
              appointments={appointments}
              patientNames={patientNames}
              onSelect={(appointment) => setModalState({ mode: "edit", appointment })}
              onCreateSlot={(start, end) => setModalState({ mode: "create", start, end })}
            />
          )}
          {viewMode === "mois" && (
            <MonthView
              weeks={getMonthWeeks(currentDate)}
              currentMonth={currentDate.getMonth()}
              appointments={appointments}
              patientNames={patientNames}
              onSelectDay={(date) => {
                setCurrentDate(date);
                setViewMode("jour");
              }}
              onSelectAppointment={(appointment) => setModalState({ mode: "edit", appointment })}
            />
          )}
        </>
      )}

      {modalState.mode !== "closed" && (
        <AppointmentModal
          appointment={
            modalState.mode === "edit"
              ? {
                  ...modalState.appointment,
                  patientLabel: patientNames.get(modalState.appointment.patient),
                }
              : undefined
          }
          defaultStart={modalState.mode === "create" ? modalState.start : undefined}
          defaultEnd={modalState.mode === "create" ? modalState.end : undefined}
          onClose={() => closeModal(false)}
          onSaved={() => closeModal(true)}
        />
      )}
    </>
  );
}
