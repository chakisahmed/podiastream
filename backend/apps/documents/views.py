import uuid

from django.http import FileResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.core import storage
from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    def create(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            raise ValidationError({"file": "Ce champ est requis."})

        patient_id = request.data.get("patient")
        document_type = request.data.get("document_type")
        appointment_id = request.data.get("appointment") or None
        if not patient_id or not document_type:
            raise ValidationError({"detail": "patient et document_type sont requis."})

        extension = file.name.rsplit(".", 1)[-1] if "." in file.name else "bin"
        object_path = f"{patient_id}/{uuid.uuid4()}.{extension}"
        storage.save_file(Document.BUCKET, object_path, file)

        document = Document.objects.create(
            patient_id=patient_id,
            appointment_id=appointment_id,
            document_type=document_type,
            storage_path=object_path,
            generated_by=request.user,
        )
        return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        document = self.get_object()
        file = storage.open_file(Document.BUCKET, document.storage_path)
        filename = document.storage_path.rsplit("/", 1)[-1]
        return FileResponse(file, as_attachment=True, filename=filename)
