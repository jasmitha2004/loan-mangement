from django.core.management.base import BaseCommand
from apps.customers.models import Customer
from apps.leads.models import Lead, LeadNote, BREStatus, LoanType, EmploymentType
from apps.bre.engine import BREEngine
from apps.credit.services import get_credit_service
from django.utils import timezone
from datetime import date, datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Seeds realistic dummy leads data across all 7 loan categories and 12 months for year-wise analytics.'

    def handle(self, *args, **options):
        # Clear existing data first for clean seed
        Lead.objects.all().delete()
        Customer.objects.all().delete()

        cities = [
            ("Mumbai", "Maharashtra", "400001"),
            ("Delhi", "Delhi", "110001"),
            ("Bengaluru", "Karnataka", "560001"),
            ("Ahmedabad", "Gujarat", "380001"),
            ("Pune", "Maharashtra", "411001"),
            ("Hyderabad", "Telangana", "500001"),
            ("Chennai", "Tamil Nadu", "600001"),
            ("Kolkata", "West Bengal", "700001"),
        ]

        first_names = ["Rajesh", "Priya", "Vikram", "Ananya", "Suresh", "Kavita", "Arjun", "Meenakshi", "Amit", "Neha", "Rohan", "Sneha"]
        last_names = ["Kumar", "Sharma", "Verma", "Roy", "Patel", "Deshmukh", "Reddy", "Sundaram", "Gupta", "Singh", "Joshi", "Nair"]

        all_loan_types = [
            LoanType.HOME_LOAN,
            LoanType.PERSONAL_LOAN,
            LoanType.BUSINESS_LOAN,
            LoanType.LAP,
            LoanType.VEHICLE_LOAN,
            LoanType.EDUCATION_LOAN,
            LoanType.GOLD_LOAN
        ]

        credit_service = get_credit_service()
        created_count = 0

        current_year = date.today().year

        # Seed data across all 12 months of the year
        for month in range(1, 13):
            # Generate 4-5 leads per month to cover all loan types
            num_leads_in_month = random.randint(4, 5)
            for i in range(num_leads_in_month):
                fname = random.choice(first_names)
                lname = random.choice(last_names)
                full_name = f"{fname} {lname}"
                
                day = random.randint(1, 28)
                created_dt = timezone.make_aware(datetime(current_year, month, day, random.randint(9, 18), random.randint(0, 59)))
                
                mobile_num = f"98{month:02d}{created_count:04d}"[:10]
                pan_letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=5))
                pan_digits = f"{random.randint(1000, 9999)}"
                pan_last = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
                pan_number = f"{pan_letters}{pan_digits}{pan_last}"
                aadhaar_number = f"{random.randint(100000000000, 999999999999)}"

                city_info = random.choice(cities)
                city, state, pincode = city_info[0], city_info[1], city_info[2]

                loan_type = random.choice(all_loan_types)
                employment_type = random.choice([EmploymentType.SALARIED, EmploymentType.SELF_EMPLOYED])

                income = random.choice([25000, 35000, 45000, 60000, 85000, 110000, 150000])
                loan_amount = random.choice([150000, 500000, 1500000, 2500000, 3500000, 5000000, 8000000])
                
                if loan_type in [LoanType.HOME_LOAN, LoanType.LAP]:
                    property_value = int(loan_amount * random.choice([1.1, 1.3, 1.5, 1.8]))
                    ltv_ratio = round((loan_amount / property_value) * 100, 2)
                else:
                    property_value = 0.0
                    ltv_ratio = 0.0

                birth_year = current_year - random.randint(22, 58)
                dob = date(birth_year, random.randint(1, 12), random.randint(1, 28))

                customer = Customer.objects.create(
                    full_name=full_name,
                    mobile_number=mobile_num,
                    email=f"{fname.lower()}.{lname.lower()}{random.randint(10,99)}@example.com",
                    pan_number=pan_number,
                    aadhaar_number=aadhaar_number,
                    date_of_birth=dob,
                    city=city,
                    state=state,
                    pincode=pincode,
                    consent_accepted=True
                )
                customer.created_at = created_dt
                customer.save()

                credit_resp = credit_service.fetch_credit_score(
                    mobile_number=customer.mobile_number, 
                    email=customer.email, 
                    name=customer.full_name, 
                    pan_number=customer.pan_number
                )
                credit_score = credit_resp.get("credit_score", 720)
                age = current_year - dob.year

                bre_context = {
                    'age': age,
                    'monthly_income': float(income),
                    'credit_score': credit_score,
                    'loan_amount': float(loan_amount),
                    'property_value': float(property_value),
                    'loan_amount_ratio': ltv_ratio,
                    'employment_type': employment_type,
                    'loan_type': loan_type,
                    'city': city,
                    'state': state
                }

                bre_result = BREEngine.evaluate(bre_context)

                lead = Lead.objects.create(
                    customer=customer,
                    loan_type=loan_type,
                    employment_type=employment_type,
                    monthly_income=income,
                    loan_amount=loan_amount,
                    property_value=property_value,
                    loan_to_value_ratio=ltv_ratio,
                    credit_score=credit_score,
                    credit_grade=credit_resp.get("grade", "Fair"),
                    credit_color_code=credit_resp.get("color_code", "#3B82F6"),
                    bre_status=bre_result["status"],
                    rejection_reasons=bre_result["rejection_reasons"],
                    rule_evaluations=bre_result["rule_evaluations"]
                )
                lead.created_at = created_dt
                lead.save()

                if bre_result["status"] == "Eligible":
                    LeadNote.objects.create(
                        lead=lead,
                        author="Loan Manager (admin)",
                        note_text=f"Lead #{lead.id} approved for {loan_type} pipeline ({month:02d}/{current_year}). CIBIL score: {credit_score}."
                    )

                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} dummy leads across all 7 loan categories for year {current_year}."))
