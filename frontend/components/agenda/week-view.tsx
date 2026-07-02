"use client";

import { useEffect, useRef, useState } from "react";
import { APPOINTMENT_TYPE_LABELS } from "@/types/appointment";
import type { Appointment } from "@/types/appointment";
import { STATUS_BADGE_CLASS } from "./status-styles";

const START_HOUR = 8;
const END_HOUR = 19;
const SLOT_MINUTES = 15;
const PX_PER_MINUTE = 2;
const SLOT_HEIGHT = SLOT_MINUTES * PX_PER_MINUTE; // 30px
const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;
const GRID_HEIGHT = (END_HOUR - START_HOUR) * 60 * PX_PER_MINUTE;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function slotIndexToDate(day: Date, slotIndex: number) {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(START_HOUR * 60 + slotIndex * SLOT_MINUTES);
  return d;
}

type DragState = { dayIndex: number; startSlot: number; endSlot: number };
type HoverInfo = { label: string; x: number; y: number; flip: boolean };

// Width reserved for the tooltip so it flips before actually touching the
// viewport edge — this is what lets it flip instead of getting clipped.
const TOOLTIP_SAFE_WIDTH = 90;

export function WeekView({
  days,
  appointments,
  patientNames,
  onSelect,
  onCreateSlot,
}: {
  days: Date[];
  appointments: Appointment[];
  patientNames: Map<string, string>;
  onSelect: (appointment: Appointment) => void;
  onCreateSlot: (start: Date, end: Date) => void;
}) {
  const today = new Date();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const draggingRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    function finishDrag() {
      const current = dragRef.current;
      if (draggingRef.current && current) {
        const lo = Math.min(current.startSlot, current.endSlot);
        const hi = Math.max(current.startSlot, current.endSlot);
        const day = days[current.dayIndex];
        onCreateSlot(slotIndexToDate(day, lo), slotIndexToDate(day, hi + 1));
      }
      draggingRef.current = false;
      setDrag(null);
    }
    window.addEventListener("mouseup", finishDrag);
    return () => window.removeEventListener("mouseup", finishDrag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, onCreateSlot]);

  function handleSlotMouseDown(dayIndex: number, slotIndex: number) {
    draggingRef.current = true;
    setDrag({ dayIndex, startSlot: slotIndex, endSlot: slotIndex });
  }

  function handleSlotMouseEnter(dayIndex: number, slotIndex: number) {
    if (!draggingRef.current || !dragRef.current || dragRef.current.dayIndex !== dayIndex) return;
    setDrag((prev) => (prev ? { ...prev, endSlot: slotIndex } : prev));
  }

  // Shows the exact time next to the cursor on hover, so the user doesn't
  // have to trace horizontally back to the hour axis — most useful for the
  // columns furthest from it, where the tooltip flips to the cursor's left
  // instead of overflowing past the right edge of the screen.
  function handleSlotHover(e: React.MouseEvent, dayIndex: number, slotIndex: number) {
    const label = slotIndexToDate(days[dayIndex], slotIndex).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const flip = e.clientX > window.innerWidth - TOOLTIP_SAFE_WIDTH;
    setHover({ label, x: e.clientX, y: e.clientY, flip });
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden select-none">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day headers */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-outline-variant/20">
            <div />
            {days.map((day) => {
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div key={day.toISOString()} className="text-center py-2">
                  <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                    {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                  </p>
                  <p
                    className={`font-headline-md text-headline-md ${isToday ? "text-primary" : "text-on-surface"}`}
                  >
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)]">
            {/* Hour axis */}
            <div className="relative" style={{ height: GRID_HEIGHT }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 font-label-sm text-label-sm text-on-surface-variant"
                  style={{ top: (h - START_HOUR) * 60 * PX_PER_MINUTE }}
                >
                  {pad(h)}:00
                </div>
              ))}
            </div>

            {days.map((day, dayIndex) => {
              const dayAppointments = appointments.filter(
                (a) => new Date(a.start_time).toDateString() === day.toDateString()
              );
              const selection = drag && drag.dayIndex === dayIndex ? drag : null;

              return (
                <div
                  key={day.toISOString()}
                  className="relative border-l border-outline-variant/20"
                  style={{ height: GRID_HEIGHT }}
                  onMouseLeave={() => setHover(null)}
                >
                  {/* Hour gridlines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-outline-variant/15 pointer-events-none"
                      style={{ top: (h - START_HOUR) * 60 * PX_PER_MINUTE }}
                    />
                  ))}

                  {/* 15-minute interaction slots */}
                  {Array.from({ length: SLOTS_PER_DAY }, (_, slotIndex) => (
                    <div
                      key={slotIndex}
                      onMouseDown={() => handleSlotMouseDown(dayIndex, slotIndex)}
                      onMouseEnter={(e) => {
                        handleSlotMouseEnter(dayIndex, slotIndex);
                        handleSlotHover(e, dayIndex, slotIndex);
                      }}
                      className="absolute left-0 right-0 cursor-pointer hover:bg-primary/5"
                      style={{ top: slotIndex * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                    />
                  ))}

                  {/* Drag selection overlay */}
                  {selection && (
                    <div
                      className="absolute left-0.5 right-0.5 bg-primary/25 border-2 border-primary rounded pointer-events-none z-10"
                      style={{
                        top: Math.min(selection.startSlot, selection.endSlot) * SLOT_HEIGHT,
                        height:
                          (Math.abs(selection.endSlot - selection.startSlot) + 1) * SLOT_HEIGHT,
                      }}
                    />
                  )}

                  {/* Appointments */}
                  {dayAppointments.map((appt) => {
                    const startMin = minutesSinceMidnight(new Date(appt.start_time));
                    const endMin = minutesSinceMidnight(new Date(appt.end_time));
                    const top = (startMin - START_HOUR * 60) * PX_PER_MINUTE;
                    const height = Math.max((endMin - startMin) * PX_PER_MINUTE, 24);

                    return (
                      <button
                        key={appt.id}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(appt);
                        }}
                        style={{ top, height }}
                        className={`absolute left-0.5 right-0.5 z-20 rounded px-1.5 py-0.5 text-left overflow-hidden border ${STATUS_BADGE_CLASS[appt.status]}`}
                      >
                        <p className="font-label-sm text-label-sm truncate leading-tight">
                          {new Date(appt.start_time).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          {patientNames.get(appt.patient) ?? "..."}
                        </p>
                        {height > 32 && (
                          <p className="font-label-sm text-label-sm truncate leading-tight opacity-70">
                            {APPOINTMENT_TYPE_LABELS[appt.appointment_type]}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {hover && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 rounded-md bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm shadow-lg whitespace-nowrap"
          style={{
            top: hover.y,
            left: hover.x + (hover.flip ? -14 : 14),
            transform: `translate(${hover.flip ? "-100%" : "0"}, -50%)`,
          }}
        >
          {hover.label}
        </div>
      )}
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
