import { apiRequest, ApiResponse } from "./api";

export interface LoanSummaryData {
  month: string;
  new_loans: number;
  total_amount: number;
  avg_interest: number;
  approved_amount: number;
  approved_count: number;
  rejected_count: number;
}

export interface ClientSummaryData {
  id: number;
  name: string;
  email: string;
  phone: string;
  total_loans: number;
  active_loans: number;
  total_borrowed: number;
  current_balance: number;
  total_payments: number;
  payment_status: string;
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

export interface DashboardAnalytics {
  overall_stats: {
    total_active_loans: number;
    total_outstanding: number;
    total_active_clients: number;
    monthly_collections: number;
  };
  monthly_performance: Array<{
    month: string;
    collected: number;
    active_clients: number;
    payment_count: number;
  }>;
  loan_status_distribution: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
}

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

    const response = await apiRequest<LoanSummaryData[]>(url);
    if (response instanceof Response) {
      console.error("API request returned raw Response for JSON endpoint (getLoanSummaryReport):", url);
      throw new Error("Unexpected response format from API.");
    }
    return response;
  } catch (error) {
    console.error("Error fetching loan summary report:", error);
    throw error;
  }
};

export const getClientSummaryReport = async (): Promise<
  ApiResponse<ClientSummaryData[]>
> => {
  try {
    const response = await apiRequest<ClientSummaryData[]>("/api/reports/client-summary");
    if (response instanceof Response) {
      console.error("API request returned raw Response for JSON endpoint (getClientSummaryReport):");
      throw new Error("Unexpected response format from API.");
    }
    return response;
  } catch (error) {
    console.error("Error fetching client summary report:", error);
    throw error;
  }
};

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

    const response = await apiRequest<PaymentHistoryData[]>(url);
    if (response instanceof Response) {
      console.error("API request returned raw Response for JSON endpoint (getPaymentHistoryReport):", url);
      throw new Error("Unexpected response format from API.");
    }
    return response;
  } catch (error) {
    console.error("Error fetching payment history report:", error);
    throw error;
  }
};

export const getOverdueLoansReport = async (): Promise<
  ApiResponse<OverdueLoanData[]>
> => {
  try {
    const response = await apiRequest<OverdueLoanData[]>("/api/reports/overdue-loans");
    if (response instanceof Response) {
      console.error("API request returned raw Response for JSON endpoint (getOverdueLoansReport):");
      throw new Error("Unexpected response format from API.");
    }
    return response;
  } catch (error) {
    console.error("Error fetching overdue loans report:", error);
    throw error;
  }
};

export const getDashboardAnalytics = async (): Promise<
  ApiResponse<DashboardAnalytics>
> => {
  try {
    const response = await apiRequest<DashboardAnalytics>("/api/reports/dashboard-analytics");
    if (response instanceof Response) {
      console.error("API request returned raw Response for JSON endpoint (getDashboardAnalytics):");
      throw new Error("Unexpected response format from API.");
    }
    return response;
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    throw error;
  }
};

export const exportReport = async (
  type: "loan_summary" | "client_summary" | "payment_history" | "overdue_loans",
  format: "json" | "excel" = "json" // Changed csv to excel
): Promise<ApiResponse<any> | Response> => { // Adjusted return type
  try {
    const response = await apiRequest(
      `/api/reports/export?type=${type}&format=${format}`
    );
    return response;
  } catch (error) {
    console.error("Error exporting report:", error);
    throw error;
  }
};
