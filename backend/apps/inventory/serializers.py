from decimal import Decimal

from rest_framework import serializers

from .models import ConsumptionRule, StockItem, StockMovement


class StockItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = StockItem
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "unit",
            "current_quantity",
            "minimum_quantity",
            "pack_size",
            "supplier_name",
            "supplier_lead_time_days",
            "unit_cost",
            "notes",
            "is_active",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]
        # current_quantity only ever moves through the deliveries/adjustments/
        # counts actions below, so the ledger in StockMovement always
        # explains how it got there.
        read_only_fields = ["id", "current_quantity", "created_at", "updated_at"]


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = [
            "id",
            "item",
            "movement_type",
            "quantity_delta",
            "unit_cost",
            "appointment",
            "insole_order",
            "note",
            "created_by",
            "created_at",
        ]
        read_only_fields = fields


class ConsumptionRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsumptionRule
        fields = ["id", "item", "trigger", "quantity_per_unit"]
        read_only_fields = ["id"]


class StockDeliverySerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=10, decimal_places=3, min_value=Decimal("0.001"))
    unit_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class StockAdjustmentSerializer(serializers.Serializer):
    quantity_delta = serializers.DecimalField(max_digits=10, decimal_places=3)
    note = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_quantity_delta(self, value):
        if value == 0:
            raise serializers.ValidationError("L'ajustement ne peut pas être nul.")
        return value


class StockCountSerializer(serializers.Serializer):
    counted_quantity = serializers.DecimalField(max_digits=10, decimal_places=3, min_value=Decimal("0"))
    note = serializers.CharField(required=False, allow_blank=True, default="")


class SuggestedOrderSerializer(serializers.Serializer):
    item = StockItemSerializer()
    expected_usage_next_month = serializers.DecimalField(max_digits=12, decimal_places=3)
    suggested_order_quantity = serializers.DecimalField(max_digits=12, decimal_places=3)
