"""Estimates next month's consumption per stock item and suggests how much
to order.

The estimate for each visit type is: whatever is already booked next month,
plus a historical average (last few months) for the visits not booked yet.
Averages are simple on purpose — a single cabinet doesn't generate enough
data for anything fancier, and a simple average is easy to sanity-check.
"""

import calendar
from collections import defaultdict
from decimal import ROUND_CEILING, Decimal

from django.db.models import Count
from django.utils import timezone

from apps.appointments.models import Appointment
from apps.insoles.models import InsoleOrder

from .models import ConsumptionRule, StockItem

DEFAULT_MONTHS_HISTORY = 3


def _month_bounds(year, month):
    last_day = calendar.monthrange(year, month)[1]
    return timezone.datetime(year, month, 1).date(), timezone.datetime(year, month, last_day).date()


def _shift_month(year, month, delta):
    total = (year * 12 + (month - 1)) + delta
    return total // 12, total % 12 + 1


def _average_monthly_appointment_counts(months_history, as_of):
    """{appointment_type: average number of Honoré visits per month} over
    the `months_history` full months before `as_of`'s month."""
    totals = defaultdict(int)
    for i in range(1, months_history + 1):
        year, month = _shift_month(as_of.year, as_of.month, -i)
        start, end = _month_bounds(year, month)
        rows = (
            Appointment.objects.filter(
                status=Appointment.Status.HONORE,
                start_time__date__gte=start,
                start_time__date__lte=end,
            )
            .values("appointment_type")
            .annotate(n=Count("id"))
        )
        for row in rows:
            totals[row["appointment_type"]] += row["n"]
    return {key: Decimal(value) / months_history for key, value in totals.items()}


def _average_monthly_insole_order_count(months_history, as_of):
    total = 0
    for i in range(1, months_history + 1):
        year, month = _shift_month(as_of.year, as_of.month, -i)
        start, end = _month_bounds(year, month)
        total += InsoleOrder.objects.filter(
            created_at__date__gte=start, created_at__date__lte=end
        ).count()
    return Decimal(total) / months_history


def _booked_next_month_counts(as_of):
    """{appointment_type: count} already on the calendar for next month,
    excluding cancellations."""
    year, month = _shift_month(as_of.year, as_of.month, 1)
    start, end = _month_bounds(year, month)
    rows = (
        Appointment.objects.filter(start_time__date__gte=start, start_time__date__lte=end)
        .exclude(status=Appointment.Status.ANNULE)
        .values("appointment_type")
        .annotate(n=Count("id"))
    )
    return {row["appointment_type"]: row["n"] for row in rows}


def _round_up_to_pack(raw_quantity, pack_size):
    if raw_quantity <= 0:
        return Decimal("0")
    pack_size = pack_size or Decimal("1")
    packs = (raw_quantity / pack_size).to_integral_value(rounding=ROUND_CEILING)
    return packs * pack_size


def suggest_orders(months_history=DEFAULT_MONTHS_HISTORY, as_of=None):
    """Returns one dict per active stock item with its expected usage next
    month and the quantity it suggests ordering."""
    as_of = as_of or timezone.now().date()
    avg_counts = _average_monthly_appointment_counts(months_history, as_of)
    booked_counts = _booked_next_month_counts(as_of)
    avg_insole_orders = _average_monthly_insole_order_count(months_history, as_of)

    results = []
    for item in StockItem.objects.filter(is_active=True).prefetch_related("consumption_rules"):
        expected_usage = Decimal("0")
        usage_breakdown = {}

        for rule in item.consumption_rules.all():
            if rule.trigger == ConsumptionRule.INSOLE_ORDER_TRIGGER:
                expected_count = avg_insole_orders
            else:
                booked = Decimal(booked_counts.get(rule.trigger, 0))
                avg = avg_counts.get(rule.trigger, Decimal("0"))
                # Booked visits are counted as-is; anything the average says
                # should still happen beyond what's booked is added on top.
                expected_count = booked + max(avg - booked, Decimal("0"))

            usage = expected_count * rule.quantity_per_unit
            expected_usage += usage
            usage_breakdown[rule.trigger] = usage

        raw_suggestion = expected_usage + item.minimum_quantity - item.current_quantity
        suggested_quantity = _round_up_to_pack(raw_suggestion, item.pack_size)

        results.append(
            {
                "item": item,
                "expected_usage_next_month": expected_usage,
                "suggested_order_quantity": suggested_quantity,
                "usage_breakdown": usage_breakdown,
            }
        )

    results.sort(key=lambda row: row["suggested_order_quantity"], reverse=True)
    return results
