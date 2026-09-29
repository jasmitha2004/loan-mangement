from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from datetime import date

from .models import Lead, LeadNote
from .serializers import LeadSerializer, CreateLeadSerializer, LeadNoteSerializer
from apps.customers.models import Customer
from apps.credit.services import get_credit_service
from apps.bre.engine import BREEngine

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Lead.objects.filter(is_deleted=False).select_related('customer')
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(customer__full_name__icontains=search) |
                Q(customer__mobile_number__icontains=search) |
                Q(customer__email__icontains=search) |
                Q(customer__city__icontains=search) |
                Q(customer__pan_number__icontains=search) |
                Q(customer__aadhaar_number__icontains=search)
            )

        bre_status = self.request.query_params.get('bre_status', None)
        if bre_status:
            queryset = queryset.filter(bre_status=bre_status)

        loan_type = self.request.query_params.get('loan_type', None)
        if loan_type:
            queryset = queryset.filter(loan_type=loan_type)

        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(customer__city__iexact=city)

        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    @extend_schema(
        summary="Create Customer Loan Lead",
        description="Submits customer details, fetches credit score using PAN/Aadhaar/Mobile, evaluates dynamic BRE rules, and stores lead.",
        request=CreateLeadSerializer,
        responses={201: OpenApiResponse(description="Lead successfully created")}
    )
    def create(self, request, *args, **kwargs):
        serializer = CreateLeadSerializer(data=request.data)
        if not serializer.is_valid():
            mobile_errors = serializer.errors.get('mobile_number', [])
            if any("already exists" in str(err) for err in mobile_errors):
                return Response(
                    {"status": "error", "message": "Lead already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {"status": "error", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        with transaction.atomic():
            # 1. Create or retrieve Customer record with PAN and Aadhaar
            customer, _ = Customer.objects.get_or_create(
                mobile_number=data['mobile_number'],
                defaults={
                    'full_name': data['full_name'],
                    'email': data['email'],
                    'pan_number': data.get('pan_number', ''),
                    'aadhaar_number': data.get('aadhaar_number', ''),
                    'date_of_birth': data['date_of_birth'],
                    'city': data['city'],
                    'state': data['state'],
                    'pincode': data['pincode'],
                    'consent_accepted': data['consent_accepted']
                }
            )

            # 2. Fetch Credit Score with Decentro / CIBIL Bureau service
            credit_service = get_credit_service()
            credit_resp = credit_service.fetch_credit_score(
                mobile_number=customer.mobile_number,
                email=customer.email,
                name=customer.full_name,
                pan_number=customer.pan_number,
                aadhaar_number=customer.aadhaar_number
            )
            credit_score = credit_resp.get('credit_score', 650)
            credit_grade = credit_resp.get('grade', 'Fair')
            credit_color = credit_resp.get('color_code', '#EAB308')

            # 3. Compute derived metrics
            today = date.today()
            dob = customer.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

            monthly_income = float(data['monthly_income'])
            loan_amount = float(data['loan_amount'])
            property_value = float(data['property_value'])
            ltv_ratio = round((loan_amount / property_value * 100), 2) if property_value > 0 else 0.0

            # 4. Prepare evaluation context for Dynamic BRE Engine
            bre_context = {
                'age': age,
                'monthly_income': monthly_income,
                'credit_score': credit_score,
                'loan_amount': loan_amount,
                'property_value': property_value,
                'loan_amount_ratio': ltv_ratio,
                'employment_type': data['employment_type'],
                'loan_type': data['loan_type'],
                'city': data['city'],
                'state': data['state']
            }

            bre_result = BREEngine.evaluate(bre_context)

            # 5. Create Lead
            lead = Lead.objects.create(
                customer=customer,
                loan_type=data['loan_type'],
                employment_type=data['employment_type'],
                monthly_income=data['monthly_income'],
                loan_amount=data['loan_amount'],
                property_value=data['property_value'],
                loan_to_value_ratio=ltv_ratio,
                credit_score=credit_score,
                credit_grade=credit_grade,
                credit_color_code=credit_color,
                bre_status=bre_result['status'],
                rejection_reasons=bre_result['rejection_reasons'],
                rule_evaluations=bre_result['rule_evaluations']
            )

        return Response({
            "status": "success",
            "lead_id": lead.id,
            "credit_score": lead.credit_score,
            "bre_status": lead.bre_status,
            "rejection_reasons": lead.rejection_reasons,
            "lead_details": LeadSerializer(lead).data
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        lead = self.get_object()
        lead.is_deleted = True
        lead.save()
        return Response({"status": "success", "message": f"Lead #{lead.id} soft-deleted successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='add-note')
    def add_note(self, request, pk=None):
        lead = self.get_object()
        note_text = request.data.get('note_text', '').strip()
        if not note_text:
            return Response({"error": "Note text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        note = LeadNote.objects.create(
            lead=lead,
            author=request.user.username if request.user.is_authenticated else "System User",
            note_text=note_text
        )
        return Response(LeadNoteSerializer(note).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        lead_ids = request.data.get('lead_ids', [])
        if not isinstance(lead_ids, list) or not lead_ids:
            return Response({"error": "List of lead_ids required"}, status=status.HTTP_400_BAD_REQUEST)
        
        updated_count = Lead.objects.filter(id__in=lead_ids).update(is_deleted=True)
        return Response({"status": "success", "deleted_count": updated_count}, status=status.HTTP_200_OK)
