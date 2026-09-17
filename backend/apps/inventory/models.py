import uuid

from django.db import models

from apps.accounts.models import Profile
from apps.appointments.models import Appointment
from apps.insoles.models import InsoleOrder


class StockItem(models.Model):
    """A consumable or raw material tracked in the cabinet's stock."""

    class Category(models.TextChoices):
        CONSOMMABLE = "consommable", "Consommable"
        MATIERE_PREMIERE = "matiere_premiere", "Matière première"
        AUTRE = "autre", "Autre"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    sku = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.CONSOMMABLE)
    unit = models.CharField(max_length=20, default="unité", help_text="unité, boîte, m, paire, L…")
    # Cached running total, kept in sync by services.py through StockMovement
    # rows — never edited directly, so the ledger below always explains it.
    current_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    # Reorder threshold / safety stock: how much should still be on the
    # shelf when the next delivery arrives.
    minimum_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    # Supplier pack size, used to round purchase suggestions up to something
    # that can actually be ordered.
    pack_size = models.DecimalField(max_digits=10, decimal_places=3, default=1)
    supplier_name = models.CharField(max_length=200, blank=True)
    supplier_lead_time_days = models.PositiveIntegerField(default=7)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inventory_stock_items"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.current_quantity <= self.minimum_quantity


class StockMovement(models.Model):
    """Append-only ledger of every change to a StockItem's quantity.
    StockItem.current_quantity is a cache of the running total of these."""

    class MovementType(models.TextChoices):
        LIVRAISON = "livraison", "Livraison fournisseur"
        UTILISATION = "utilisation", "Consommation (soin / fabrication)"
        INVENTAIRE = "inventaire", "Comptage / correction d'inventaire"
        AJUSTEMENT = "ajustement", "Ajustement manuel (casse, perte…)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(StockItem, on_delete=models.CASCADE, related_name="movements")
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    # Signed: positive adds to stock, negative removes from it.
    quantity_delta = models.DecimalField(max_digits=10, decimal_places=3)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # Set when this movement was an automatic deduction, so it can be traced
    # back to the visit or order that caused it.
    appointment = models.ForeignKey(
        Appointment, null=True, blank=True, on_delete=models.SET_NULL, related_name="stock_movements"
    )
    insole_order = models.ForeignKey(
        InsoleOrder, null=True, blank=True, on_delete=models.SET_NULL, related_name="stock_movements"
    )
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(Profile, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "inventory_stock_movements"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.item} {self.quantity_delta:+} ({self.get_movement_type_display()})"


class ConsumptionRule(models.Model):
    """How much of an item one visit (by appointment type) or one insole
    order consumes. Used to auto-deduct stock and to forecast next month's
    usage."""

    INSOLE_ORDER_TRIGGER = "insole_order"

    # Every real visit type, minus ABSENCE (blocked time, not a visit that
    # consumes anything), plus the insole-fabrication trigger.
    TRIGGER_CHOICES = [
        (value, label)
        for value, label in Appointment.AppointmentType.choices
        if value != Appointment.AppointmentType.ABSENCE
    ] + [(INSOLE_ORDER_TRIGGER, "Fabrication d'une paire de semelles")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(StockItem, on_delete=models.CASCADE, related_name="consumption_rules")
    trigger = models.CharField(max_length=30, choices=TRIGGER_CHOICES)
    quantity_per_unit = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        db_table = "inventory_consumption_rules"
        unique_together = [("item", "trigger")]
        ordering = ["item__name"]

    def __str__(self):
        return f"{self.item} — {self.get_trigger_display()}: {self.quantity_per_unit}"
