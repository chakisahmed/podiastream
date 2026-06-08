from rest_framework.routers import DefaultRouter

from .views import ConsultationNoteViewSet, PatientViewSet

router = DefaultRouter()
router.register("patients", PatientViewSet, basename="patient")
router.register("consultation-notes", ConsultationNoteViewSet, basename="consultation-note")

urlpatterns = router.urls
