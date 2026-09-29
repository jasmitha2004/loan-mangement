import logging
from typing import Dict, Any, List, Tuple
from django.db.models import Q
from .models import BRERule, OperatorChoices

logger = logging.getLogger(__name__)

class BREEngine:
    """
    Dynamic Business Rule Engine.
    Evaluates database-stored BRERule instances against a context payload dynamically.
    No hardcoded logic for rule evaluation.
    """

    @classmethod
    def evaluate(cls, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates active rules ordered by priority against given context dict.
        Returns evaluation summary including status, rejection reasons, and detailed results.
        """
        context_loan_type = context.get('loan_type', '').strip()
        if context_loan_type:
            rule_filter = Q(loan_type='ALL') | Q(loan_type__iexact=context_loan_type) | Q(loan_type='')
            active_rules = BRERule.objects.filter(rule_filter, is_active=True).order_by('priority', 'id')
        else:
            active_rules = BRERule.objects.filter(is_active=True).order_by('priority', 'id')
        rejection_reasons: List[str] = []
        rule_evaluations: List[Dict[str, Any]] = []

        for rule in active_rules:
            field_name = rule.field.strip()
            val_in_context = context.get(field_name)

            passed, details = cls._evaluate_single_rule(rule, val_in_context)

            rule_evaluations.append({
                "rule_id": rule.id,
                "rule_name": rule.rule_name,
                "field": field_name,
                "operator": rule.operator,
                "target_value": rule.value,
                "actual_value": val_in_context,
                "passed": passed,
                "error_message": rule.error_message if not passed else None
            })

            if not passed:
                rejection_reasons.append(rule.error_message)

        is_eligible = len(rejection_reasons) == 0

        return {
            "eligible": is_eligible,
            "status": "Eligible" if is_eligible else "Rejected",
            "rejection_reasons": rejection_reasons,
            "rule_evaluations": rule_evaluations
        }

    @classmethod
    def _evaluate_single_rule(cls, rule: BRERule, actual_value: Any) -> Tuple[bool, str]:
        if actual_value is None:
            return False, f"Missing field '{rule.field}' in application data"

        op = rule.operator
        target_str = str(rule.value).strip()

        try:
            # Handle numeric vs string comparison based on actual value type
            if isinstance(actual_value, (int, float)):
                return cls._evaluate_numeric(op, float(actual_value), target_str)
            else:
                return cls._evaluate_string(op, str(actual_value).strip(), target_str)
        except Exception as e:
            logger.error(f"Rule evaluation error for rule '{rule.rule_name}': {str(e)}")
            return False, f"Rule evaluation error: {str(e)}"

    @classmethod
    def _evaluate_numeric(cls, op: str, actual: float, target_str: str) -> Tuple[bool, str]:
        if op == OperatorChoices.GREATER_THAN:
            target = float(target_str)
            return actual > target, ""
        elif op == OperatorChoices.LESS_THAN:
            target = float(target_str)
            return actual < target, ""
        elif op == OperatorChoices.GREATER_EQUAL:
            target = float(target_str)
            return actual >= target, ""
        elif op == OperatorChoices.LESS_EQUAL:
            target = float(target_str)
            return actual <= target, ""
        elif op == OperatorChoices.EQUAL:
            target = float(target_str)
            return actual == target, ""
        elif op == OperatorChoices.NOT_EQUAL:
            target = float(target_str)
            return actual != target, ""
        elif op == OperatorChoices.BETWEEN:
            # Expecting 'min,max' format e.g., '21,60'
            parts = [float(p.strip()) for p in target_str.split(',')]
            if len(parts) != 2:
                return False, "BETWEEN operator requires format 'min,max'"
            min_val, max_val = parts[0], parts[1]
            return min_val <= actual <= max_val, ""
        elif op == OperatorChoices.IN:
            # Expecting comma separated values e.g. '10,20,30'
            allowed_nums = [float(p.strip()) for p in target_str.split(',')]
            return actual in allowed_nums, ""
        else:
            return False, f"Unsupported operator '{op}'"

    @classmethod
    def _evaluate_string(cls, op: str, actual: str, target_str: str) -> Tuple[bool, str]:
        if op == OperatorChoices.EQUAL:
            return actual.lower() == target_str.lower(), ""
        elif op == OperatorChoices.NOT_EQUAL:
            return actual.lower() != target_str.lower(), ""
        elif op == OperatorChoices.IN:
            allowed_list = [p.strip().lower() for p in target_str.split(',')]
            return actual.lower() in allowed_list, ""
        else:
            return False, f"Operator '{op}' not supported for string fields"
