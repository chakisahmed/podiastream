export type DocumentType = "ordonnance" | "compte_rendu" | "facture";

export const DOCUMENT_TYPES: DocumentType[] = ["ordonnance", "compte_rendu", "facture"];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ordonnance: "Ordonnance",
  compte_rendu: "Compte rendu",
  facture: "Facture",
};

export type PatientDocument = {
  id: string;
  patient: string;
  appointment: string | null;
  document_type: DocumentType;
  storage_path: string;
  generated_by: string | null;
  created_at: string;
};
