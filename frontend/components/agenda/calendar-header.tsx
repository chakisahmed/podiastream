"use client";

import { MaterialIcon } from "@/components/shared/material-icon";

export type ViewMode = "jour" | "semaine" | "mois";

const VIEW_LABELS: Record<ViewMode, string> = {
  jour: "Jour",
  semaine: "Semaine",
  mois: "Mois",
};

export function CalendarHeader({
  viewMode,
  onViewModeChange,
  periodLabel,
  onPrev,
  onNext,
  onToday,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-gutter">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="p-2 rounded-full hover:bg-white/40 text-on-surface-variant"
          aria-label="Période précédente"
        >
          <MaterialIcon name="chevron_left" />
        </button>
        <h2 className="font-headline-md text-headline-md min-w-[180px] text-center capitalize">
          {periodLabel}
        </h2>
        <button
          type="button"
          onClick={onNext}
          className="p-2 rounded-full hover:bg-white/40 text-on-surface-variant"
          aria-label="Période suivante"
        >
          <MaterialIcon name="chevron_right" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="ml-2 px-3 py-1.5 rounded-lg border border-primary/30 text-primary font-label-sm text-label-sm hover:bg-white/40"
        >
          Aujourd&apos;hui
        </button>
      </div>

      <div className="flex bg-white/40 rounded-lg p-1 self-start md:self-auto">
        {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={`px-4 py-1.5 rounded-md font-label-sm text-label-sm transition-colors ${
              viewMode === mode
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-white/60"
            }`}
          >
            {VIEW_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
