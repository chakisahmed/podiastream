import { MaterialIcon } from "@/components/shared/material-icon";
import { STOCK_CATEGORY_LABELS } from "@/types/inventory";
import type { StockItem } from "@/types/inventory";

const CATEGORY_STYLES: Record<StockItem["category"], string> = {
  consommable: "bg-primary-container text-on-primary-container",
  matiere_premiere: "bg-tertiary-container text-on-tertiary-container",
  autre: "bg-secondary-fixed-dim text-on-secondary-fixed",
};

export function StockItemCard({ item, onSelect }: { item: StockItem; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="glass-panel rounded-xl p-5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden text-left w-full"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="font-headline-md text-[18px] leading-[24px] font-semibold text-on-surface">
            {item.name}
          </h2>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded font-label-sm text-label-sm ${CATEGORY_STYLES[item.category]}`}
          >
            {STOCK_CATEGORY_LABELS[item.category]}
          </span>
        </div>
        {item.is_low_stock && (
          <span
            className="flex items-center gap-1 px-2 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm whitespace-nowrap"
            title="Stock au ou sous le seuil de sécurité"
          >
            <MaterialIcon name="warning" className="text-[16px]" />
            Stock bas
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="font-headline-md text-headline-md text-on-surface">
          {item.current_quantity}
        </span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">{item.unit}</span>
        <span className="font-body-sm text-body-sm text-outline ml-1">
          (seuil {item.minimum_quantity})
        </span>
      </div>

      {item.supplier_name && (
        <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <MaterialIcon name="local_shipping" className="text-[18px] text-primary" />
          {item.supplier_name}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between items-center">
        <span
          className={`px-2 py-1 rounded font-label-sm text-label-sm ${
            item.is_active
              ? "bg-secondary-container/30 text-on-secondary-container"
              : "bg-surface-variant text-on-surface-variant"
          }`}
        >
          {item.is_active ? "Actif" : "Inactif"}
        </span>
        <MaterialIcon
          name="arrow_forward"
          className="text-outline group-hover:text-primary transition-colors"
        />
      </div>
    </button>
  );
}
