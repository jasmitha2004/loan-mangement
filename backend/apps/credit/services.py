import os
import requests
import random
import logging
import hashlib
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

DECENTRO_CREDIT_BUREAU_URL = os.getenv(
    "DECENTRO_CREDIT_BUREAU_URL", 
    "https://in.staging.decentro.tech/v2/financial_services/credit_bureau/credit_report/summary"
)
DECENTRO_CLIENT_ID = os.getenv("DECENTRO_CLIENT_ID", "")
DECENTRO_CLIENT_SECRET = os.getenv("DECENTRO_CLIENT_SECRET", "")
DECENTRO_MODULE_SECRET = os.getenv("DECENTRO_MODULE_SECRET", "")


class BaseCreditService(ABC):
    """Abstract Base Class for Credit Bureau / Credit Score Services"""

    @abstractmethod
    def fetch_credit_score(
        self, 
        mobile_number: str, 
        email: str = "", 
        name: str = "", 
        pan_number: str = "", 
        aadhaar_number: str = ""
    ) -> dict:
        """
        Fetch credit score for given identifier.
        Returns dict containing score, grade, indicator_color, and provider metadata.
        """
        pass


class DecentroCreditBureauService(BaseCreditService):
    """
    Decentro Credit Bureau API Integration.
    Live Staging Endpoint: https://in.staging.decentro.tech/v2/financial_services/credit_bureau/credit_report/summary
    """

    def __init__(self):
        self.api_url = DECENTRO_CREDIT_BUREAU_URL
        self.client_id = DECENTRO_CLIENT_ID
        self.client_secret = DECENTRO_CLIENT_SECRET
        self.module_secret = DECENTRO_MODULE_SECRET

    def fetch_credit_score(
        self, 
        mobile_number: str, 
        email: str = "", 
        name: str = "", 
        pan_number: str = "", 
        aadhaar_number: str = ""
    ) -> dict:
        if not self.client_id or not self.client_secret:
            logger.info("Decentro credentials not configured. Falling back to deterministic CIBIL scoring engine.")
            return MockCibilCreditService().fetch_credit_score(mobile_number, email, name, pan_number, aadhaar_number)

        headers = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "module_secret": self.module_secret,
            "Content-Type": "application/json",
        }

        payload = {
            "mobile_number": mobile_number,
            "name": name or "Loan Applicant",
            "email_address": email or "applicant@example.com",
            "inquiry_purpose": "INQUIRE_CREDIT_REPORT",
            "consent": True,
            "consent_purpose": "Loan Eligibility Evaluation"
        }
        if pan_number:
            payload["pan"] = pan_number

        try:
            response = requests.post(self.api_url, json=payload, headers=headers, timeout=10)
            data = response.json()

            if response.status_code in [200, 201] and data.get("status") in ["SUCCESS", "PENDING"]:
                res_data = data.get("data", {})
                summary = res_data.get("credit_bureau_summary", {})
                raw_score = (
                    summary.get("credit_score") 
                    or res_data.get("credit_score") 
                    or res_data.get("cibil_score") 
                    or res_data.get("score") 
                    or 750
                )
                score = int(raw_score)
                indicator = self._calculate_indicator(score)
                return {
                    "success": True,
                    "credit_score": score,
                    "grade": indicator["grade"],
                    "color_code": indicator["color_code"],
                    "color_label": indicator["color_label"],
                    "provider": "Decentro CIBIL Credit Bureau v2 Summary API",
                    "error": None,
                    "decentro_response": data
                }
            else:
                logger.warning(f"Decentro API returned status {response.status_code}: {data}")
                return MockCibilCreditService().fetch_credit_score(mobile_number, email, name, pan_number, aadhaar_number)
        except Exception as e:
            logger.error(f"Error executing Decentro Credit Bureau API call: {str(e)}")
            return MockCibilCreditService().fetch_credit_score(mobile_number, email, name, pan_number, aadhaar_number)

    def _calculate_indicator(self, score: int) -> dict:
        if score >= 750:
            return {"grade": "Excellent", "color_code": "#22C55E", "color_label": "green"}
        elif score >= 700:
            return {"grade": "Good", "color_code": "#3B82F6", "color_label": "blue"}
        elif score >= 650:
            return {"grade": "Fair", "color_code": "#EAB308", "color_label": "yellow"}
        else:
            return {"grade": "Poor", "color_code": "#EF4444", "color_label": "red"}


class MockCibilCreditService(BaseCreditService):
    """
    Mock implementation of CIBIL / Experian Credit Score API.
    Uses deterministic MD5 hashing on mobile number for reproducible scores.
    """

    def fetch_credit_score(
        self, 
        mobile_number: str, 
        email: str = "", 
        name: str = "", 
        pan_number: str = "", 
        aadhaar_number: str = ""
    ) -> dict:
        try:
            # Generate deterministic score between 550 and 850
            hash_digest = hashlib.md5(mobile_number.encode('utf-8')).hexdigest()
            hash_int = int(hash_digest[:6], 16)
            score = 550 + (hash_int % 301)
            
            # Special test number overrides
            if mobile_number.endswith("9999"):
                score = 580
            elif mobile_number.endswith("0000"):
                score = 790

            status_info = self._calculate_indicator(score)
            
            return {
                "success": True,
                "credit_score": score,
                "grade": status_info["grade"],
                "color_code": status_info["color_code"],
                "color_label": status_info["color_label"],
                "provider": "Mock CIBIL Bureau Engine",
                "error": None
            }
        except Exception as e:
            logger.error(f"Error calculating credit score for {mobile_number}: {str(e)}")
            return {
                "success": False,
                "credit_score": 650,
                "grade": "Fair",
                "color_code": "#EAB308",
                "color_label": "yellow",
                "provider": "Mock CIBIL Bureau Engine (Fallback)",
                "error": str(e)
            }

    def _calculate_indicator(self, score: int) -> dict:
        if score >= 750:
            return {"grade": "Excellent", "color_code": "#22C55E", "color_label": "green"}
        elif score >= 700:
            return {"grade": "Good", "color_code": "#3B82F6", "color_label": "blue"}
        elif score >= 650:
            return {"grade": "Fair", "color_code": "#EAB308", "color_label": "yellow"}
        else:
            return {"grade": "Poor", "color_code": "#EF4444", "color_label": "red"}


def get_credit_service() -> BaseCreditService:
    """Factory method to resolve active Credit Bureau Service implementation"""
    provider = os.getenv("CREDIT_SERVICE_PROVIDER", "").lower()
    if provider == "decentro" or (DECENTRO_CLIENT_ID and DECENTRO_CLIENT_SECRET):
        return DecentroCreditBureauService()
    return DecentroCreditBureauService() if os.getenv("FORCE_DECENTRO_SERVICE", "false").lower() in ("true", "1") else MockCibilCreditService()

