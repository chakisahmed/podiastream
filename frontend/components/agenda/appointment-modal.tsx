"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import { PatientPicker } from "./patient-picker";
import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
} from "@/lib/api/appointments";
import { createPatient } from "@/lib/api/patients";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from "@/types/appointment";
import type { Appointment } from "@/types/appointment";

// 15-minute increments up to 3h, matching the week grid's minimum slot size.
const DURATIONS = Array.from({ length: 12 }, (_, i) => (i + 1) * 15);

function toDateInput(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}
function toTimeInput(iso: string) {
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5);
}
function durationMinutes(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toDateInputLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toTimeInputLocal(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentModal({
  appointment,
  defaultStart,
  defaultEnd,
  onClose,
  onSaved,
}: {
  appointment?: Appointment & { patientLabel?: string };
  /** Pre-fills date/time (and duration, if defaultEnd is also given) —
   * e.g. from a slot picked on the week grid, so only the patient is left
   * to fill in. */
  defaultStart?: Date;
  defaultEnd?: Date;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(appointment);

  const [patient, setPatient] = useState<{ id: string; label: string } | null>(
    appointment?.patient
      ? { id: appointment.patient, label: appointment.patientLabel ?? "Patient" }
      : null
  );
  // A slot can be booked under a bare name. The practice only opens a patient
  // record once someone actually turns up, so most bookings start like this.
  const [bookedName, setBookedName] = useState(appointment?.booked_name ?? "");
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  /** Opens the "create the record" form, pre-filled from the booked name —
   * last token is the surname, as elsewhere. */
  function startPatientRecord() {
    const parts = bookedName.trim().split(/\s+/).filter(Boolean);
    setNewFirstName(parts.slice(0, -1).join(" "));
    setNewLastName(parts.length ? parts[parts.length - 1] : "");
    setNewPatientMode(true);
  }

  const initialStart = appointment ? new Date(appointment.start_time) : defaultStart ?? new Date();

  const [date, setDate] = useState(
    appointment ? toDateInput(appointment.start_time) : toDateInputLocal(initialStart)
  );
  const [time, setTime] = useState(
    appointment
      ? toTimeInput(appointment.start_time)
      : defaultStart
        ? toTimeInputLocal(defaultStart)
        : "09:00"
  );
  const [duration, setDuration] = useState(() => {
    if (appointment) return durationMinutes(appointment.start_time, appointment.end_time);
    if (defaultStart && defaultEnd) {
      return Math.max(15, Math.round((defaultEnd.getTime() - defaultStart.getTime()) / 60000));
    }
    return 30;
  });
  const [type, setType] = useState<Appointment["appointment_type"]>(
    appointment?.appointment_type ?? "bilan_podologique"
  );
  const [status, setStatus] = useState<Appointment["status"]>(
    appointment?.status ?? "en_attente"
  );
  const [notes, setNotes] = useState(appointment?.notes ?? "");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveBooking(): Promise<{ patient: string | null; booked_name: string }> {
    if (patient) return { patient: patient.id, booked_name: "" };
    if (newPatientMode && newFirstName && newLastName) {
      const created = await createPatient({
        first_name: newFirstName,
        last_name: newLastName,
        phone: newPhone,
        date_of_birth: "",
        email: "",
        profession: "",
        shoe_size: "",
        referring_doctor: "",
        address: "",
        allergies: "",
        medical_background: "",
      });
      return { patient: created.id, booked_name: "" };
    }
    if (bookedName.trim()) return { patient: null, booked_name: bookedName.trim() };
    throw new Error("Choisissez un patient existant, ou indiquez un nom pour la réservation.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const booking = await resolveBooking();
      const startISO = new Date(`${date}T${time}:00`).toISOString();
      const endISO = new Date(
        new Date(`${date}T${time}:00`).getTime() + duration * 60000
      ).toISOString();

      if (isEdit && appointment) {
        await updateAppointment(appointment.id, {
          ...booking,
          appointment_type: type,
          status,
          start_time: startISO,
          end_time: endISO,
          notes,
        });
      } else {
        await createAppointment({
          ...booking,
          appointment_type: type,
          status,
          start_time: startISO,
          end_time: endISO,
          notes,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!appointment) return;
    setPending(true);
    try {
      await deleteAppointment(appointment.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40">
      <form
        onSubmit={handleSubmit}
        className="glass-modal rounded-xl p-container-padding w-full max-w-lg flex flex-col gap-gutter max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md">
            {isEdit ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary p-1 rounded-full"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Patient
          </label>
          {!newPatientMode ? (
            <div className="flex flex-col gap-2">
              <PatientPicker value={patient} onChange={setPatient} />

              {!patient && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="h-px flex-1 bg-outline-variant/30" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      ou réserver sous un nom
                    </span>
                    <span className="h-px flex-1 bg-outline-variant/30" />
                  </div>

                  <input
                    className="glass-input rounded-lg px-3 py-2 text-on-surface"
                    placeholder="Nom de la réservation"
                    value={bookedName}
                    onChange={(e) => setBookedName(e.target.value)}
                  />
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Aucun dossier n&apos;est créé pour l&apos;instant — créez-le lorsque la personne
                    se présente.
                  </p>

                  {bookedName.trim() && (
                    <button
                      type="button"
                      onClick={startPatientRecord}
                      className="self-start text-primary font-label-sm text-label-sm flex items-center gap-1"
                    >
                      <MaterialIcon name="person_add" className="text-[16px]" />
                      Créer le dossier patient maintenant
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="glass-input rounded-lg px-3 py-2"
                  placeholder="Prénom"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
                <input
                  className="glass-input rounded-lg px-3 py-2"
                  placeholder="Nom"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
              </div>
              <input
                className="glass-input rounded-lg px-3 py-2"
                placeholder="Téléphone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setNewPatientMode(false)}
                className="self-start text-on-surface-variant font-label-sm text-label-sm"
              >
                Revenir à la réservation sans dossier
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-gutter">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Date
            </label>
            <input
              type="date"
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Heure
            </label>
            <input
              type="time"
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Durée
            </label>
            <select
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Statut
            </label>
            <select
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value as Appointment["status"])}
            >
              {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Type de rendez-vous
          </label>
          <select
            className="glass-input rounded-lg px-3 py-2 w-full"
            value={type}
            onChange={(e) => setType(e.target.value as Appointment["appointment_type"])}
          >
            {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Notes
          </label>
          <textarea
            className="glass-input rounded-lg px-3 py-2 w-full"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-error font-body-sm text-body-sm" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-between items-center pt-2">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="text-error font-label-md text-label-md flex items-center gap-1 disabled:opacity-60"
            >
              <MaterialIcon name="delete" className="text-[18px]" />
              Supprimer
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={pending}
            className="bg-primary text-on-primary rounded-lg px-6 py-2 font-label-md hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {pending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer le RDV"}
          </button>
        </div>
      </form>
    </div>
  );
}
