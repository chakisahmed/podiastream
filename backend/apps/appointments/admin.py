from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "appointment_type", "status", "start_time", "end_time")
    list_filter = ("status", "appointment_type")
    date_hierarchy = "start_time"
