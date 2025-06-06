import { ApiResponse, PaginatedResponse } from "../types/common";
import {
  Payment,
  PaymentFormData,
  PaymentFilters,
  PaymentStats,
} from "../types/payment";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const getPayments = async (
  filters: PaymentFilters = {}
): Promise<ApiResponse<PaginatedResponse<Payment>>> => {
  try {
    console.log("[PaymentService] Fetching payments with filters:", filters);

    const params = new URLSearchParams();

    // Add filters to params
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.payment_method)
      params.append("payment_method", filters.payment_method);
    if (filters.loan_id) params.append("loan_id", filters.loan_id.toString());
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);

    const url = `${API_URL}/api/payments${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    console.log("[PaymentService] Request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[PaymentService] Response received:", data);

    return data;
  } catch (error: any) {
    console.error("[PaymentService] Error fetching payments:", error);

    return {
      success: false,
      message: error.message || "Failed to fetch payments",
      data: {
        payments: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages: 0,
      },
    };
  }
};

export const getPayment = async (id: number): Promise<ApiResponse<Payment>> => {
  try {
    console.log("[PaymentService] Fetching payment with ID:", id);

    const response = await fetch(`${API_URL}/api/payments/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[PaymentService] Payment response:", data);

    return data;
  } catch (error: any) {
    console.error("[PaymentService] Error fetching payment:", error);

    return {
      success: false,
      message: error.message || "Failed to fetch payment",
      data: null,
    };
  }
};

export const createPayment = async (
  paymentData: PaymentFormData
): Promise<ApiResponse<Payment>> => {
  try {
    console.log("[PaymentService] Creating payment with data:", paymentData);

    const response = await fetch(`${API_URL}/api/payments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[PaymentService] Payment created:", data);

    return data;
  } catch (error: any) {
    console.error("[PaymentService] Error creating payment:", error);

    return {
      success: false,
      message: error.message || "Failed to create payment",
      data: null,
    };
  }
};

export const updatePayment = async (
  id: number,
  paymentData: Partial<PaymentFormData>
): Promise<ApiResponse<Payment>> => {
  try {
    console.log(
      "[PaymentService] Updating payment ID:",
      id,
      "with data:",
      paymentData
    );

    const response = await fetch(`${API_URL}/api/payments/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[PaymentService] Payment updated:", data);

    return data;
  } catch (error: any) {
    console.error("[PaymentService] Error updating payment:", error);

    return {
      success: false,
      message: error.message || "Failed to update payment",
      data: null,
    };
  }
};

export const deletePayment = async (id: number): Promise<ApiResponse<null>> => {
  try {
    console.log("[PaymentService] Deleting payment ID:", id);

    const response = await fetch(`${API_URL}/api/payments/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[PaymentService] Payment deleted:", data);

    return data;
  } catch (error: any) {
    console.error("[PaymentService] Error deleting payment:", error);

    return {
      success: false,
      message: error.message || "Failed to delete payment",
      data: null,
    };
  }
};

export const getPaymentStats = async (): Promise<ApiResponse<PaymentStats>> => {
  try {
    console.log("[PaymentService] Fetching payment statistics");

    const response = await fetch(`${API_URL}/api/payments/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[PaymentService] Payment stats received:", data);

    return data;
  } catch (error: any) {
    console.error("[PaymentService] Error fetching payment stats:", error);

    return {
      success: false,
      message: error.message || "Failed to fetch payment statistics",
      data: {
        total_payments: 0,
        total_amount: 0,
        completed_payments: 0,
        pending_payments: 0,
        failed_payments: 0,
        average_payment: 0,
      },
    };
  }
};
