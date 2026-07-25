"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { MaterialIcon } from "@/components/shared/material-icon";
import { InsoleOrderModal } from "@/components/insoles/insole-order-modal";
import { KanbanColumn } from "@/components/insoles/kanban-column";
import { listInsoleOrders, transitionInsoleOrder } from "@/lib/api/insoles";
import { resolvePatientNames } from "@/lib/patient-name-cache";
import { INSOLE_STATUSES } from "@/types/insole";
import type { InsoleOrder, InsoleStatus } from "@/types/insole";

export default function InsolesPage() {
  const [orders, setOrders] = useState<InsoleOrder[]>([]);
  const [patientNames, setPatientNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalState, setModalState] = useState<
    { mode: "closed" } | { mode: "create" } | { mode: "edit"; order: InsoleOrder }
  >({ mode: "closed" });

  // Require a small drag distance before dnd-kit claims the pointer, so a
  // plain click on a card still reaches its onClick instead of being
  // swallowed as a (zero-distance) drag start.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function reload() {
    setLoading(true);
    setError(null);
    listInsoleOrders()
      .then(async (data) => {
        setOrders(data);
        const names = await resolvePatientNames(data.map((o) => o.patient));
        setPatientNames(new Map(names));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const orderId = active.id as string;
    const newStatus = over.id as InsoleStatus;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    // Optimistic update so the card moves instantly.
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    try {
      await transitionInsoleOrder(orderId, newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du changement de statut");
      reload();
    }
  }

  function closeModal(shouldReload: boolean) {
    setModalState({ mode: "closed" });
    if (shouldReload) reload();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-headline-xl text-headline-lg-mobile md:text-headline-xl text-on-surface">
          Suivi de fabrication des semelles
        </h1>
        <button
          onClick={() => setModalState({ mode: "create" })}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 font-label-md hover:bg-primary/90 transition-colors shadow-md"
        >
          <MaterialIcon name="add" />
          Nouvelle commande
        </button>
      </div>

      {error && (
        <p className="text-error font-body-sm text-body-sm" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
          Chargement...
        </p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-gutter">
            {INSOLE_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={orders.filter((o) => o.status === status)}
                patientNames={patientNames}
                onSelect={(order) => setModalState({ mode: "edit", order })}
              />
            ))}
          </div>
        </DndContext>
      )}

      {modalState.mode !== "closed" && (
        <InsoleOrderModal
          order={modalState.mode === "edit" ? modalState.order : undefined}
          patientLabel={
            modalState.mode === "edit"
              ? patientNames.get(modalState.order.patient)
              : undefined
          }
          onClose={() => closeModal(false)}
          onSaved={() => closeModal(true)}
        />
      )}
    </>
  );
}
