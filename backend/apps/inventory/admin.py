from django.contrib import admin

from .models import ConsumptionRule, StockItem, StockMovement


class ConsumptionRuleInline(admin.TabularInline):
    model = ConsumptionRule
    extra = 0


class StockMovementInline(admin.TabularInline):
    model = StockMovement
    extra = 0
    readonly_fields = ("created_at",)
    fields = ("movement_type", "quantity_delta", "appointment", "insole_order", "note", "created_by", "created_at")
    ordering = ("-created_at",)


@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "current_quantity", "minimum_quantity", "unit", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "sku")
    inlines = [ConsumptionRuleInline, StockMovementInline]


@admin.register(ConsumptionRule)
class ConsumptionRuleAdmin(admin.ModelAdmin):
    list_display = ("item", "trigger", "quantity_per_unit")
    list_filter = ("trigger",)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("item", "movement_type", "quantity_delta", "created_at")
    list_filter = ("movement_type",)
    readonly_fields = ("created_at",)
