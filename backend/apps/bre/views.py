from django.db import models
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import BRERule, BRERuleHistory
from .serializers import BRERuleSerializer, BRERuleHistorySerializer, BRETestPayloadSerializer
from .engine import BREEngine
from apps.authentication.permissions import IsLoanManagerOrAbove

class BRERuleViewSet(viewsets.ModelViewSet):
    serializer_class = BRERuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = BRERule.objects.all()
        loan_type = self.request.query_params.get('loan_type', None)
        if loan_type and loan_type != 'ALL':
            queryset = queryset.filter(models.Q(loan_type='ALL') | models.Q(loan_type__iexact=loan_type))
        return queryset

    def perform_create(self, serializer):
        rule = serializer.save()
        BRERuleHistory.objects.create(
            rule=rule,
            action="CREATED",
            modified_by=self.request.user.username,
            new_state=BRERuleSerializer(rule).data
        )

    def perform_update(self, serializer):
        old_state = BRERuleSerializer(self.get_object()).data
        rule = serializer.save()
        BRERuleHistory.objects.create(
            rule=rule,
            action="UPDATED",
            modified_by=self.request.user.username,
            previous_state=old_state,
            new_state=BRERuleSerializer(rule).data
        )

    def perform_destroy(self, instance):
        rule_data = BRERuleSerializer(instance).data
        BRERuleHistory.objects.create(
            rule=instance,
            action="DELETED",
            modified_by=self.request.user.username,
            previous_state=rule_data
        )
        instance.delete()

    @extend_schema(
        summary="Test Business Rules",
        description="Run test payload through BRE engine without persisting a lead.",
        request=BRETestPayloadSerializer
    )
    @action(detail=False, methods=['post'], url_path='test')
    def test_rules(self, request):
        payload = request.data.copy()
        
        loan_amount = float(payload.get('loan_amount', 0))
        property_value = float(payload.get('property_value', 0))
        if property_value > 0:
            payload['loan_amount_ratio'] = round((loan_amount / property_value) * 100, 2)
        else:
            payload['loan_amount_ratio'] = 0.0

        result = BREEngine.evaluate(payload)
        return Response(result, status=status.HTTP_200_OK)
