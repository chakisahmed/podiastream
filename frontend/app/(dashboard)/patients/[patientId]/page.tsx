"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import { STATUS_BADGE_CLASS } from "@/components/agenda/status-styles";
import {
  createConsultationNote,
  getPatient,
  listConsultationNotes,
} from "@/lib/api/patients";
import { listAppointmentsForPatient } from "@/lib/api/appointments";
import { listInsoleOrdersForPatient } from "@/lib/api/insoles";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from "@/types/appointment";
import type { Appointment } from "@/types/appointment";
import { INSOLE_STATUS_LABELS } from "@/types/insole";
import type { InsoleOrder } from "@/types/insole";
import type { ConsultationNote, Patient } from "@/types/patient";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [insoleOrders, setInsoleOrders] = useState<InsoleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteMotif, setNoteMotif] = useState("");
  const [noteBilan, setNoteBilan] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  function reload() {
    setLoading(true);
    Promise.all([
      getPatient(patientId),
      listConsultationNotes(patientId),
      listAppointmentsForPatient(patientId),
      listInsoleOrdersForPatient(patientId),
    ])
      .then(([p, n, a, i]) => {
        setPatient(p);
        setNotes(n.results);
        setAppointments(a.results);
        setInsoleOrders(i);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [patientId]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteMotif && !noteBilan) return;
    setSavingNote(true);
    try {
      await createConsultationNote(patientId, {
        motif: noteMotif,
        bilan_podologique: noteBilan,
        diagnostic: "",
        treatment_plan: "",
      });
      setNoteMotif("");
      setNoteBilan("");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSavingNote(false);
    }
  }

  if (loading && !patient) {
    return <p className="font-body-md text-body-md text-on-surface-variant">Chargement...</p>;
  }

  if (error && !patient) {
    return (
      <p className="text-error font-body-sm text-body-sm" role="alert">
        {error}
      </p>
    );
  }

  if (!patient) return null;

  return (
    <>
      <Link
        href="/patients"
        className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg hover:bg-white/20 w-fit"
      >
        <MaterialIcon name="arrow_back" />
        <span className="font-label-md text-label-md">Retour aux patients</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter md:gap-container-padding">
        {/* Profile card */}
        <section className="md:col-span-4 flex flex-col gap-gutter">
          <div className="glass-panel rounded-xl p-container-padding relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            <div className="flex flex-col items-center text-center mt-4 gap-1">
              <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-lg text-headline-lg font-bold mb-2">
                {patient.first_name.charAt(0)}
                {patient.last_name.charAt(0)}
              </div>
              <h1 className="font-headline-lg text-headline-lg-mobile">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Né(e) le {formatDate(patient.date_of_birth)}
              </p>
            </div>

            <div className="mt-6 space-y-3 text-left">
              {patient.phone && (
                <div className="flex items-center gap-2 font-body-sm text-body-sm">
                  <MaterialIcon name="call" className="text-primary text-[18px]" />
                  {patient.phone}
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 font-body-sm text-body-sm">
                  <MaterialIcon name="mail" className="text-primary text-[18px]" />
                  {patient.email}
                </div>
              )}
              {patient.profession && (
                <div className="flex items-center gap-2 font-body-sm text-body-sm">
                  <MaterialIcon name="work" className="text-primary text-[18px]" />
                  {patient.profession}
                </div>
              )}
              {patient.shoe_size && (
                <div className="flex items-center gap-2 font-body-sm text-body-sm">
                  <MaterialIcon name="footprint" className="text-primary text-[18px]" />
                  Pointure {patient.shoe_size}
                </div>
              )}
              {patient.referring_doctor && (
                <div className="flex items-center gap-2 font-body-sm text-body-sm">
                  <MaterialIcon name="stethoscope" className="text-primary text-[18px]" />
                  Dr. {patient.referring_doctor}
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2 font-body-sm text-body-sm">
                  <MaterialIcon name="location_on" className="text-primary text-[18px] mt-0.5" />
                  {patient.address}
                </div>
              )}
            </div>

            {(patient.allergies || patient.medical_background) && (
              <div className="mt-6 pt-4 border-t border-outline-variant/20 space-y-2">
                {patient.allergies && (
                  <p className="font-body-sm text-body-sm">
                    <span className="font-label-sm text-label-sm text-error">Allergies : </span>
                    {patient.allergies}
                  </p>
                )}
                {patient.medical_background && (
                  <p className="font-body-sm text-body-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Antécédents :{" "}
                    </span>
                    {patient.medical_background}
                  </p>
                )}
              </div>
            )}

            <Link
              href={`/patients/${patient.id}/modifier`}
              className="mt-6 flex items-center justify-center gap-2 bg-primary text-on-primary rounded-lg py-2 font-label-md hover:bg-primary/90 transition-colors"
            >
              <MaterialIcon name="edit" className="text-[18px]" />
              Modifier
            </Link>
          </div>
        </section>

        {/* Content */}
        <section className="md:col-span-8 flex flex-col gap-gutter">
          {/* Consultation notes */}
          <div className="glass-panel rounded-xl p-container-padding">
            <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
              <MaterialIcon name="clinical_notes" className="text-primary" />
              Notes de consultation
            </h2>

            <form onSubmit={handleAddNote} className="flex flex-col gap-2 mb-4">
              <input
                className="glass-input rounded-lg px-3 py-2 text-on-surface"
                placeholder="Motif de consultation"
                value={noteMotif}
                onChange={(e) => setNoteMotif(e.target.value)}
              />
              <textarea
                className="glass-input rounded-lg px-3 py-2 text-on-surface"
                placeholder="Bilan podologique"
                rows={2}
                value={noteBilan}
                onChange={(e) => setNoteBilan(e.target.value)}
              />
              <button
                type="submit"
                disabled={savingNote}
                className="self-start bg-primary text-on-primary rounded-lg px-4 py-2 font-label-md hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {savingNote ? "Ajout..." : "Ajouter la note"}
              </button>
            </form>

            {notes.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Aucune note pour l&apos;instant.
              </p>
            ) : (
              <ul className="space-y-3">
                {notes.map((note) => (
                  <li key={note.id} className="border-t border-outline-variant/20 pt-3">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {formatDate(note.consultation_date)}
                    </p>
                    {note.motif && (
                      <p className="font-body-sm text-body-sm font-semibold">{note.motif}</p>
                    )}
                    {note.bilan_podologique && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {note.bilan_podologique}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Appointments */}
          <div className="glass-panel rounded-xl p-container-padding">
            <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
              <MaterialIcon name="event" className="text-primary" />
              Rendez-vous
            </h2>
            {appointments.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Aucun rendez-vous.
              </p>
            ) : (
              (() => {
                const now = new Date();
                const upcoming = appointments
                  .filter((a) => new Date(a.start_time) >= now)
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                const history = appointments
                  .filter((a) => new Date(a.start_time) < now)
                  .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

                return (
                  <>
                    <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">
                      Prochains rendez-vous
                    </h3>
                    {upcoming.length === 0 ? (
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">
                        Aucun rendez-vous à venir.
                      </p>
                    ) : (
                      <ul className="space-y-2 mb-2">
                        {upcoming.map((appt) => (
                          <AppointmentRow key={appt.id} appt={appt} />
                        ))}
                      </ul>
                    )}

                    {history.length > 0 && (
                      <div className="pt-2 border-t border-outline-variant/20">
                        <button
                          type="button"
                          onClick={() => setShowHistory((v) => !v)}
                          className="flex items-center gap-1 text-primary font-label-sm text-label-sm mb-2"
                        >
                          <MaterialIcon
                            name={showHistory ? "expand_less" : "expand_more"}
                            className="text-[18px]"
                          />
                          Historique ({history.length})
                        </button>
                        {showHistory && (
                          <ul className="space-y-2">
                            {history.map((appt) => (
                              <AppointmentRow key={appt.id} appt={appt} muted />
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>

          {/* Insole orders */}
          <div className="glass-panel rounded-xl p-container-padding">
            <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
              <MaterialIcon name="precision_manufacturing" className="text-primary" />
              Suivi des semelles
            </h2>
            {insoleOrders.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Aucune commande de semelles.
              </p>
            ) : (
              <ul className="space-y-2">
                {insoleOrders.map((order) => (
                  <li key={order.id} className="border-t border-outline-variant/20 pt-2">
                    <p className="font-body-sm text-body-sm font-semibold">
                      {INSOLE_STATUS_LABELS[order.status]}
                    </p>
                    {order.estimated_delivery_date && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        Livraison estimée : {formatDate(order.estimated_delivery_date)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function AppointmentRow({ appt, muted }: { appt: Appointment; muted?: boolean }) {
  return (
    <li
      className={`flex justify-between items-center border-t border-outline-variant/20 pt-2 ${muted ? "opacity-70" : ""}`}
    >
      <div>
        <p className="font-body-sm text-body-sm font-semibold">
          {APPOINTMENT_TYPE_LABELS[appt.appointment_type]}
        </p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {formatDateTime(appt.start_time)}
        </p>
      </div>
      <span
        className={`px-2 py-1 rounded border font-label-sm text-label-sm ${STATUS_BADGE_CLASS[appt.status]}`}
      >
        {APPOINTMENT_STATUS_LABELS[appt.status]}
      </span>
    </li>
  );
}
