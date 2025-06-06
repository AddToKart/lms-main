import { apiRequest, ApiResponse } from "./api";

export interface LoanSummaryData {
  month: string;
  new_loans: number;
  total_amount: number;
  avg_interest: number;
  approved_amount: number;
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
  loan_amount: number;
  amount_due: number;
  next_due_date: string;
  days_overdue: number;
  interest_rate: number;
  overdue_severity: string;
}

export interface LoanAnalytics {
  total_active_loans: number;
}

// Get loan summary report
export const getLoanSummaryReport = async (
  dateFrom?: string,
  dateTo?: string
): Promise<ApiResponse<LoanSummaryData[]>> => {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);

    const queryString = params.toString();
    const url = queryString
      ? `/api/reports/loan-summary?${queryString}`
      : "/api/reports/loan-summary";

    // Assuming apiRequest resolves to ApiResponse<T> structure on success, despite broader type hint
    return (await apiRequest<LoanSummaryData[]>(url)) as ApiResponse<
      LoanSummaryData[]
    >;
  } catch (error) {
    console.error("Error fetching loan summary report:", error);
    throw error;
  }
};

// Get payment history report
export const getPaymentHistoryReport = async (
  dateFrom?: string,
  dateTo?: string
): Promise<ApiResponse<PaymentHistoryData[]>> => {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);

    const queryString = params.toString();
    const url = queryString
      ? `/api/reports/payment-history?${queryString}`
      : "/api/reports/payment-history";

    // Assuming apiRequest resolves to ApiResponse<T> structure on success, despite broader type hint
    return (await apiRequest<PaymentHistoryData[]>(url)) as ApiResponse<
      PaymentHistoryData[]
    >;
  } catch (error) {
    console.error("Error fetching payment history report:", error);
    throw error;
  }
};

// Get overdue loans report
export const getOverdueLoansReport = async (): Promise<
  ApiResponse<OverdueLoanData[]>
> => {
  try {
    // Assuming apiRequest resolves to ApiResponse<T> structure on success, despite broader type hint
    return (await apiRequest<OverdueLoanData[]>(
      "/api/reports/overdue-loans"
    )) as ApiResponse<OverdueLoanData[]>;
  } catch (error) {
    console.error("Error fetching overdue loans report:", error);
    throw error;
  }
};

// Get loan analytics
export const getLoanAnalytics = async (): Promise<
  ApiResponse<LoanAnalytics>
> => {
  try {
    // Assuming apiRequest resolves to ApiResponse<T> structure on success, despite broader type hint
    return (await apiRequest<LoanAnalytics>(
      "/api/reports/loan-analytics"
    )) as ApiResponse<LoanAnalytics>;
  } catch (error) {
    console.error("Error fetching loan analytics:", error);
    throw error;
  }
};

// Export report function
export const exportReport = async (
  reportType: "loanSummary" | "paymentHistory" | "overdueLoans",
  format: "excel" | "csv" | "json" = "excel",
  dateFrom?: string,
  dateTo?: string
): Promise<void> => {
  try {
    const params = new URLSearchParams();
    params.append("type", reportType);
    params.append("format", format);
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);

    // Get the API URL
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const response = await fetch(
      `${API_URL}/api/reports/export?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Handle file downloads for excel and csv formats
    if (format === "excel" || format === "csv") {
      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `${reportType}_report_${
        new Date().toISOString().split("T")[0]
      }.${format === "excel" ? "xlsx" : "csv"}`;

      // Extract filename from content-disposition header if available
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      // Handle JSON response
      const data = await response.json();
      console.log("Export data:", data);
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    throw error;
  }
};
