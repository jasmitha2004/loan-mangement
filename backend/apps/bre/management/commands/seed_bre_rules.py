from django.core.management.base import BaseCommand
from apps.bre.models import BRERule
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial BRE rules and default admin superuser'

    def handle(self, *args, **options):
        # Create default superadmin
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@loansphere.com',
                password='admin123',
                role='SUPER_ADMIN',
                first_name='System',
                last_name='Admin'
            )
            self.stdout.write(self.style.SUCCESS("Superuser 'admin' created successfully (Password: admin123)."))

        default_rules = [
            {
                "rule_name": "Minimum Age Requirement",
                "field": "age",
                "operator": ">=",
                "value": "21",
                "error_message": "Applicant age must be at least 21 years",
                "priority": 1,
                "is_active": True
            },
            {
                "rule_name": "Maximum Age Limit",
                "field": "age",
                "operator": "<=",
                "value": "60",
                "error_message": "Applicant age cannot exceed 60 years",
                "priority": 2,
                "is_active": True
            },
            {
                "rule_name": "Minimum Monthly Income",
                "field": "monthly_income",
                "operator": ">=",
                "value": "30000",
                "error_message": "Monthly income must be at least ₹30,000",
                "priority": 3,
                "is_active": True
            },
            {
                "rule_name": "Minimum Credit Score",
                "field": "credit_score",
                "operator": ">=",
                "value": "700",
                "error_message": "Credit score below minimum eligible score of 700",
                "priority": 4,
                "is_active": True
            },
            {
                "rule_name": "Maximum LTV Ratio",
                "field": "loan_amount_ratio",
                "operator": "<=",
                "value": "80",
                "error_message": "Loan amount exceeds 80% of property value",
                "priority": 5,
                "is_active": True
            }
        ]

        created_count = 0
        for rule_data in default_rules:
            rule, created = BRERule.objects.get_or_create(
                rule_name=rule_data["rule_name"],
                defaults=rule_data
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} BRE rules."))
