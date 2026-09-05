from django.contrib import admin

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("patient", "document_type", "created_at", "generated_by")
    list_filter = ("document_type",)
