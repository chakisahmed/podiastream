"use client";

import { useRef, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import { PatientPicker } from "@/components/agenda/patient-picker";
import {
  createInsoleOrder,
  deleteInsoleOrder,
  downloadInsoleAttachment,
  updateInsoleOrder,
  uploadInsolePhoto,
} from "@/lib/api/insoles";
import {
  INSOLE_ATTACHMENT_TYPE_LABELS,
  INSOLE_STATUS_LABELS,
  INSOLE_STATUSES,
} from "@/types/insole";
import type { InsoleAttachmentType, InsoleOrder } from "@/types/insole";

export function InsoleOrderModal({
  order,
  patientLabel,
  onClose,
  onSaved,
}: {
  order?: InsoleOrder;
  patientLabel?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(order);

  const [patient, setPatient] = useState<{ id: string; label: string } | null>(
    order ? { id: order.patient, label: patientLabel ?? "Patient" } : null
  );
  const [status, setStatus] = useState(order?.status ?? "empreinte_prise");
  const [materials, setMaterials] = useState(order?.materials_used ?? "");
  const [corrections, setCorrections] = useState(order?.corrections ?? "");
  const [manufacturingNotes, setManufacturingNotes] = useState(order?.manufacturing_notes ?? "");
  const [price, setPrice] = useState(order?.price ?? "");
  const [deliveryDate, setDeliveryDate] = useState(order?.estimated_delivery_date ?? "");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) {
      setError("Sélectionnez un patient.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const payload = {
        patient: patient.id,
        status,
        materials_used: materials,
        corrections,
        manufacturing_notes: manufacturingNotes,
        price: price || null,
        estimated_delivery_date: deliveryDate || null,
      };
      if (isEdit && order) {
        await updateInsoleOrder(order.id, payload);
      } else {
        await createInsoleOrder(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!order) return;
    setPending(true);
    try {
      await deleteInsoleOrder(order.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setPending(false);
    }
  }

  async function handleFileSelected(fileType: InsoleAttachmentType, files: FileList | null) {
    if (!order || !files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await uploadInsolePhoto(order.id, files[0], fileType);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload de la photo");
    } finally {
      setUploading(false);
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
            {isEdit ? "Fiche technique" : "Nouvelle commande de semelles"}
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
          {isEdit ? (
            <p className="glass-input rounded-lg px-3 py-2 text-on-surface">{patient?.label}</p>
          ) : (
            <PatientPicker value={patient} onChange={setPatient} />
          )}
        </div>

        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Statut de fabrication
          </label>
          <select
            className="glass-input rounded-lg px-3 py-2 w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value as InsoleOrder["status"])}
          >
            {INSOLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {INSOLE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-gutter">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Prix (€)
            </label>
            <input
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={price ?? ""}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Livraison estimée
            </label>
            <input
              type="date"
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={deliveryDate ?? ""}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Matériaux utilisés
          </label>
          <textarea
            className="glass-input rounded-lg px-3 py-2 w-full"
            rows={2}
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
          />
        </div>
        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Corrections apportées
          </label>
          <textarea
            className="glass-input rounded-lg px-3 py-2 w-full"
            rows={2}
            value={corrections}
            onChange={(e) => setCorrections(e.target.value)}
          />
        </div>
        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Notes de fabrication
          </label>
          <textarea
            className="glass-input rounded-lg px-3 py-2 w-full"
            rows={2}
            value={manufacturingNotes}
            onChange={(e) => setManufacturingNotes(e.target.value)}
          />
        </div>

        {isEdit && order && (
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Photos (empreinte / pied)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {order.attachments.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => downloadInsoleAttachment(att)}
                  className="px-2 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <MaterialIcon name="image" className="text-[16px]" />
                  {INSOLE_ATTACHMENT_TYPE_LABELS[att.file_type]}
                </button>
              ))}
              {order.attachments.length === 0 && (
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Aucune photo
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelected("photo_empreinte", e.target.files)}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 text-primary font-label-sm text-label-sm hover:bg-white/40 disabled:opacity-60"
            >
              <MaterialIcon name="add_a_photo" className="text-[18px]" />
              {uploading ? "Envoi..." : "Ajouter une photo"}
            </button>
          </div>
        )}

        {isEdit && order && order.status_history.length > 0 && (
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Historique
            </label>
            <ul className="space-y-1">
              {order.status_history.map((h) => (
                <li key={h.id} className="font-body-sm text-body-sm text-on-surface-variant">
                  {new Date(h.changed_at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  — {INSOLE_STATUS_LABELS[h.status]}
                  {h.comment ? ` (${h.comment})` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

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
            {pending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}
