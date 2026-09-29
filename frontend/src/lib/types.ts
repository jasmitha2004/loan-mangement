export interface Customer {
  id: number;
  full_name: string;
  mobile_number: string;
  email: string;
  pan_number?: string;
  aadhaar_number?: string;
  date_of_birth: string;
  city: string;
  state: string;
  pincode: string;
  consent_accepted: boolean;
  age?: number;
}

export interface Lead {
  id: number;
  customer: Customer;
  loan_type: string;
  employment_type: string;
  monthly_income: number;
  loan_amount: number;
  property_value: number;
  loan_to_value_ratio: number;
  credit_score: number;
  credit_grade: string;
  credit_color_code: string;
  bre_status: 'Eligible' | 'Rejected' | 'Pending';
  rejection_reasons: string[];
  rule_evaluations?: any[];
  assigned_to?: string;
  status_note?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BRERule {
  id?: number;
  rule_name: string;
  loan_type?: string;
  field: string;
  operator: string;
  value: string;
  error_message: string;
  priority: number;
  is_active: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'LOAN_MANAGER' | 'SALES_EXECUTIVE' | 'READ_ONLY';
  full_name: string;
}

export interface LeadApplicationPayload {
  full_name: string;
  mobile_number: string;
  email: string;
  pan_number: string;
  aadhaar_number: string;
  date_of_birth: string;
  city: string;
  state: string;
  pincode: string;
  consent_accepted: boolean;
  loan_type: string;
  employment_type: string;
  monthly_income: number;
  loan_amount: number;
  property_value: number;
}
