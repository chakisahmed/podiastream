"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  deleteDocument,
  downloadDocument,
  listDocumentsForPatient,
  uploadPatientDocument,
} from "@/lib/api/documents";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES } from "@/types/document";
import type { DocumentType, PatientDocument } from "@/types/document";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentList({ patientId }: { patientId: string }) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<DocumentType>("compte_rendu");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reload() {
    setLoading(true);
    setError(null);
    listDocumentsForPatient(patientId)
      .then((data) => setDocuments(data.results))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [patientId]);

  async function handleFileSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await uploadPatientDocument(patientId, files[0], uploadType);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload du document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(doc: PatientDocument) {
    try {
      await downloadDocument(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ouverture du document");
    }
  }

  async function handleDelete(doc: PatientDocument) {
    setPendingId(doc.id);
    try {
      await deleteDocument(doc.id);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="glass-panel rounded-xl p-container-padding">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline-md text-headline-md flex items-center gap-2">
          <MaterialIcon name="folder" className="text-primary" />
          Documents
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          className="glass-input rounded-lg px-3 py-2 font-label-sm text-label-sm"
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value as DocumentType)}
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {DOCUMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 text-primary font-label-sm text-label-sm hover:bg-white/40 disabled:opacity-60"
        >
          <MaterialIcon name="upload_file" className="text-[18px]" />
          {uploading ? "Envoi..." : "Ajouter un document"}
        </button>
      </div>

      {error && (
        <p className="text-error font-body-sm text-body-sm mb-2" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">Chargement...</p>
      ) : documents.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">Aucun document.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 border-t border-outline-variant/20 pt-2"
            >
              <button
                type="button"
                onClick={() => handleDownload(doc)}
                className="flex items-center gap-2 text-left hover:text-primary transition-colors"
              >
                <MaterialIcon name="description" className="text-primary text-[18px]" />
                <span>
                  <span className="font-body-sm text-body-sm block">
                    {DOCUMENT_TYPE_LABELS[doc.document_type]}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {formatDateTime(doc.created_at)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                disabled={pendingId === doc.id}
                onClick={() => handleDelete(doc)}
                className="text-error p-1 rounded-full hover:bg-error/10 disabled:opacity-60"
                aria-label="Supprimer le document"
              >
                <MaterialIcon name="delete" className="text-[18px]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
