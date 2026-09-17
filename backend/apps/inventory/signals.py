from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.appointments.models import Appointment
from apps.insoles.models import InsoleOrder

from . import services
from .models import ConsumptionRule, StockMovement


@receiver(post_save, sender=Appointment)
def deduct_stock_when_appointment_is_honored(sender, instance, **kwargs):
    """Consumes stock the moment a visit is marked as attended (Honoré).
    Guarded against re-firing on every later save of the same appointment."""
    if instance.status != Appointment.Status.HONORE:
        return

    already_applied = StockMovement.objects.filter(
        appointment=instance, movement_type=StockMovement.MovementType.UTILISATION
    ).exists()
    if already_applied:
        return

    services.apply_consumption(instance.appointment_type, appointment=instance)


@receiver(post_save, sender=InsoleOrder)
def deduct_stock_when_insole_order_is_created(sender, instance, created, **kwargs):
    """Consumes raw-material stock as soon as an insole order is opened —
    that is when the materials actually get committed to a pair."""
    if not created:
        return

    services.apply_consumption(ConsumptionRule.INSOLE_ORDER_TRIGGER, insole_order=instance)
