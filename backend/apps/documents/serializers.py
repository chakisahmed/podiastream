from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id",
            "patient",
            "appointment",
            "document_type",
            "storage_path",
            "generated_by",
            "created_at",
        ]
        read_only_fields = ["id", "storage_path", "generated_by", "created_at"]
