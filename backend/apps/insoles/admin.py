from django.contrib import admin

from .models import InsoleAttachment, InsoleOrder, InsoleStatusHistory


class InsoleStatusHistoryInline(admin.TabularInline):
    model = InsoleStatusHistory
    extra = 0
    readonly_fields = ("changed_at",)


class InsoleAttachmentInline(admin.TabularInline):
    model = InsoleAttachment
    extra = 0
    readonly_fields = ("uploaded_at",)


@admin.register(InsoleOrder)
class InsoleOrderAdmin(admin.ModelAdmin):
    list_display = ("patient", "status", "estimated_delivery_date", "updated_at")
    list_filter = ("status",)
    inlines = [InsoleStatusHistoryInline, InsoleAttachmentInline]
