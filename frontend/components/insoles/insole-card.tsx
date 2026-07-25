"use client";

import { useDraggable } from "@dnd-kit/core";
import { MaterialIcon } from "@/components/shared/material-icon";
import type { InsoleOrder } from "@/types/insole";

export function InsoleCard({
  order,
  patientName,
  onClick,
}: {
  order: InsoleOrder;
  patientName: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`glass-panel rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <p className="font-label-md text-label-md text-on-surface">{patientName}</p>
      {order.estimated_delivery_date && (
        <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
          <MaterialIcon name="local_shipping" className="text-[14px]" />
          {new Date(order.estimated_delivery_date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      )}
      {order.attachments.length > 0 && (
        <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
          <MaterialIcon name="photo_library" className="text-[14px]" />
          {order.attachments.length}
        </p>
      )}
    </div>
  );
}
