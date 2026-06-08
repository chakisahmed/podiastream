from django.contrib import admin

from .models import ConsultationNote, Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "phone", "date_of_birth", "is_active")
    search_fields = ("last_name", "first_name", "phone", "email")
    list_filter = ("is_active",)


@admin.register(ConsultationNote)
class ConsultationNoteAdmin(admin.ModelAdmin):
    list_display = ("patient", "consultation_date", "practitioner")
    list_filter = ("consultation_date",)
