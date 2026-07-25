import type { InsoleStatus } from "@/types/insole";

export const INSOLE_COLUMN_ACCENT: Record<InsoleStatus, string> = {
  empreinte_prise: "bg-outline",
  conception: "bg-tertiary-container",
  usinage_assemblage: "bg-primary-container",
  pret_essayage: "bg-secondary-fixed-dim",
  livre: "bg-secondary-container",
};

export const INSOLE_BADGE_CLASS: Record<InsoleStatus, string> = {
  empreinte_prise: "bg-surface-container text-on-surface-variant border-outline-variant/20",
  conception: "bg-tertiary-container/20 text-tertiary border-tertiary-container/40",
  usinage_assemblage: "bg-primary-container/20 text-primary border-primary-container/40",
  pret_essayage: "bg-secondary-fixed-dim/20 text-on-secondary-fixed-variant border-secondary-fixed-dim/40",
  livre: "bg-secondary-container/30 text-on-secondary-container border-secondary-container/50",
};
