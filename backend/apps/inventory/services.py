from django.db import transaction

from .models import ConsumptionRule, StockItem, StockMovement


@transaction.atomic
def record_delivery(item: StockItem, quantity, *, unit_cost=None, note="", user=None) -> StockMovement:
    """A supplier delivery arrives: adds to stock."""
    if quantity <= 0:
        raise ValueError("La quantité livrée doit être positive.")

    item.current_quantity += quantity
    update_fields = ["current_quantity", "updated_at"]
    if unit_cost is not None:
        item.unit_cost = unit_cost
        update_fields.append("unit_cost")
    item.save(update_fields=update_fields)

    return StockMovement.objects.create(
        item=item,
        movement_type=StockMovement.MovementType.LIVRAISON,
        quantity_delta=quantity,
        unit_cost=unit_cost,
        note=note,
        created_by=user,
    )


@transaction.atomic
def record_manual_adjustment(item: StockItem, delta, *, note="", user=None) -> StockMovement:
    """A one-off correction outside deliveries and counts — breakage, loss…"""
    if delta == 0:
        raise ValueError("L'ajustement ne peut pas être nul.")

    item.current_quantity += delta
    item.save(update_fields=["current_quantity", "updated_at"])

    return StockMovement.objects.create(
        item=item,
        movement_type=StockMovement.MovementType.AJUSTEMENT,
        quantity_delta=delta,
        note=note,
        created_by=user,
    )


@transaction.atomic
def record_stock_count(item: StockItem, counted_quantity, *, note="", user=None) -> StockMovement:
    """A physical count: sets the quantity to what was actually counted and
    logs the gap with what the ledger expected."""
    delta = counted_quantity - item.current_quantity
    item.current_quantity = counted_quantity
    item.save(update_fields=["current_quantity", "updated_at"])

    return StockMovement.objects.create(
        item=item,
        movement_type=StockMovement.MovementType.INVENTAIRE,
        quantity_delta=delta,
        note=note,
        created_by=user,
    )


@transaction.atomic
def apply_consumption(trigger: str, *, appointment=None, insole_order=None):
    """Deducts stock for every consumption rule attached to `trigger` (an
    Appointment.AppointmentType value, or ConsumptionRule.INSOLE_ORDER_TRIGGER).

    Callers are responsible for only calling this once per visit/order — see
    signals.py, which guards on whether a movement already exists for it.
    """
    rules = ConsumptionRule.objects.filter(trigger=trigger).select_related("item")
    movements = []
    for rule in rules:
        item = rule.item
        item.current_quantity -= rule.quantity_per_unit
        item.save(update_fields=["current_quantity", "updated_at"])
        movements.append(
            StockMovement.objects.create(
                item=item,
                movement_type=StockMovement.MovementType.UTILISATION,
                quantity_delta=-rule.quantity_per_unit,
                appointment=appointment,
                insole_order=insole_order,
                note="Consommation automatique",
            )
        )
    return movements
