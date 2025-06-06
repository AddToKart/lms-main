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
          "Content-Type": "application/json",
        },
        // Add timeout and retry logic
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }
    );

    console.log("Export response status:", response.status);

    if (!response.ok) {
      let errorMessage = `Export failed with status ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }

      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        throw new Error("Authentication expired. Please log in again.");
      }

      throw new Error(errorMessage);
    }

    // Get the content disposition header to extract filename
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
      // Add proper extension based on format
      switch (format.toLowerCase()) {
        case "excel":
        case "xlsx":
          filename += ".xlsx";
          break;
        case "csv":
          filename += ".csv";
          break;
        case "json":
          filename += ".json";
          break;
      }
    }

    // Handle different content types
    const contentType = response.headers.get("content-type") || "";
    let blob: Blob;

    if (contentType.includes("application/json")) {
      const jsonData = await response.json();
      blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json",
      });
    } else if (contentType.includes("text/csv")) {
      const csvData = await response.text();
      blob = new Blob([csvData], {
        type: "text/csv",
      });
    } else {
      // For Excel files and other binary formats
      const arrayBuffer = await response.arrayBuffer();
      blob = new Blob([arrayBuffer], {
        type:
          contentType ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }

    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    window.URL.revokeObjectURL(url);

    console.log(`Successfully exported ${reportType} as ${format}`);
  } catch (error: any) {
    console.error("Export error:", error);

    // Handle specific error types
    if (error.name === "AbortError") {
      throw new Error("Export request timed out. Please try again.");
    } else if (error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to server. Please check your connection and try again."
      );
    } else {
      throw new Error(
        error.message || "An unexpected error occurred during export."
      );
    }
  }
};
