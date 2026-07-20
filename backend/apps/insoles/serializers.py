from rest_framework import serializers

from .models import InsoleAttachment, InsoleOrder, InsoleStatusHistory


class InsoleStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InsoleStatusHistory
        fields = ["id", "status", "changed_by", "comment", "changed_at"]
        read_only_fields = fields


class InsoleAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsoleAttachment
        fields = ["id", "insole_order", "storage_path", "file_type", "uploaded_by", "uploaded_at"]
        read_only_fields = ["id", "storage_path", "uploaded_by", "uploaded_at"]


class InsoleOrderSerializer(serializers.ModelSerializer):
    status_history = InsoleStatusHistorySerializer(many=True, read_only=True)
    attachments = InsoleAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = InsoleOrder
        fields = [
            "id",
            "patient",
            "appointment",
            "practitioner",
            "status",
            "materials_used",
            "corrections",
            "manufacturing_notes",
            "price",
            "estimated_delivery_date",
            "delivered_at",
            "created_at",
            "updated_at",
            "status_history",
            "attachments",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class InsoleStatusTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=InsoleOrder.Status.choices)
    comment = serializers.CharField(required=False, allow_blank=True)
