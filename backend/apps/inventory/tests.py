from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.appointments.models import Appointment
from apps.insoles.models import InsoleOrder
from apps.patients.models import Patient

from . import forecasting, services
from .models import ConsumptionRule, StockItem, StockMovement


class ServiceLedgerTests(TestCase):
    def setUp(self):
        self.item = StockItem.objects.create(
            name="Gants nitrile",
            unit="boîte",
            current_quantity=Decimal("10"),
            minimum_quantity=Decimal("2"),
            pack_size=Decimal("5"),
        )

    def test_record_delivery_increases_quantity_and_logs_movement(self):
        services.record_delivery(self.item, Decimal("5"), unit_cost=Decimal("12.50"), note="BL-042")
        self.item.refresh_from_db()

        self.assertEqual(self.item.current_quantity, Decimal("15"))
        movement = self.item.movements.get()
        self.assertEqual(movement.movement_type, StockMovement.MovementType.LIVRAISON)
        self.assertEqual(movement.quantity_delta, Decimal("5"))
        self.assertEqual(movement.note, "BL-042")

    def test_record_delivery_rejects_non_positive_quantity(self):
        with self.assertRaises(ValueError):
            services.record_delivery(self.item, Decimal("0"))

    def test_record_manual_adjustment_can_go_negative(self):
        services.record_manual_adjustment(self.item, Decimal("-3"), note="Casse")
        self.item.refresh_from_db()

        self.assertEqual(self.item.current_quantity, Decimal("7"))
        self.assertEqual(
            self.item.movements.get().movement_type, StockMovement.MovementType.AJUSTEMENT
        )

    def test_record_manual_adjustment_rejects_zero(self):
        with self.assertRaises(ValueError):
            services.record_manual_adjustment(self.item, Decimal("0"))

    def test_record_stock_count_sets_quantity_and_logs_the_gap(self):
        services.record_stock_count(self.item, Decimal("8"), note="Comptage mensuel")
        self.item.refresh_from_db()

        self.assertEqual(self.item.current_quantity, Decimal("8"))
        movement = self.item.movements.get()
        self.assertEqual(movement.movement_type, StockMovement.MovementType.INVENTAIRE)
        # Started at 10, counted 8: the ledger should show the missing 2.
        self.assertEqual(movement.quantity_delta, Decimal("-2"))


class AutoConsumptionSignalTests(TestCase):
    def setUp(self):
        self.patient = Patient.objects.create(first_name="Jane", last_name="Doe")
        self.gloves = StockItem.objects.create(name="Gants", current_quantity=Decimal("20"))
        self.blades = StockItem.objects.create(name="Lames", current_quantity=Decimal("20"))
        ConsumptionRule.objects.create(
            item=self.gloves,
            trigger=Appointment.AppointmentType.SOIN_PEDICURIE,
            quantity_per_unit=Decimal("2"),
        )
        ConsumptionRule.objects.create(
            item=self.blades,
            trigger=Appointment.AppointmentType.SOIN_PEDICURIE,
            quantity_per_unit=Decimal("1"),
        )

    def _make_appointment(self, status):
        now = timezone.now()
        return Appointment.objects.create(
            patient=self.patient,
            appointment_type=Appointment.AppointmentType.SOIN_PEDICURIE,
            status=status,
            start_time=now,
            end_time=now + timedelta(minutes=30),
        )

    def test_marking_an_appointment_honored_deducts_stock(self):
        appointment = self._make_appointment(Appointment.Status.EN_ATTENTE)
        self.gloves.refresh_from_db()
        self.blades.refresh_from_db()
        self.assertEqual(self.gloves.current_quantity, Decimal("20"))

        appointment.status = Appointment.Status.HONORE
        appointment.save()

        self.gloves.refresh_from_db()
        self.blades.refresh_from_db()
        self.assertEqual(self.gloves.current_quantity, Decimal("18"))
        self.assertEqual(self.blades.current_quantity, Decimal("19"))

    def test_saving_an_already_honored_appointment_again_does_not_double_deduct(self):
        appointment = self._make_appointment(Appointment.Status.HONORE)
        self.gloves.refresh_from_db()
        self.assertEqual(self.gloves.current_quantity, Decimal("18"))

        appointment.notes = "RAS"
        appointment.save()

        self.gloves.refresh_from_db()
        self.assertEqual(self.gloves.current_quantity, Decimal("18"))

    def test_appointment_type_without_a_rule_does_not_touch_stock(self):
        now = timezone.now()
        Appointment.objects.create(
            patient=self.patient,
            appointment_type=Appointment.AppointmentType.BILAN_PODOLOGIQUE,
            status=Appointment.Status.HONORE,
            start_time=now,
            end_time=now + timedelta(minutes=30),
        )
        self.gloves.refresh_from_db()
        self.assertEqual(self.gloves.current_quantity, Decimal("20"))

    def test_creating_an_insole_order_deducts_its_materials(self):
        eva = StockItem.objects.create(name="Plaque EVA", current_quantity=Decimal("10"))
        ConsumptionRule.objects.create(
            item=eva, trigger=ConsumptionRule.INSOLE_ORDER_TRIGGER, quantity_per_unit=Decimal("0.25")
        )

        InsoleOrder.objects.create(patient=self.patient)

        eva.refresh_from_db()
        self.assertEqual(eva.current_quantity, Decimal("9.75"))


class ForecastingTests(TestCase):
    def setUp(self):
        self.patient = Patient.objects.create(first_name="Jane", last_name="Doe")
        self.gloves = StockItem.objects.create(
            name="Gants",
            current_quantity=Decimal("2"),
            minimum_quantity=Decimal("5"),
            pack_size=Decimal("10"),
        )
        ConsumptionRule.objects.create(
            item=self.gloves,
            trigger=Appointment.AppointmentType.SOIN_PEDICURIE,
            quantity_per_unit=Decimal("2"),
        )

    def _honored_visit_in(self, year, month, day=10):
        start = timezone.make_aware(timezone.datetime(year, month, day, 9, 0))
        Appointment.objects.create(
            patient=self.patient,
            appointment_type=Appointment.AppointmentType.SOIN_PEDICURIE,
            status=Appointment.Status.HONORE,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

    def test_suggests_a_quantity_rounded_up_to_the_pack_size(self):
        as_of = timezone.datetime(2026, 4, 15).date()
        # 4 honoured pedicure visits/month on average over the 3 prior months.
        # Each one auto-deducts gloves via the signal, same as it would in
        # production, so reset the on-hand count to 2 afterwards — that's
        # "today's actual stock", independent of how it got there.
        for month in (1, 2, 3):
            for _ in range(4):
                self._honored_visit_in(2026, month)
        self.gloves.current_quantity = Decimal("2")
        self.gloves.save()

        rows = forecasting.suggest_orders(months_history=3, as_of=as_of)
        row = next(r for r in rows if r["item"] == self.gloves)

        # Expected usage: 4 visits * 2 gloves/visit = 8.
        self.assertEqual(row["expected_usage_next_month"], Decimal("8"))
        # Raw need: 8 (usage) + 5 (safety stock) - 2 (on hand) = 11, rounded
        # up to the next pack of 10 -> 20.
        self.assertEqual(row["suggested_order_quantity"], Decimal("20"))

    def test_no_suggestion_when_stock_already_covers_expected_usage(self):
        self.gloves.current_quantity = Decimal("100")
        self.gloves.save()

        rows = forecasting.suggest_orders(months_history=3, as_of=timezone.now().date())
        row = next(r for r in rows if r["item"] == self.gloves)
        self.assertEqual(row["suggested_order_quantity"], Decimal("0"))

    def test_booked_next_month_visits_are_not_double_counted_against_the_average(self):
        as_of = timezone.datetime(2026, 4, 15).date()
        for _ in range(4):
            self._honored_visit_in(2026, 3)
        # Only 1 visit already booked for May — average (4) should still
        # dominate since it's higher than what's booked.
        start = timezone.make_aware(timezone.datetime(2026, 5, 5, 9, 0))
        Appointment.objects.create(
            patient=self.patient,
            appointment_type=Appointment.AppointmentType.SOIN_PEDICURIE,
            status=Appointment.Status.CONFIRME,
            start_time=start,
            end_time=start + timedelta(minutes=30),
        )

        rows = forecasting.suggest_orders(months_history=1, as_of=as_of)
        row = next(r for r in rows if r["item"] == self.gloves)
        # avg=4, booked=1 -> expected_count = 1 + max(4-1, 0) = 4 visits.
        self.assertEqual(row["expected_usage_next_month"], Decimal("8"))
