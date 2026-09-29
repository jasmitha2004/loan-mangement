from django.urls import path
from .views import DashboardAnalyticsView, ExportLeadsView

urlpatterns = [
    path('dashboard/', DashboardAnalyticsView.as_view(), name='analytics_dashboard'),
    path('export/leads/', ExportLeadsView.as_view(), name='analytics_export'),
    path('leads/export/', ExportLeadsView.as_view(), name='analytics_export_alias'),
]
