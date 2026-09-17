"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import {
  createConsumptionRule,
  createStockItem,
  deleteConsumptionRule,
  deleteStockItem,
  listConsumptionRules,
  listStockMovements,
  recordAdjustment,
  recordCount,
  recordDelivery,
  updateStockItem,
} from "@/lib/api/inventory";
import {
  CONSUMPTION_TRIGGER_LABELS,
  CONSUMPTION_TRIGGERS,
  MOVEMENT_TYPE_ICONS,
  MOVEMENT_TYPE_LABELS,
  STOCK_CATEGORY_LABELS,
} from "@/types/inventory";
import type {
  ConsumptionRule,
  ConsumptionTrigger,
  StockCategory,
  StockItem,
  StockMovement,
} from "@/types/inventory";

const CATEGORIES: StockCategory[] = ["consommable", "matiere_premiere", "autre"];

type QuickAction = "delivery" | "count" | "adjustment" | null;

export function StockItemModal({
  item: initialItem,
  onClose,
  onSaved,
  onItemUpdated,
}: {
  item?: StockItem;
  onClose: () => void;
  onSaved: () => void;
  onItemUpdated?: (item: StockItem) => void;
}) {
  const isEdit = Boolean(initialItem);
  const [item, setItem] = useState(initialItem);

  const [name, setName] = useState(initialItem?.name ?? "");
  const [sku, setSku] = useState(initialItem?.sku ?? "");
  const [category, setCategory] = useState<StockCategory>(initialItem?.category ?? "consommable");
  const [unit, setUnit] = useState(initialItem?.unit ?? "unité");
  const [minimumQuantity, setMinimumQuantity] = useState(initialItem?.minimum_quantity ?? "0");
  const [packSize, setPackSize] = useState(initialItem?.pack_size ?? "1");
  const [supplierName, setSupplierName] = useState(initialItem?.supplier_name ?? "");
  const [leadTimeDays, setLeadTimeDays] = useState(
    String(initialItem?.supplier_lead_time_days ?? 7)
  );
  const [unitCost, setUnitCost] = useState(initialItem?.unit_cost ?? "");
  const [notes, setNotes] = useState(initialItem?.notes ?? "");
  const [isActive, setIsActive] = useState(initialItem?.is_active ?? true);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [rules, setRules] = useState<ConsumptionRule[]>([]);
  const [quickAction, setQuickAction] = useState<QuickAction>(null);
  const [actionQuantity, setActionQuantity] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [actionPending, setActionPending] = useState(false);

  const [newRuleTrigger, setNewRuleTrigger] = useState<ConsumptionTrigger | "">("");
  const [newRuleQuantity, setNewRuleQuantity] = useState("");

  function loadMovementsAndRules(itemId: string) {
    listStockMovements(itemId).then(setMovements).catch(() => {});
    listConsumptionRules(itemId).then(setRules).catch(() => {});
  }

  useEffect(() => {
    if (item) loadMovementsAndRules(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const payload = {
        name,
        sku,
        category,
        unit,
        minimum_quantity: minimumQuantity,
        pack_size: packSize,
        supplier_name: supplierName,
        supplier_lead_time_days: Number(leadTimeDays) || 0,
        unit_cost: unitCost || null,
        notes,
        is_active: isActive,
      };
      if (isEdit && item) {
        await updateStockItem(item.id, payload);
      } else {
        await createStockItem(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    setPending(true);
    try {
      await deleteStockItem(item.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setPending(false);
    }
  }

  function openQuickAction(action: QuickAction) {
    setQuickAction(action);
    setActionQuantity("");
    setActionNote("");
    setError(null);
  }

  async function submitQuickAction() {
    if (!item || !quickAction) return;
    setActionPending(true);
    setError(null);
    try {
      let updated: StockItem;
      if (quickAction === "delivery") {
        updated = await recordDelivery(item.id, actionQuantity, null, actionNote);
      } else if (quickAction === "count") {
        updated = await recordCount(item.id, actionQuantity, actionNote);
      } else {
        updated = await recordAdjustment(item.id, actionQuantity, actionNote);
      }
      setItem(updated);
      onItemUpdated?.(updated);
      loadMovementsAndRules(updated.id);
      setQuickAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionPending(false);
    }
  }

  async function handleAddRule() {
    if (!item || !newRuleTrigger || !newRuleQuantity) return;
    setError(null);
    try {
      await createConsumptionRule(item.id, newRuleTrigger, newRuleQuantity);
      setNewRuleTrigger("");
      setNewRuleQuantity("");
      loadMovementsAndRules(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!item) return;
    try {
      await deleteConsumptionRule(ruleId);
      loadMovementsAndRules(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  const availableTriggers = CONSUMPTION_TRIGGERS.filter(
    (t) => !rules.some((r) => r.trigger === t)
  );

  const quickActionLabel: Record<Exclude<QuickAction, null>, { title: string; hint: string }> = {
    delivery: { title: "Livraison reçue", hint: "Quantité livrée (s'ajoute au stock)" },
    count: { title: "Comptage physique", hint: "Quantité réellement comptée" },
    adjustment: { title: "Ajustement manuel", hint: "Écart signé (casse = négatif)" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40">
      <form
        onSubmit={handleSubmit}
        className="glass-modal rounded-xl p-container-padding w-full max-w-lg flex flex-col gap-gutter max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md">
            {isEdit ? item?.name : "Nouvel article de stock"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary p-1 rounded-full"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        {isEdit && item && (
          <div className="glass-input rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-headline-md text-headline-md text-on-surface">
                {item.current_quantity}{" "}
                <span className="font-body-sm text-body-sm text-on-surface-variant">{item.unit}</span>
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Seuil de sécurité : {item.minimum_quantity} {item.unit}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openQuickAction("delivery")}
                className="p-2 rounded-full bg-primary-container text-on-primary-container hover:opacity-80"
                title="Enregistrer une livraison"
              >
                <MaterialIcon name="local_shipping" className="text-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => openQuickAction("count")}
                className="p-2 rounded-full bg-secondary-container text-on-secondary-container hover:opacity-80"
                title="Enregistrer un comptage"
              >
                <MaterialIcon name="fact_check" className="text-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => openQuickAction("adjustment")}
                className="p-2 rounded-full bg-surface-container text-on-surface-variant hover:opacity-80"
                title="Ajustement manuel"
              >
                <MaterialIcon name="tune" className="text-[18px]" />
              </button>
            </div>
          </div>
        )}

        {quickAction && (
          <div className="glass-input rounded-lg p-3 flex flex-col gap-2">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {quickActionLabel[quickAction].title} — {quickActionLabel[quickAction].hint}
            </p>
            <div className="flex gap-2">
              <input
                autoFocus
                type="number"
                step="0.001"
                placeholder="Quantité"
                className="glass-input rounded-lg px-3 py-2 flex-1"
                value={actionQuantity}
                onChange={(e) => setActionQuantity(e.target.value)}
              />
              <input
                placeholder="Note (optionnel)"
                className="glass-input rounded-lg px-3 py-2 flex-1"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickAction(null)}
                className="px-3 py-1.5 rounded-lg font-label-sm text-label-sm text-on-surface-variant"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={actionPending || !actionQuantity}
                onClick={submitQuickAction}
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-60"
              >
                {actionPending ? "..." : "Valider"}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Nom de l&apos;article
          </label>
          <input
            required
            className="glass-input rounded-lg px-3 py-2 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Référence (SKU)
          </label>
          <input
            className="glass-input rounded-lg px-3 py-2 w-full"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-gutter">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Catégorie
            </label>
            <select
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value as StockCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {STOCK_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Unité
            </label>
            <input
              className="glass-input rounded-lg px-3 py-2 w-full"
              placeholder="unité, boîte, m, paire..."
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-gutter">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Seuil de sécurité
            </label>
            <input
              type="number"
              step="0.001"
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={minimumQuantity}
              onChange={(e) => setMinimumQuantity(e.target.value)}
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Conditionnement fournisseur
            </label>
            <input
              type="number"
              step="0.001"
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={packSize}
              onChange={(e) => setPackSize(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-gutter">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Fournisseur
            </label>
            <input
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Délai de livraison (jours)
            </label>
            <input
              type="number"
              className="glass-input rounded-lg px-3 py-2 w-full"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Coût unitaire (€)
          </label>
          <input
            className="glass-input rounded-lg px-3 py-2 w-full max-w-[50%]"
            value={unitCost ?? ""}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>

        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
            Notes
          </label>
          <textarea
            className="glass-input rounded-lg px-3 py-2 w-full"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Article actif (suivi et acheté)
        </label>

        {isEdit && item && (
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Consommation par visite / fabrication
            </label>
            <ul className="flex flex-col gap-1 mb-2">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between glass-input rounded-lg px-3 py-2"
                >
                  <span className="font-body-sm text-body-sm text-on-surface">
                    {CONSUMPTION_TRIGGER_LABELS[rule.trigger]} — {rule.quantity_per_unit} {item.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-on-surface-variant hover:text-error p-1"
                  >
                    <MaterialIcon name="close" className="text-[16px]" />
                  </button>
                </li>
              ))}
              {rules.length === 0 && (
                <li className="font-body-sm text-body-sm text-on-surface-variant">
                  Aucune règle — le stock ne sera pas déduit automatiquement.
                </li>
              )}
            </ul>
            {availableTriggers.length > 0 && (
              <div className="flex gap-2">
                <select
                  className="glass-input rounded-lg px-3 py-2 flex-1"
                  value={newRuleTrigger}
                  onChange={(e) => setNewRuleTrigger(e.target.value as ConsumptionTrigger)}
                >
                  <option value="">Ajouter une règle...</option>
                  {availableTriggers.map((t) => (
                    <option key={t} value={t}>
                      {CONSUMPTION_TRIGGER_LABELS[t]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  placeholder="Qté"
                  className="glass-input rounded-lg px-3 py-2 w-24"
                  value={newRuleQuantity}
                  onChange={(e) => setNewRuleQuantity(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  disabled={!newRuleTrigger || !newRuleQuantity}
                  className="px-3 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-60"
                >
                  <MaterialIcon name="add" className="text-[18px]" />
                </button>
              </div>
            )}
          </div>
        )}

        {isEdit && movements.length > 0 && (
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">
              Historique des mouvements
            </label>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {movements.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant"
                >
                  <MaterialIcon name={MOVEMENT_TYPE_ICONS[m.movement_type]} className="text-[16px]" />
                  <span className="flex-1">
                    {MOVEMENT_TYPE_LABELS[m.movement_type]}
                    {m.note ? ` — ${m.note}` : ""}
                  </span>
                  <span
                    className={Number(m.quantity_delta) < 0 ? "text-error" : "text-on-surface"}
                  >
                    {Number(m.quantity_delta) > 0 ? "+" : ""}
                    {m.quantity_delta}
                  </span>
                  <span className="whitespace-nowrap">
                    {new Date(m.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
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
