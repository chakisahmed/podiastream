"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import { StockItemCard } from "@/components/inventory/stock-item-card";
import { StockItemModal } from "@/components/inventory/stock-item-modal";
import { SuggestedOrdersPanel } from "@/components/inventory/suggested-orders-panel";
import { listStockItems, listSuggestedOrders } from "@/lib/api/inventory";
import type { StockItem, SuggestedOrder } from "@/types/inventory";

type Tab = "stock" | "orders";

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>("stock");

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [orders, setOrders] = useState<SuggestedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const [modalState, setModalState] = useState<
    { mode: "closed" } | { mode: "create" } | { mode: "edit"; item: StockItem }
  >({ mode: "closed" });

  function reload() {
    setLoading(true);
    setError(null);
    listStockItems()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  useEffect(() => {
    if (tab !== "orders" || ordersLoaded) return;
    setOrdersLoading(true);
    listSuggestedOrders()
      .then((data) => {
        setOrders(data);
        setOrdersLoaded(true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setOrdersLoading(false));
  }, [tab, ordersLoaded]);

  function closeModal(shouldReload: boolean) {
    setModalState({ mode: "closed" });
    if (shouldReload) {
      reload();
      setOrdersLoaded(false);
    }
  }

  function handleItemUpdated(updated: StockItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setOrdersLoaded(false);
  }

  const visibleItems = items
    .filter((i) => !lowStockOnly || i.is_low_stock)
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-headline-xl text-headline-lg-mobile md:text-headline-xl text-on-surface">
          Stock &amp; matériel
        </h1>
        <button
          onClick={() => setModalState({ mode: "create" })}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 font-label-md hover:bg-primary/90 transition-colors shadow-md"
        >
          <MaterialIcon name="add" />
          Nouvel article
        </button>
      </div>

      <div className="flex gap-2 border-b border-outline-variant/20">
        <button
          onClick={() => setTab("stock")}
          className={`px-4 py-2 font-label-md text-label-md border-b-2 transition-colors ${
            tab === "stock"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          Inventaire
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 font-label-md text-label-md border-b-2 transition-colors flex items-center gap-1 ${
            tab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <MaterialIcon name="shopping_cart" className="text-[18px]" />
          Commandes suggérées
        </button>
      </div>

      {error && (
        <p className="text-error font-body-sm text-body-sm" role="alert">
          {error}
        </p>
      )}

      {tab === "stock" ? (
        <>
          <section className="glass-panel rounded-xl p-4 md:p-container-padding flex flex-col md:flex-row gap-gutter items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
            <div className="relative w-full md:max-w-md">
              <MaterialIcon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-lg glass-input text-on-surface placeholder:text-outline font-body-md transition-all"
                placeholder="Rechercher un article..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              Stock bas uniquement
            </label>
          </section>

          {!loading && !error && visibleItems.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
              Aucun article trouvé.
            </p>
          )}

          {loading ? (
            <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
              Chargement...
            </p>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {visibleItems.map((item) => (
                <StockItemCard
                  key={item.id}
                  item={item}
                  onSelect={() => setModalState({ mode: "edit", item })}
                />
              ))}
            </section>
          )}
        </>
      ) : (
        <SuggestedOrdersPanel orders={orders} loading={ordersLoading} />
      )}

      {modalState.mode !== "closed" && (
        <StockItemModal
          item={modalState.mode === "edit" ? modalState.item : undefined}
          onClose={() => closeModal(false)}
          onSaved={() => closeModal(true)}
          onItemUpdated={handleItemUpdated}
        />
      )}
    </>
  );
}
