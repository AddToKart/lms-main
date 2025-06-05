import { apiRequest } from "./api";
import type {
  Payment,
  PaymentFormData,
  PaymentFilters,
  ApiResponse,
  PaginatedResponse,
} from "../types/payment";

export const getPayments = async (
  filters: PaymentFilters
): Promise<ApiResponse<PaginatedResponse<Payment>>> => {
  try {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.payment_method)
      params.append("payment_method", filters.payment_method);
    if (filters.loan_id) params.append("loan_id", filters.loan_id.toString());
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);

    const response = await apiRequest(`/api/payments?${params.toString()}`);
    return response;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error;
  }
};

export const getPaymentById = async (
  id: number
): Promise<ApiResponse<Payment>> => {
  try {
    const response = await apiRequest(`/api/payments/${id}`);
    return response;
  } catch (error) {
    console.error("Error fetching payment:", error);
    throw error;
  }
};

export const createPayment = async (
  data: PaymentFormData
): Promise<ApiResponse<Payment>> => {
  try {
    const response = await apiRequest("/api/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const updatePayment = async (
  id: number,
  data: Partial<PaymentFormData>
): Promise<ApiResponse<Payment>> => {
  try {
    const response = await apiRequest(`/api/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    console.error("Error updating payment:", error);
    throw error;
  }
};

export const deletePayment = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await apiRequest(`/api/payments/${id}`, {
      method: "DELETE",
    });
    return response;
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};

export const getPaymentStats = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await apiRequest("/api/payments/stats");
    return response;
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    throw error;
  }
};
