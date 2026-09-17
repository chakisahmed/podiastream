import { MaterialIcon } from "@/components/shared/material-icon";
import type { SuggestedOrder } from "@/types/inventory";

export function SuggestedOrdersPanel({
  orders,
  loading,
}: {
  orders: SuggestedOrder[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
        Calcul des besoins...
      </p>
    );
  }

  const toOrder = orders.filter((row) => Number(row.suggested_order_quantity) > 0);
  const covered = orders.filter((row) => Number(row.suggested_order_quantity) <= 0);

  return (
    <div className="flex flex-col gap-gutter">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Estimation basée sur les rendez-vous déjà réservés le mois prochain, complétée par la
        moyenne des 3 derniers mois pour le reste — arrondie au conditionnement fournisseur.
      </p>

      {toOrder.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant text-center py-8">
          Aucune commande nécessaire pour le mois prochain.
        </p>
      ) : (
        <section className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 font-label-sm text-label-sm text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Article</th>
                <th className="px-4 py-3 font-medium">Stock actuel</th>
                <th className="px-4 py-3 font-medium">Conso. estimée / mois</th>
                <th className="px-4 py-3 font-medium">À commander</th>
              </tr>
            </thead>
            <tbody>
              {toOrder.map((row) => (
                <tr key={row.item.id} className="border-b border-outline-variant/10 last:border-0">
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface">
                    {row.item.name}
                    {row.item.supplier_name && (
                      <span className="block font-body-sm text-body-sm text-on-surface-variant">
                        {row.item.supplier_name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface-variant">
                    {row.item.current_quantity} {row.item.unit}
                  </td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface-variant">
                    {Number(row.expected_usage_next_month).toFixed(2)} {row.item.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 font-label-md text-label-md text-primary">
                      <MaterialIcon name="shopping_cart" className="text-[18px]" />
                      {row.suggested_order_quantity} {row.item.unit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {covered.length > 0 && (
        <details className="glass-panel rounded-xl px-4 py-3">
          <summary className="font-label-md text-label-md text-on-surface-variant cursor-pointer">
            {covered.length} article{covered.length > 1 ? "s" : ""} déjà couvert
            {covered.length > 1 ? "s" : ""} pour le mois prochain
          </summary>
          <ul className="mt-2 space-y-1">
            {covered.map((row) => (
              <li
                key={row.item.id}
                className="font-body-sm text-body-sm text-on-surface-variant flex justify-between"
              >
                <span>{row.item.name}</span>
                <span>
                  {row.item.current_quantity} {row.item.unit} en stock
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
