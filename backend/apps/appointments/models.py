import uuid

from django.db import models

from apps.accounts.models import Profile
from apps.patients.models import Patient


class Appointment(models.Model):
    class AppointmentType(models.TextChoices):
        BILAN_PODOLOGIQUE = "bilan_podologique", "Bilan podologique"
        REMISE_SEMELLES = "remise_semelles", "Remise de semelles"
        SOIN_PEDICURIE = "soin_pedicurie", "Soin de pédicurie"
        SUIVI_CONTROLE = "suivi_controle", "Suivi / Contrôle"
        ABSENCE = "absence", "Absence / Congé"

    class Status(models.TextChoices):
        CONFIRME = "confirme", "Confirmé"
        EN_ATTENTE = "en_attente", "En attente"
        ANNULE = "annule", "Annulé"
        HONORE = "honore", "Honoré"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Nullable on purpose: a patient record is only created once someone
    # actually attends, so a booking routinely exists before there is anyone to
    # point at. Unlinked entries also cover leave and other blocked time.
    patient = models.ForeignKey(
        Patient, null=True, blank=True, on_delete=models.CASCADE, related_name="appointments"
    )
    # Whoever the slot was booked under, when no patient record exists yet.
    booked_name = models.CharField(max_length=200, blank=True)
    practitioner = models.ForeignKey(Profile, null=True, on_delete=models.SET_NULL)
    appointment_type = models.CharField(max_length=30, choices=AppointmentType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.EN_ATTENTE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    notes = models.TextField(blank=True)
    # calendar.event this was imported from, or null for a date-tag visit that
    # had no calendar counterpart. Also the import's idempotency key.
    odoo_event_id = models.IntegerField(null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "appointments"
        ordering = ["start_time"]
        indexes = [models.Index(fields=["start_time"])]

    def __str__(self):
        who = self.patient or self.booked_name or "—"
        return f"{who} — {self.start_time:%d/%m/%Y %H:%M}"
