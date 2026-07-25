export type InsoleStatus =
  | "empreinte_prise"
  | "conception"
  | "usinage_assemblage"
  | "pret_essayage"
  | "livre";

export const INSOLE_STATUSES: InsoleStatus[] = [
  "empreinte_prise",
  "conception",
  "usinage_assemblage",
  "pret_essayage",
  "livre",
];

export const INSOLE_STATUS_LABELS: Record<InsoleStatus, string> = {
  empreinte_prise: "Examen effectué / Prise d'empreinte",
  conception: "En cours de conception",
  usinage_assemblage: "En cours d'usinage / Assemblage",
  pret_essayage: "Prêt pour essayage",
  livre: "Livré au patient",
};

export const INSOLE_STATUS_SHORT_LABELS: Record<InsoleStatus, string> = {
  empreinte_prise: "Empreinte prise",
  conception: "Conception",
  usinage_assemblage: "Usinage",
  pret_essayage: "Essayage",
  livre: "Livré",
};

export type InsoleAttachmentType = "photo_empreinte" | "photo_pied" | "scan_3d" | "autre";

export const INSOLE_ATTACHMENT_TYPE_LABELS: Record<InsoleAttachmentType, string> = {
  photo_empreinte: "Photo empreinte",
  photo_pied: "Photo pied",
  scan_3d: "Scan 3D",
  autre: "Autre",
};

export type InsoleStatusHistoryEntry = {
  id: string;
  status: InsoleStatus;
  changed_by: string | null;
  comment: string;
  changed_at: string;
};

export type InsoleAttachment = {
  id: string;
  insole_order: string;
  storage_path: string;
  file_type: InsoleAttachmentType;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type InsoleOrder = {
  id: string;
  patient: string;
  appointment: string | null;
  practitioner: string | null;
  status: InsoleStatus;
  materials_used: string;
  corrections: string;
  manufacturing_notes: string;
  price: string | null;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  status_history: InsoleStatusHistoryEntry[];
  attachments: InsoleAttachment[];
};
