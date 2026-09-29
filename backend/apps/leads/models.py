from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.customers.models import Customer

class BREStatus(models.TextChoices):
    ELIGIBLE = 'Eligible', 'Eligible'
    REJECTED = 'Rejected', 'Rejected'
    PENDING = 'Pending', 'Pending'

class LoanType(models.TextChoices):
    HOME_LOAN = 'Home Loan', 'Home Loan'
    PERSONAL_LOAN = 'Personal Loan', 'Personal Loan'
    BUSINESS_LOAN = 'Business Loan', 'Business Loan'
    LAP = 'Loan Against Property', 'Loan Against Property'
    VEHICLE_LOAN = 'Vehicle Loan', 'Vehicle Loan'
    EDUCATION_LOAN = 'Education Loan', 'Education Loan'
    GOLD_LOAN = 'Gold Loan', 'Gold Loan'

class EmploymentType(models.TextChoices):
    SALARIED = 'Salaried', 'Salaried'
    SELF_EMPLOYED = 'Self Employed', 'Self Employed'

class Lead(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='leads')
    loan_type = models.CharField(max_length=50, choices=LoanType.choices, default=LoanType.HOME_LOAN)
    employment_type = models.CharField(max_length=50, choices=EmploymentType.choices, default=EmploymentType.SALARIED)
    
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2)
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2)
    property_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    loan_to_value_ratio = models.FloatField(default=0.0) # LTV %
    
    credit_score = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(300), MaxValueValidator(900)])
    credit_grade = models.CharField(max_length=50, blank=True, null=True)
    credit_color_code = models.CharField(max_length=20, blank=True, null=True)
    
    bre_status = models.CharField(max_length=20, choices=BREStatus.choices, default=BREStatus.PENDING)
    rejection_reasons = models.JSONField(default=list, blank=True)
    rule_evaluations = models.JSONField(default=list, blank=True)
    assigned_to = models.CharField(max_length=100, blank=True, null=True)
    
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Lead #{self.id} - {self.customer.full_name} ({self.bre_status})"

class LeadNote(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='notes')
    author = models.CharField(max_length=100, default="System")
    note_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note on Lead #{self.lead_id} by {self.author}"
