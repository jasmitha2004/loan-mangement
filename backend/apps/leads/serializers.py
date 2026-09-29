import re
from rest_framework import serializers
from .models import Lead, LeadNote
from apps.customers.models import Customer
from apps.customers.serializers import CustomerSerializer

class LeadNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadNote
        fields = ['id', 'author', 'note_text', 'created_at']

class LeadSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    notes = LeadNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'customer', 'loan_type', 'employment_type',
            'monthly_income', 'loan_amount', 'property_value', 'loan_to_value_ratio',
            'credit_score', 'credit_grade', 'credit_color_code',
            'bre_status', 'rejection_reasons', 'rule_evaluations',
            'assigned_to', 'notes', 'is_deleted',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'customer', 'loan_to_value_ratio', 'credit_score', 'credit_grade',
            'credit_color_code', 'bre_status', 'rejection_reasons', 'rule_evaluations',
            'created_at', 'updated_at'
        ]

class CreateLeadSerializer(serializers.Serializer):
    # Customer Details
    full_name = serializers.CharField(max_length=150)
    mobile_number = serializers.CharField(max_length=15)
    email = serializers.EmailField()
    pan_number = serializers.CharField(max_length=10, required=False, allow_blank=True)
    aadhaar_number = serializers.CharField(max_length=12, required=False, allow_blank=True)
    date_of_birth = serializers.DateField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=10)
    consent_accepted = serializers.BooleanField(required=True)

    # Loan Details
    loan_type = serializers.CharField(max_length=50)
    employment_type = serializers.CharField(max_length=50)
    monthly_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    loan_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    property_value = serializers.DecimalField(max_digits=14, decimal_places=2)

    def validate_consent_accepted(self, value):
        if not value:
            raise serializers.ValidationError("Customer consent to share data is mandatory.")
        return value

    def validate_mobile_number(self, value):
        val = value.strip()
        if Customer.objects.filter(mobile_number=val).exists():
            raise serializers.ValidationError("Lead already exists with this mobile number.")
        return val

    def validate_pan_number(self, value):
        if not value:
            return ""
        val = value.strip().upper()
        if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', val):
            raise serializers.ValidationError("Invalid PAN card format. Example: ABCDE1234F.")
        return val

    def validate_aadhaar_number(self, value):
        if not value:
            return ""
        val = value.strip()
        if not re.match(r'^\d{12}$', val):
            raise serializers.ValidationError("Aadhaar card must be a 12-digit number.")
        return val
