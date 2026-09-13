import uuid

from django.db import models

from apps.accounts.models import Profile


class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    profession = models.CharField(max_length=150, blank=True)
    shoe_size = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    referring_doctor = models.CharField(max_length=150, blank=True)
    address = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    medical_background = models.TextField(blank=True)
    created_by = models.ForeignKey(Profile, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    # res.partner this was imported from. Makes the import idempotent, and
    # traces a record back to the Odoo archive when something looks wrong.
    odoo_partner_id = models.IntegerField(null=True, blank=True, unique=True)

    class Meta:
        db_table = "patients"
        indexes = [models.Index(fields=["last_name", "first_name"])]
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class ConsultationNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="consultation_notes")
    appointment = models.ForeignKey(
        "appointments.Appointment", null=True, blank=True, on_delete=models.SET_NULL
    )
    practitioner = models.ForeignKey(Profile, null=True, on_delete=models.SET_NULL)
    consultation_date = models.DateField(auto_now_add=True)
    motif = models.TextField(blank=True)
    bilan_podologique = models.TextField(blank=True)
    diagnostic = models.TextField(blank=True)
    treatment_plan = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "consultation_notes"
        ordering = ["-consultation_date"]
