import { apiRequest } from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/common";

export interface Loan {
  id: number;
  client_id: number;
  client_name: string;
  client_email: string;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  remaining_balance: number;
  status: "pending" | "approved" | "active" | "paid" | "defaulted" | "rejected";
  purpose: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface LoanStats {
  total_loans: number;
  active_loans: number;
  pending_loans: number;
  completed_loans: number;
  defaulted_loans: number;
  total_amount: number;
  average_amount: number;
  average_interest_rate: number;
}

export interface LoanFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  client_id?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export interface LoanFormData {
  client_id: number;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  purpose: string;
  start_date: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getLoans = async (
  filters: LoanFilters
): Promise<ApiResponse<PaginatedResponse<Loan>>> => {
  try {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.client_id)
      params.append("client_id", filters.client_id.toString());
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);
    if (filters.sort_by) params.append("sort_by", filters.sort_by);
    if (filters.sort_order) params.append("sort_order", filters.sort_order);

    const response = await apiRequest(`/api/loans?${params.toString()}`);
    return response;
  } catch (error) {
    console.error("Error fetching loans:", error);
    throw error;
  }
};

export const getActiveLoans = async (): Promise<ApiResponse<Loan[]>> => {
  try {
    console.log("Making request to:", `${API_URL}/api/loans/active`); // Debug log

    const response = await fetch(`${API_URL}/api/loans/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    console.log("Response status:", response.status); // Debug log

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", errorData); // Debug log
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Active loans response data:", data); // Debug log

    return data;
  } catch (error) {
    console.error("Error fetching active loans:", error);
    throw error;
  }
};

export const getLoanById = async (
  id: number
): Promise<ApiResponse<{ loan: Loan; payments: any[] }>> => {
  try {
    const response = await apiRequest(`/api/loans/${id}`);
    return response;
  } catch (error) {
    console.error("Error fetching loan:", error);
    throw error;
  }
};

export const createLoan = async (
  data: LoanFormData
): Promise<ApiResponse<Loan>> => {
  try {
    const response = await apiRequest("/api/loans", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    console.error("Error creating loan:", error);
    throw error;
  }
};

export const updateLoan = async (
  id: number,
  data: Partial<LoanFormData>
): Promise<ApiResponse<Loan>> => {
  try {
    const response = await apiRequest(`/api/loans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    console.error("Error updating loan:", error);
    throw error;
  }
};

export const deleteLoan = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await apiRequest(`/api/loans/${id}`, {
      method: "DELETE",
    });
    return response;
  } catch (error) {
    console.error("Error deleting loan:", error);
    throw error;
  }
};

export const approveLoan = async (
  id: number,
  data: {
    approved_amount: number;
    notes: string;
    action: "approve" | "reject";
  }
): Promise<ApiResponse<Loan>> => {
  try {
    const response = await apiRequest(`/api/loans/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    console.error("Error approving loan:", error);
    throw error;
  }
};

export const getLoanStats = async (): Promise<ApiResponse<LoanStats>> => {
  try {
    const response = await apiRequest("/api/loans/stats");
    return response;
  } catch (error) {
    console.error("Error fetching loan stats:", error);
    throw error;
  }
};
