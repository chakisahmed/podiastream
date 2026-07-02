export type Appointment = {
  id: string;
  patient: string;
  practitioner: string | null;
  appointment_type:
    | "bilan_podologique"
    | "remise_semelles"
    | "soin_pedicurie"
    | "suivi_controle";
  status: "confirme" | "en_attente" | "annule" | "honore";
  start_time: string;
  end_time: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export const APPOINTMENT_TYPE_LABELS: Record<Appointment["appointment_type"], string> = {
  bilan_podologique: "Bilan podologique",
  remise_semelles: "Remise de semelles",
  soin_pedicurie: "Soin de pédicurie",
  suivi_controle: "Suivi / Contrôle",
};

export const APPOINTMENT_STATUS_LABELS: Record<Appointment["status"], string> = {
  confirme: "Confirmé",
  en_attente: "En attente",
  annule: "Annulé",
  honore: "Honoré",
};
