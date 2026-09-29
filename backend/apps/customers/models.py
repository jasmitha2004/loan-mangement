from django.db import models
from django.core.validators import RegexValidator

indian_mobile_regex = RegexValidator(
    regex=r'^[6-9]\d{9}$',
    message="Mobile number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
)

pan_regex = RegexValidator(
    regex=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
    message="PAN card number must be 10 characters in standard format (e.g. ABCDE1234F)."
)

aadhaar_regex = RegexValidator(
    regex=r'^\d{12}$',
    message="Aadhaar card number must be a valid 12-digit number."
)

class Customer(models.Model):
    full_name = models.CharField(max_length=150)
    mobile_number = models.CharField(max_length=15, unique=True, validators=[indian_mobile_regex], db_index=True)
    email = models.EmailField(db_index=True)
    pan_number = models.CharField(max_length=10, validators=[pan_regex], null=True, blank=True, db_index=True)
    aadhaar_number = models.CharField(max_length=12, validators=[aadhaar_regex], null=True, blank=True, db_index=True)
    date_of_birth = models.DateField()
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    
    consent_accepted = models.BooleanField(default=True)
    consent_timestamp = models.DateTimeField(auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.mobile_number}) - PAN: {self.pan_number or 'N/A'}"
