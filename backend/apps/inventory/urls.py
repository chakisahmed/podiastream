from rest_framework.routers import DefaultRouter

from .views import ConsumptionRuleViewSet, StockItemViewSet

router = DefaultRouter()
router.register("stock-items", StockItemViewSet, basename="stock-item")
router.register("consumption-rules", ConsumptionRuleViewSet, basename="consumption-rule")

urlpatterns = router.urls
