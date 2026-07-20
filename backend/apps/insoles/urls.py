from rest_framework.routers import DefaultRouter

from .views import InsoleOrderViewSet

router = DefaultRouter()
router.register("insole-orders", InsoleOrderViewSet, basename="insole-order")

urlpatterns = router.urls
