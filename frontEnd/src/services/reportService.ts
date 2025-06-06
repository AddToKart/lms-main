import { apiRequest } from "./api";
import type { ApiResponse } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Data type interfaces
export interface LoanSummaryData {
  month: string;
  new_loans: number;
  total_amount: number;
  avg_interest: number;
  approved_count: number;
  rejected_count: number;
  total_principal_repaid: number;
  total_interest_repaid: number;
  fully_paid_loans_count: number;
  avg_loan_term_months: number;
}

export interface PaymentHistoryData {
  date: string;
  total_payments: number;
  total_amount: number;
  on_time_payments: number;
  late_payments: number;
  avg_payment_amount: number;
}

export interface OverdueLoanData {
  id: number;
  client_name: string;
  phone: string;
  email: string;
  days_overdue: number;
  amount_due: number;
  loan_amount: number;
  overdue_severity: "Mild" | "Moderate" | "Severe";
}

export interface LoanAnalytics {
  total_active_loans: number;
  total_outstanding: number;
  monthly_collections: number;
  average_loan_amount: number;
}

// Service functions
export const getLoanSummaryReport = async (
  dateFrom: string,
  dateTo: string,
  signal?: AbortSignal
): Promise<ApiResponse<LoanSummaryData[]>> => {
  try {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
    });

    const response = await apiRequest<LoanSummaryData[]>(
      `/api/reports/loan-summary?${params.toString()}`,
      { signal }
    );

    if (response instanceof Response) {
      throw new Error(
        "Expected ApiResponse, got raw Response for getLoanSummaryReport"
      );
    }

    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Loan summary report request was cancelled");
    } else {
      console.error("Error fetching loan summary report:", error);
    }
    throw error;
  }
};

export const getPaymentHistoryReport = async (
  dateFrom: string,
  dateTo: string,
  signal?: AbortSignal
): Promise<ApiResponse<PaymentHistoryData[]>> => {
  try {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
    });

    const response = await apiRequest<PaymentHistoryData[]>(
      `/api/reports/payment-history?${params.toString()}`,
      { signal }
    );

    if (response instanceof Response) {
      throw new Error(
        "Expected ApiResponse, got raw Response for getPaymentHistoryReport"
      );
    }

    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Payment history report request was cancelled");
    } else {
      console.error("Error fetching payment history report:", error);
    }
    throw error;
  }
};

export const getOverdueLoansReport = async (
  signal?: AbortSignal
): Promise<ApiResponse<OverdueLoanData[]>> => {
  try {
    const response = await apiRequest<OverdueLoanData[]>(
      `/api/reports/overdue-loans`,
      { signal }
    );

    if (response instanceof Response) {
      throw new Error(
        "Expected ApiResponse, got raw Response for getOverdueLoansReport"
      );
    }

    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Overdue loans report request was cancelled");
    } else {
      console.error("Error fetching overdue loans report:", error);
    }
    throw error;
  }
};

export const getLoanAnalytics = async (
  dateFrom: string,
  dateTo: string,
  signal?: AbortSignal
): Promise<ApiResponse<LoanAnalytics>> => {
  try {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
    });

    const response = await apiRequest<LoanAnalytics>(
      `/api/reports/loan-analytics?${params.toString()}`,
      { signal }
    );

    if (response instanceof Response) {
      throw new Error(
        "Expected ApiResponse, got raw Response for getLoanAnalytics"
      );
    }

    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Loan analytics request was cancelled");
    } else {
      console.error("Error fetching loan analytics:", error);
    }
    throw error;
  }
};

export const exportReport = async (
  reportType: string,
  format: "excel" | "json" | "csv",
  dateFrom: string,
  dateTo: string
): Promise<void> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const params = new URLSearchParams({
      report_type: reportType,
      format,
      date_from: dateFrom,
      date_to: dateTo,
    });

    const response = await fetch(
      `${API_URL}/api/reports/export?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Export failed: ${response.status}`);
    }

    // Handle file download
    const blob = await response.blob();
    const filename =
      response.headers
        .get("Content-Disposition")
        ?.split("filename=")[1]
        ?.replace(/"/g, "") ||
      `${reportType}_${format}_${
        new Date().toISOString().split("T")[0]
      }.${format}`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error: any) {
    console.error("Error exporting report:", error);
    throw error;
  }
};
