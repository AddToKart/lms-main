import { apiRequest } from "./api";
import type {
  Payment,
  PaymentFormData,
  PaymentFilters,
  ApiResponse,
  PaginatedResponse,
  PaymentMutationResponseData,
} from "../types/payment";

export const getPayments = async (
  filters: PaymentFilters,
  signal?: AbortSignal // Added signal
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

    const response = await apiRequest<PaginatedResponse<Payment>>(
      `/api/payments?${params.toString()}`,
      { signal }
    ); // Pass signal
    if (response instanceof Response) {
      // This should ideally not happen for this endpoint if it's always JSON
      throw new Error(
        "Unexpected raw Response object received for getPayments."
      );
    }
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      // Logged in api.ts, react-query will handle this state
      // console.log('Get payments request aborted');
    } else {
      console.error("Error fetching payments:", error);
    }
    throw error; // Re-throw for react-query or other callers to handle
  }
};

export const getPaymentById = async (
  id: number,
  signal?: AbortSignal // Added signal
): Promise<ApiResponse<Payment>> => {
  try {
    const response = await apiRequest<Payment>(`/api/payments/${id}`, {
      signal,
    }); // Pass signal
    if (response instanceof Response) {
      throw new Error(
        "Unexpected raw Response object received for getPaymentById."
      );
    }
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      // console.log('Get payment by ID request aborted');
    } else {
      console.error("Error fetching payment:", error);
    }
    throw error;
  }
};

export const createPayment = async (
  data: PaymentFormData
): Promise<ApiResponse<PaymentMutationResponseData>> => {
  try {
    const response = await apiRequest<PaymentMutationResponseData>(
      "/api/payments",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    if (response instanceof Response) {
      throw new Error(
        "Unexpected raw Response object received for createPayment."
      );
    }
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      // console.log('Create payment request aborted');
    } else {
      console.error("Error creating payment:", error);
    }
    throw error;
  }
};

export const updatePayment = async (
  id: number,
  data: Partial<PaymentFormData>
): Promise<ApiResponse<PaymentMutationResponseData>> => {
  try {
    const response = await apiRequest<PaymentMutationResponseData>(
      `/api/payments/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    if (response instanceof Response) {
      throw new Error(
        "Unexpected raw Response object received for updatePayment."
      );
    }
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      // console.log('Update payment request aborted');
    } else {
      console.error("Error updating payment:", error);
    }
    throw error;
  }
};

export const deletePayment = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await apiRequest<void>(`/api/payments/${id}`, {
      method: "DELETE",
    });
    if (response instanceof Response) {
      throw new Error(
        "Unexpected raw Response object received for deletePayment."
      );
    }
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      // console.log('Delete payment request aborted');
    } else {
      console.error("Error deleting payment:", error);
    }
    throw error;
  }
};

export const getPaymentStats = async (
  signal?: AbortSignal
): Promise<ApiResponse<any>> => {
  // Added signal
  try {
    const response = await apiRequest<any>("/api/payments/stats", { signal }); // Pass signal
    if (response instanceof Response) {
      throw new Error(
        "Unexpected raw Response object received for getPaymentStats."
      );
    }
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      // console.log('Get payment stats request aborted');
    } else {
      console.error("Error fetching payment stats:", error);
    }
    throw error;
  }
};
