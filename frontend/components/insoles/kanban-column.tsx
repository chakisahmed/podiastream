"use client";

import { useDroppable } from "@dnd-kit/core";
import { INSOLE_STATUS_SHORT_LABELS } from "@/types/insole";
import type { InsoleOrder, InsoleStatus } from "@/types/insole";
import { InsoleCard } from "./insole-card";
import { INSOLE_COLUMN_ACCENT } from "./status-styles";

export function KanbanColumn({
  status,
  orders,
  patientNames,
  onSelect,
}: {
  status: InsoleStatus;
  orders: InsoleOrder[];
  patientNames: Map<string, string>;
  onSelect: (order: InsoleOrder) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`glass-panel rounded-xl p-3 flex flex-col gap-2 min-h-[400px] transition-colors ${
        isOver ? "bg-primary/10" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-1 pb-2 border-b border-outline-variant/20">
        <span className={`w-2.5 h-2.5 rounded-full ${INSOLE_COLUMN_ACCENT[status]}`} />
        <h3 className="font-label-md text-label-md text-on-surface">
          {INSOLE_STATUS_SHORT_LABELS[status]}
        </h3>
        <span className="ml-auto font-label-sm text-label-sm text-on-surface-variant">
          {orders.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {orders.map((order) => (
          <InsoleCard
            key={order.id}
            order={order}
            patientName={patientNames.get(order.patient) ?? "..."}
            onClick={() => onSelect(order)}
          />
        ))}
      </div>
    </div>
  );
}
