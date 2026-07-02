"use client";

import { getISOWeekNumber } from "@/lib/calendar-utils";
import type { Appointment } from "@/types/appointment";
import { STATUS_BADGE_CLASS } from "./status-styles";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MAX_VISIBLE_PER_DAY = 3;

export function MonthView({
  weeks,
  currentMonth,
  appointments,
  patientNames,
  onSelectDay,
  onSelectAppointment,
}: {
  weeks: Date[][];
  currentMonth: number;
  appointments: Appointment[];
  patientNames: Map<string, string>;
  onSelectDay: (date: Date) => void;
  onSelectAppointment: (appointment: Appointment) => void;
}) {
  const today = new Date();

  return (
    <div className="glass-panel rounded-xl p-3 overflow-hidden">
      <div className="grid grid-cols-[36px_repeat(7,1fr)] mb-1">
        <div />
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="font-label-sm text-label-sm text-on-surface-variant text-center py-2"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((week) => (
          <div key={week[0].toISOString()} className="grid grid-cols-[36px_repeat(7,1fr)] gap-1">
            <div className="flex items-start justify-center pt-2">
              <span className="font-label-sm text-label-sm text-outline">
                {getISOWeekNumber(week[0])}
              </span>
            </div>

            {week.map((day) => {
              const dayAppointments = appointments
                .filter((a) => new Date(a.start_time).toDateString() === day.toDateString())
                .sort(
                  (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                );
              const isToday = day.toDateString() === today.toDateString();
              const isCurrentMonth = day.getMonth() === currentMonth;
              const visible = dayAppointments.slice(0, MAX_VISIBLE_PER_DAY);
              const overflow = dayAppointments.length - visible.length;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onSelectDay(day)}
                  role="button"
                  tabIndex={0}
                  className={`min-h-[100px] rounded-lg p-1.5 flex flex-col gap-1 text-left cursor-pointer transition-colors hover:bg-white/60 ${
                    isCurrentMonth ? "bg-white/30" : "bg-transparent opacity-40"
                  }`}
                >
                  <span
                    className={`font-label-md text-label-md w-6 h-6 flex items-center justify-center rounded-full self-end ${
                      isToday ? "bg-primary text-on-primary" : "text-on-surface"
                    }`}
                  >
                    {day.getDate()}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    {visible.map((appt) => (
                      <button
                        key={appt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAppointment(appt);
                        }}
                        className={`w-full text-left px-1.5 py-0.5 rounded font-label-sm text-label-sm truncate border ${STATUS_BADGE_CLASS[appt.status]}`}
                        title={`${new Date(appt.start_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} ${patientNames.get(appt.patient) ?? ""}`}
                      >
                        {new Date(appt.start_time).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {patientNames.get(appt.patient) ?? "..."}
                      </button>
                    ))}
                    {overflow > 0 && (
                      <span className="px-1.5 font-label-sm text-label-sm text-on-surface-variant">
                        +{overflow} de plus
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
