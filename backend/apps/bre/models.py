from django.db import models

class OperatorChoices(models.TextChoices):
    GREATER_THAN = '>', 'Greater Than (>)'
    LESS_THAN = '<', 'Less Than (<)'
    GREATER_EQUAL = '>=', 'Greater Than or Equal (>=)'
    LESS_EQUAL = '<=', 'Less Than or Equal (<=)'
    EQUAL = '==', 'Equal (==)'
    NOT_EQUAL = '!=', 'Not Equal (!=)'
    BETWEEN = 'BETWEEN', 'Between (inclusive range min,max)'
    IN = 'IN', 'In List (comma separated)'

class BRERule(models.Model):
    LOAN_TYPE_CHOICES = [
        ('ALL', 'All Loan Types'),
        ('Home Loan', 'Home Loan'),
        ('Personal Loan', 'Personal Loan'),
        ('Business Loan', 'Business Loan'),
        ('Loan Against Property', 'Loan Against Property'),
        ('Vehicle Loan', 'Vehicle Loan'),
        ('Education Loan', 'Education Loan'),
        ('Gold Loan', 'Gold Loan'),
    ]

    rule_name = models.CharField(max_length=150, unique=True)
    loan_type = models.CharField(
        max_length=50, 
        default='ALL',
        choices=LOAN_TYPE_CHOICES,
        help_text="Target loan requirement type"
    )
    field = models.CharField(
        max_length=50,
        help_text="Target field name e.g. age, monthly_income, credit_score, loan_amount_ratio, employment_type"
    )
    operator = models.CharField(max_length=15, choices=OperatorChoices.choices)
    value = models.CharField(max_length=255, help_text="Target threshold value. Range format '21,60', list format 'Salaried,Self Employed'")
    error_message = models.CharField(max_length=255)
    priority = models.PositiveIntegerField(default=1, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', 'created_at']

    def __str__(self):
        return f"Rule {self.priority}: {self.rule_name} ({self.field} {self.operator} {self.value})"

class BRERuleHistory(models.Model):
    rule = models.ForeignKey(BRERule, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=20) # CREATED, UPDATED, DELETED
    modified_by = models.CharField(max_length=150, null=True, blank=True)
    previous_state = models.JSONField(null=True, blank=True)
    new_state = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
