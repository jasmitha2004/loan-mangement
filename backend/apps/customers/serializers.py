from rest_framework import serializers
from .models import Customer
from datetime import date

class CustomerSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'full_name', 'mobile_number', 'email', 'pan_number', 'aadhaar_number',
            'date_of_birth', 'city', 'state', 'pincode', 'consent_accepted', 'consent_timestamp',
            'age', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'consent_timestamp', 'created_at', 'updated_at']

    def get_age(self, obj):
        if not obj.date_of_birth:
            return None
        today = date.today()
        return today.year - obj.date_of_birth.year - (
            (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
        )
