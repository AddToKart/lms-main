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
      throw new Error("No authentication token found. Please log in again.");
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const params = new URLSearchParams({
      type: reportType,
      format: format,
      date_from: dateFrom,
      date_to: dateTo,
    });

    console.log(`Exporting ${reportType} as ${format}...`);

    const response = await fetch(
      `${API_URL}/api/reports/export?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(30000),
      }
    );

    console.log("Export response status:", response.status);

    if (!response.ok) {
      let errorMessage = `Export failed with status ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        errorMessage = response.statusText || errorMessage;
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        throw new Error("Authentication expired. Please log in again.");
      }

      throw new Error(errorMessage);
    }

    // Handle file download for Excel/CSV
    if (format === "excel" || format === "csv") {
      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `${reportType}_export_${
        new Date().toISOString().split("T")[0]
      }`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      } else {
        filename += format === "excel" ? ".xlsx" : ".csv";
      }

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log(`File downloaded: ${filename}`);
    } else {
      // Handle JSON response
      const data = await response.json();
      console.log("Export data:", data);
    }
  } catch (error: any) {
    console.error("Export error:", error);

    if (error.name === "AbortError") {
      throw new Error("Export request timed out. Please try again.");
    }

    throw error;
  }
};

export const exportLoanSummary = async (
  format: "excel" | "csv" = "excel",
  dateFrom?: string,
  dateTo?: string,
  signal?: AbortSignal
): Promise<ApiResponse<any>> => {
  try {
    console.log("[ReportService] Exporting loan summary:", {
      format,
      dateFrom,
      dateTo,
    });

    const params = new URLSearchParams();
    params.append("format", format);
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);

    const url = `${API_URL}/api/reports/export?type=loanSummary&${params.toString()}`;
    console.log("[ReportService] Export URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[ReportService] Export failed:",
        response.status,
        errorText
      );
      throw new Error(`Export failed: ${response.status} - ${errorText}`);
    }

    if (format === "excel") {
      // Handle Excel file download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `loan_summary_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return {
        success: true,
        message: "File downloaded successfully",
        data: null,
      };
    } else {
      // Handle JSON response
      const data = await response.json();
      return data;
    }
  } catch (error: any) {
    console.error("[ReportService] Error exporting loan summary:", error);

    if (error.name === "AbortError") {
      throw error;
    }

    return {
      success: false,
      message: error.message || "Failed to export loan summary",
      data: null,
    };
  }
};
