from django.db.models import F
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import forecasting, services
from .models import ConsumptionRule, StockItem
from .serializers import (
    ConsumptionRuleSerializer,
    StockAdjustmentSerializer,
    StockCountSerializer,
    StockDeliverySerializer,
    StockItemSerializer,
    StockMovementSerializer,
    SuggestedOrderSerializer,
)


class StockItemViewSet(viewsets.ModelViewSet):
    queryset = StockItem.objects.all()
    serializer_class = StockItemSerializer
    # A dozen or so items at most for a single cabinet — the low-stock and
    # ordering views need the full picture, not one page of it.
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        active_only = self.request.query_params.get("active_only")
        if category:
            queryset = queryset.filter(category=category)
        if active_only in ("1", "true", "True"):
            queryset = queryset.filter(is_active=True)
        return queryset

    @action(detail=True, methods=["get"], url_path="movements")
    def movements(self, request, pk=None):
        item = self.get_object()
        return Response(StockMovementSerializer(item.movements.all(), many=True).data)

    @action(detail=True, methods=["post"], url_path="deliveries")
    def record_delivery(self, request, pk=None):
        item = self.get_object()
        payload = StockDeliverySerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        services.record_delivery(
            item,
            payload.validated_data["quantity"],
            unit_cost=payload.validated_data.get("unit_cost"),
            note=payload.validated_data.get("note", ""),
            user=request.user,
        )
        return Response(StockItemSerializer(item).data, status=http_status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="adjustments")
    def record_adjustment(self, request, pk=None):
        item = self.get_object()
        payload = StockAdjustmentSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        services.record_manual_adjustment(
            item,
            payload.validated_data["quantity_delta"],
            note=payload.validated_data.get("note", ""),
            user=request.user,
        )
        return Response(StockItemSerializer(item).data, status=http_status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="counts")
    def record_count(self, request, pk=None):
        item = self.get_object()
        payload = StockCountSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        services.record_stock_count(
            item,
            payload.validated_data["counted_quantity"],
            note=payload.validated_data.get("note", ""),
            user=request.user,
        )
        return Response(StockItemSerializer(item).data, status=http_status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        items = self.get_queryset().filter(is_active=True, current_quantity__lte=F("minimum_quantity"))
        return Response(StockItemSerializer(items, many=True).data)

    @action(detail=False, methods=["get"], url_path="suggested-orders")
    def suggested_orders(self, request):
        months_history = int(request.query_params.get("months_history", forecasting.DEFAULT_MONTHS_HISTORY))
        rows = forecasting.suggest_orders(months_history=months_history)
        return Response(SuggestedOrderSerializer(rows, many=True).data)


class ConsumptionRuleViewSet(viewsets.ModelViewSet):
    queryset = ConsumptionRule.objects.select_related("item")
    serializer_class = ConsumptionRuleSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        item_id = self.request.query_params.get("item")
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        return queryset
