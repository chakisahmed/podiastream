import uuid

from django.db import models

from apps.accounts.models import Profile
from apps.appointments.models import Appointment
from apps.patients.models import Patient


class Document(models.Model):
    class DocumentType(models.TextChoices):
        ORDONNANCE = "ordonnance", "Ordonnance"
        COMPTE_RENDU = "compte_rendu", "Compte rendu"
        FACTURE = "facture", "Facture"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="documents")
    appointment = models.ForeignKey(Appointment, null=True, blank=True, on_delete=models.SET_NULL)
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    storage_path = models.TextField()
    generated_by = models.ForeignKey(Profile, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "documents"
        ordering = ["-created_at"]
