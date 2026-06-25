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

    class Status(models.TextChoices):
        CONFIRME = "confirme", "Confirmé"
        EN_ATTENTE = "en_attente", "En attente"
        ANNULE = "annule", "Annulé"
        HONORE = "honore", "Honoré"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    practitioner = models.ForeignKey(Profile, null=True, on_delete=models.SET_NULL)
    appointment_type = models.CharField(max_length=30, choices=AppointmentType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.EN_ATTENTE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "appointments"
        ordering = ["start_time"]
        indexes = [models.Index(fields=["start_time"])]

    def __str__(self):
        return f"{self.patient} — {self.start_time:%d/%m/%Y %H:%M}"
