import pytest
from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.bre.models import BRERule
from apps.bre.engine import BREEngine
from apps.customers.models import Customer
from apps.leads.models import Lead, BREStatus
from apps.credit.services import MockCibilCreditService, get_credit_service
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestDynamicBREEngine:
    def test_bre_engine_eligibility_pass(self):
        BRERule.objects.create(
            rule_name="Income Check",
            field="monthly_income",
            operator=">=",
            value="30000",
            error_message="Income too low",
            priority=1
        )
        BRERule.objects.create(
            rule_name="Score Check",
            field="credit_score",
            operator=">=",
            value="700",
            error_message="Score too low",
            priority=2
        )

        context = {"monthly_income": 50000, "credit_score": 750}
        result = BREEngine.evaluate(context)

        assert result["eligible"] is True
        assert result["status"] == "Eligible"
        assert len(result["rejection_reasons"]) == 0

    def test_bre_engine_rejection_reasons(self):
        BRERule.objects.create(
            rule_name="Income Check",
            field="monthly_income",
            operator=">=",
            value="30000",
            error_message="Income too low",
            priority=1
        )
        BRERule.objects.create(
            rule_name="Score Check",
            field="credit_score",
            operator=">=",
            value="700",
            error_message="Score too low",
            priority=2
        )

        context = {"monthly_income": 20000, "credit_score": 650}
        result = BREEngine.evaluate(context)

        assert result["eligible"] is False
        assert result["status"] == "Rejected"
        assert len(result["rejection_reasons"]) == 2
        assert "Income too low" in result["rejection_reasons"]
        assert "Score too low" in result["rejection_reasons"]

    def test_bre_engine_operators(self):
        BRERule.objects.create(
            rule_name="Age Between",
            field="age",
            operator="BETWEEN",
            value="21,60",
            error_message="Age out of bounds",
            priority=1
        )
        BRERule.objects.create(
            rule_name="Employment In List",
            field="employment_type",
            operator="IN",
            value="Salaried,Self Employed",
            error_message="Employment type invalid",
            priority=2
        )

        context = {"age": 30, "employment_type": "Salaried"}
        assert BREEngine.evaluate(context)["eligible"] is True

        context_fail = {"age": 18, "employment_type": "Freelance"}
        res_fail = BREEngine.evaluate(context_fail)
        assert res_fail["eligible"] is False
        assert len(res_fail["rejection_reasons"]) == 2

@pytest.mark.django_db
class TestCreditService:
    def test_mock_cibil_service(self):
        service = MockCibilCreditService()
        res = service.fetch_credit_score("9876543210")
        assert res["success"] is True
        assert 550 <= res["credit_score"] <= 850
        assert res["color_code"] is not None

@pytest.mark.django_db
class TestLeadAPIs:
    def test_create_lead_success_and_duplicate_check(self):
        client = APIClient()

        payload = {
            "full_name": "Rajesh Kumar",
            "mobile_number": "9876543210",
            "email": "rajesh@example.com",
            "date_of_birth": "1992-05-15",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "consent_accepted": True,
            "loan_type": "Home Loan",
            "employment_type": "Salaried",
            "monthly_income": 60000,
            "loan_amount": 2500000,
            "property_value": 4000000
        }

        # First request succeeds
        res1 = client.post('/api/leads/', payload, format='json')
        assert res1.status_code == status.HTTP_201_CREATED
        assert res1.data["status"] == "success"
        assert "lead_id" in res1.data

        # Second request with duplicate mobile fails
        res2 = client.post('/api/leads/', payload, format='json')
        assert res2.status_code == status.HTTP_400_BAD_REQUEST
        assert res2.data["status"] == "error"
        assert "already exists" in res2.data["message"]
