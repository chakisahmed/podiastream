import uuid

from django.http import FileResponse
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.core import storage
from . import services
from .models import InsoleAttachment, InsoleOrder
from .serializers import (
    InsoleAttachmentSerializer,
    InsoleOrderSerializer,
    InsoleStatusTransitionSerializer,
)


ATTACHMENTS_BUCKET = "insole-attachments"


class InsoleOrderViewSet(viewsets.ModelViewSet):
    queryset = InsoleOrder.objects.all()
    serializer_class = InsoleOrderSerializer
    # The Kanban board needs the full set of orders at once, not a page at a time.
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get("status")
        patient_id = self.request.query_params.get("patient")
        if status_param:
            queryset = queryset.filter(status=status_param)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(practitioner=self.request.user)
        services.transition_status(instance, instance.status, self.request.user, comment="Création")

    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request, pk=None):
        order = self.get_object()
        payload = InsoleStatusTransitionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        services.transition_status(
            order,
            payload.validated_data["status"],
            request.user,
            comment=payload.validated_data.get("comment", ""),
        )
        return Response(InsoleOrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="attachments")
    def upload_attachment(self, request, pk=None):
        """Direct local-disk upload: the frontend POSTs the file straight to
        Django (multipart/form-data), which saves it to disk and records the
        attachment in one step."""
        order = self.get_object()
        file = request.FILES.get("file")
        if not file:
            raise ValidationError({"file": "Ce champ est requis."})
        file_type = request.data.get("file_type", InsoleAttachment.FileType.AUTRE)

        extension = file.name.rsplit(".", 1)[-1] if "." in file.name else "bin"
        object_path = f"{order.id}/{uuid.uuid4()}.{extension}"
        storage.save_file(ATTACHMENTS_BUCKET, object_path, file)

        attachment = InsoleAttachment.objects.create(
            insole_order=order,
            storage_path=object_path,
            file_type=file_type,
            uploaded_by=request.user,
        )
        return Response(
            InsoleAttachmentSerializer(attachment).data, status=http_status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["get"], url_path="attachments/(?P<attachment_id>[^/.]+)/download")
    def download_attachment(self, request, pk=None, attachment_id=None):
        order = self.get_object()
        attachment = order.attachments.get(pk=attachment_id)
        file = storage.open_file(ATTACHMENTS_BUCKET, attachment.storage_path)
        filename = attachment.storage_path.rsplit("/", 1)[-1]
        return FileResponse(file, as_attachment=True, filename=filename)
