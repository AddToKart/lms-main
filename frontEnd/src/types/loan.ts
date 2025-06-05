export interface Loan {
  id: number;
  client_id: number;
  client_name?: string;
  client_email?: string;
  loan_amount: number;
  approved_amount?: number;
  remaining_balance?: number; // Added this line
  interest_rate: number;
  term_months: number;
  purpose?: string;
  start_date?: string;
  status: "pending" | "active" | "completed" | "overdue" | "rejected";
  created_at: string;
  updated_at?: string;
  approval_date?: string;
  approval_notes?: string;
  approved_by?: number;
}

export interface LoanFormData {
  client_id: number;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  purpose: string;
  start_date: string;
  status: string;
  approved_amount?: number;
}

export interface LoanFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface LoanStats {
  total_loans: number;
  total_loan_amount: number;
  active_loans: number;
  average_interest_rate: number;
  completed_loans: number;
  pending_loans: number;
  overdue_loans: number;
}
