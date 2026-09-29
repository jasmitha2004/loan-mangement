from rest_framework.routers import DefaultRouter
from .views import BRERuleViewSet

router = DefaultRouter()
router.register(r'', BRERuleViewSet, basename='bre-rule')

urlpatterns = router.urls
