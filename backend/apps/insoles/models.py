import uuid

from django.db import models

from apps.accounts.models import Profile
from apps.appointments.models import Appointment
from apps.patients.models import Patient


class InsoleOrder(models.Model):
    class Status(models.TextChoices):
        EMPREINTE_PRISE = "empreinte_prise", "Examen effectué / Prise d'empreinte"
        CONCEPTION = "conception", "En cours de conception / Modélisation"
        USINAGE_ASSEMBLAGE = "usinage_assemblage", "En cours d'usinage / Assemblage"
        PRET_ESSAYAGE = "pret_essayage", "Prêt pour essayage"
        LIVRE = "livre", "Livré au patient"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="insole_orders")
    appointment = models.ForeignKey(Appointment, null=True, blank=True, on_delete=models.SET_NULL)
    practitioner = models.ForeignKey(Profile, null=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.EMPREINTE_PRISE)
    materials_used = models.TextField(blank=True)
    corrections = models.TextField(blank=True)
    manufacturing_notes = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "insole_orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Semelles {self.patient} ({self.get_status_display()})"


class InsoleStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    insole_order = models.ForeignKey(InsoleOrder, on_delete=models.CASCADE, related_name="status_history")
    status = models.CharField(max_length=30, choices=InsoleOrder.Status.choices)
    changed_by = models.ForeignKey(Profile, null=True, on_delete=models.SET_NULL)
    comment = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "insole_status_history"
        ordering = ["changed_at"]
        verbose_name_plural = "insole status histories"


class InsoleAttachment(models.Model):
    class FileType(models.TextChoices):
        PHOTO_EMPREINTE = "photo_empreinte", "Photo empreinte"
        PHOTO_PIED = "photo_pied", "Photo pied"
        SCAN_3D = "scan_3d", "Scan 3D"
        AUTRE = "autre", "Autre"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    insole_order = models.ForeignKey(InsoleOrder, on_delete=models.CASCADE, related_name="attachments")
    storage_path = models.TextField()
    file_type = models.CharField(max_length=20, choices=FileType.choices, default=FileType.AUTRE)
    uploaded_by = models.ForeignKey(Profile, null=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "insole_attachments"
        ordering = ["-uploaded_at"]
