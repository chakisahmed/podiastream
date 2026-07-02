import type { Appointment } from "@/types/appointment";

export const STATUS_BADGE_CLASS: Record<Appointment["status"], string> = {
  confirme: "bg-secondary-container/30 text-on-secondary-container border-secondary-container/50",
  en_attente: "bg-surface-variant text-on-surface-variant border-outline-variant/30",
  honore: "bg-primary-container/20 text-primary border-primary-container/40",
  annule: "bg-error-container/50 text-on-error-container border-error-container",
};

export const STATUS_ACCENT_CLASS: Record<Appointment["status"], string> = {
  confirme: "bg-secondary-container",
  en_attente: "bg-outline",
  honore: "bg-primary-container",
  annule: "bg-error",
};

export const STATUS_DOT_CLASS: Record<Appointment["status"], string> = {
  confirme: "bg-secondary",
  en_attente: "bg-outline",
  honore: "bg-primary",
  annule: "bg-error",
};
