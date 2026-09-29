from rest_framework import serializers
from .models import BRERule, BRERuleHistory

class BRERuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BRERule
        fields = [
            'id', 'rule_name', 'loan_type', 'field', 'operator', 'value',
            'error_message', 'priority', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class BRERuleHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BRERuleHistory
        fields = '__all__'

class BRETestPayloadSerializer(serializers.Serializer):
    age = serializers.IntegerField(required=False, default=30)
    monthly_income = serializers.FloatField(required=False, default=50000)
    credit_score = serializers.IntegerField(required=False, default=750)
    loan_amount = serializers.FloatField(required=False, default=1000000)
    property_value = serializers.FloatField(required=False, default=2000000)
    employment_type = serializers.CharField(required=False, default="Salaried")
    loan_type = serializers.CharField(required=False, default="Home Loan")
