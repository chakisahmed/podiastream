from rest_framework import serializers

from .models import ConsultationNote, Patient


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            "id",
            "first_name",
            "last_name",
            "date_of_birth",
            "phone",
            "email",
            "profession",
            "shoe_size",
            "referring_doctor",
            "address",
            "allergies",
            "medical_background",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ConsultationNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultationNote
        fields = [
            "id",
            "patient",
            "appointment",
            "practitioner",
            "consultation_date",
            "motif",
            "bilan_podologique",
            "diagnostic",
            "treatment_plan",
            "created_at",
        ]
        read_only_fields = ["id", "consultation_date", "practitioner", "created_at"]
