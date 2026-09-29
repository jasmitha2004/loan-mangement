from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.negotiation import DefaultContentNegotiation
from django.db.models import Avg, Count, Sum, Q
from django.db.models.functions import TruncMonth
from drf_spectacular.utils import extend_schema
from datetime import datetime, time
import re

from apps.leads.models import Lead, BREStatus
from .export_utils import export_leads_csv, export_leads_excel, export_leads_pdf

class IgnoreFormatContentNegotiation(DefaultContentNegotiation):
    def filter_renderers(self, renderers, format):
        return renderers

class DashboardAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Dashboard Metrics & Charts API",
        description="Returns overall key performance metrics and aggregated dataset for charts with date/month filtering."
    )
    def get(self, request):
        queryset = Lead.objects.filter(is_deleted=False)

        start_date_str = request.query_params.get('start_date', None)
        end_date_str = request.query_params.get('end_date', None)
        month_str = request.query_params.get('month', None) # YYYY-MM

        dt_start = None
        dt_end = None

        if start_date_str:
            try:
                dt_start = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                pass

        if end_date_str:
            try:
                dt_end = datetime.combine(datetime.strptime(end_date_str, '%Y-%m-%d').date(), time.max)
            except ValueError:
                pass

        # Auto-correct reversed dates if start_date > end_date
        if dt_start and dt_end and dt_start > dt_end:
            dt_start, dt_end = datetime.combine(dt_end.date(), time.min), datetime.combine(dt_start.date(), time.max)

        if dt_start:
            queryset = queryset.filter(created_at__gte=dt_start)
        if dt_end:
            queryset = queryset.filter(created_at__lte=dt_end)

        if month_str and not (dt_start or dt_end):
            try:
                year, month = map(int, month_str.split('-'))
                queryset = queryset.filter(created_at__year=year, created_at__month=month)
            except ValueError:
                pass

        total_leads = queryset.count()
        eligible_leads = queryset.filter(bre_status=BREStatus.ELIGIBLE).count()
        rejected_leads = queryset.filter(bre_status=BREStatus.REJECTED).count()
        pending_leads = queryset.filter(bre_status=BREStatus.PENDING).count()

        avg_credit_score = queryset.aggregate(avg=Avg('credit_score'))['avg'] or 0
        avg_loan_amount = queryset.aggregate(avg=Avg('loan_amount'))['avg'] or 0
        approval_rate = round((eligible_leads / total_leads * 100), 1) if total_leads > 0 else 0.0

        # Monthly lead distribution
        monthly_data = (
            queryset.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(
                total=Count('id'),
                eligible=Count('id', filter=Q(bre_status=BREStatus.ELIGIBLE)),
                rejected=Count('id', filter=Q(bre_status=BREStatus.REJECTED))
            )
            .order_by('month')
        )

        monthly_leads = [
            {
                'month': item['month'].strftime('%b %Y') if item['month'] else 'N/A',
                'total': item['total'],
                'eligible': item['eligible'],
                'rejected': item['rejected']
            } for item in monthly_data
        ]

        # Loan type distribution
        loan_type_data = list(
            queryset.values('loan_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # BRE Status Pie Chart
        bre_status_data = [
            {'name': 'Eligible', 'value': eligible_leads, 'color': '#22C55E'},
            {'name': 'Rejected', 'value': rejected_leads, 'color': '#EF4444'},
            {'name': 'Pending', 'value': pending_leads, 'color': '#EAB308'},
        ]

        # Credit Score Distribution Brackets
        score_brackets = [
            {'range': '750+', 'count': queryset.filter(credit_score__gte=750).count()},
            {'range': '700-749', 'count': queryset.filter(credit_score__gte=700, credit_score__lt=750).count()},
            {'range': '650-699', 'count': queryset.filter(credit_score__gte=650, credit_score__lt=700).count()},
            {'range': '<650', 'count': queryset.filter(credit_score__lt=650).count()},
        ]

        # City-wise lead counts
        city_data = list(
            queryset.values('customer__city')
            .annotate(count=Count('id'))
            .order_by('-count')[:8]
        )
        city_leads = [{'city': item['customer__city'], 'count': item['count']} for item in city_data]

        return Response({
            "summary": {
                "total_leads": total_leads,
                "eligible_leads": eligible_leads,
                "rejected_leads": rejected_leads,
                "pending_leads": pending_leads,
                "avg_credit_score": round(avg_credit_score, 1),
                "avg_loan_amount": round(avg_loan_amount, 2),
                "approval_rate": approval_rate
            },
            "charts": {
                "monthly_leads": monthly_leads,
                "loan_type_distribution": loan_type_data,
                "bre_status_distribution": bre_status_data,
                "credit_score_distribution": score_brackets,
                "city_leads": city_leads
            }
        }, status=status.HTTP_200_OK)

class ExportLeadsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    content_negotiation_class = IgnoreFormatContentNegotiation

    @extend_schema(
        summary="Export Leads Data Report",
        description="Extract report by Loan IDs, Date Range (start_date, end_date), or Month (YYYY-MM) as CSV, Excel, or PDF."
    )
    def get(self, request):
        export_format = request.query_params.get('format', 'csv').lower()
        selected_ids = request.query_params.get('ids', None)
        start_date_str = request.query_params.get('start_date', None)
        end_date_str = request.query_params.get('end_date', None)
        month_str = request.query_params.get('month', None) # e.g. 2026-08

        queryset = Lead.objects.filter(is_deleted=False).select_related('customer')
        applied_filters = []

        # 1. Clean and filter by specific Lead IDs (priority override)
        if selected_ids:
            cleaned_str = re.sub(r'[^\d,]', '', selected_ids)
            ids_list = [int(i.strip()) for i in cleaned_str.split(',') if i.strip().isdigit()]
            if ids_list:
                queryset = queryset.filter(id__in=ids_list)
                applied_filters.append(f"Lead ID(s): {', '.join(map(str, ids_list))}")

        # 2. Date Range filtering (with smart start/end auto-swap)
        dt_start = None
        dt_end = None

        if start_date_str:
            try:
                dt_start = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                pass

        if end_date_str:
            try:
                dt_end = datetime.combine(datetime.strptime(end_date_str, '%Y-%m-%d').date(), time.max)
            except ValueError:
                pass

        if dt_start and dt_end and dt_start > dt_end:
            dt_start, dt_end = datetime.combine(dt_end.date(), time.min), datetime.combine(dt_start.date(), time.max)

        if not selected_ids:
            if dt_start:
                queryset = queryset.filter(created_at__gte=dt_start)
            if dt_end:
                queryset = queryset.filter(created_at__lte=dt_end)
            if dt_start or dt_end:
                applied_filters.append(f"Date Range: {dt_start.strftime('%Y-%m-%d') if dt_start else 'Start'} to {dt_end.strftime('%Y-%m-%d') if dt_end else 'End'}")

            # 3. Month Filter if no explicit date range
            if month_str and not (dt_start or dt_end):
                try:
                    year, month = map(int, month_str.split('-'))
                    queryset = queryset.filter(created_at__year=year, created_at__month=month)
                    applied_filters.append(f"Month: {datetime(year, month, 1).strftime('%B %Y')}")
                except ValueError:
                    pass

        filter_summary = " | ".join(applied_filters) if applied_filters else "All System Leads"

        if export_format == 'excel':
            return export_leads_excel(queryset, filter_summary)
        elif export_format == 'pdf':
            return export_leads_pdf(queryset, filter_summary)
        else:
            return export_leads_csv(queryset, filter_summary)
