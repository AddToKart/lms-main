export interface Payment {
  id: number;
  loan_id: number;
  client_id?: number; // Added client_id, as it's useful for various operations
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  status: "pending" | "completed" | "failed";
  processed_by?: number;
  client_name?: string;
  client_email?: string;
  loan_amount?: number;
  processed_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payment_method?: string;
  loan_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface PaymentFormData {
  loan_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

export interface PaymentStats {
  total_payments: number;
  total_amount: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  average_payment: number;
}

export interface PaymentMutationResponseData {
  message: string;
  paymentId?: number; // For createPayment response (camelCase from backend controller)
  payment_id?: number; // For updatePayment response (snake_case from backend controller)
  loan_id: number;
  client_id: number;
  new_remaining_balance?: number;
  new_status?: string;
  new_next_due_date?: string | null;
  success?: boolean; // Typically from update/delete responses
}

export type { ApiResponse, PaginatedResponse } from "./common";
