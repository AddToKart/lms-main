import { ApiResponse, PaginatedResponse } from "../types/common";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface Loan {
  id: number;
  client_id: number;
  client_name?: string;
  loan_amount: number;
  approved_amount?: number;
  installment_amount?: number;
  interest_rate: number;
  term_months: number;
  purpose?: string;
  start_date?: string;
  end_date?: string;
  status:
    | "pending"
    | "approved"
    | "active"
    | "paid_off"
    | "defaulted"
    | "rejected"
    | "completed"
    | "overdue";
  next_due_date?: string;
  payment_frequency?: string;
  remaining_balance?: number;
  approval_date?: string;
  approval_notes?: string;
  approved_by?: number;
  created_at: string;
  updated_at: string;
}

export interface LoanFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  client_id?: number;
}

export interface LoanFormData {
  client_id: number;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  purpose?: string;
  start_date?: string;
  status?: string;
  approved_amount?: number;
}

export interface LoanStats {
  total_loans: number;
  total_loan_amount: number;
  active_loans: number;
  average_interest_rate: number;
  completed_loans: number;
  pending_loans: number;
  overdue_loans: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const getLoans = async (
  filters: LoanFilters = {}
): Promise<ApiResponse<PaginatedResponse<Loan>>> => {
  try {
    console.log("[LoanService] Fetching loans with filters:", filters);

    const params = new URLSearchParams();

    // Add filters to params
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.client_id)
      params.append("client_id", filters.client_id.toString());

    const url = `${API_URL}/api/loans${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    console.log("[LoanService] Request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LoanService] Response received:", data);

    return data;
  } catch (error: any) {
    console.error("[LoanService] Error fetching loans:", error);

    // Return a structured error response
    return {
      success: false,
      message: error.message || "Failed to fetch loans",
      data: {
        loans: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages: 0,
      },
    };
  }
};

export const getLoan = async (id: number): Promise<ApiResponse<Loan>> => {
  try {
    console.log("[LoanService] Fetching loan with ID:", id);

    const response = await fetch(`${API_URL}/api/loans/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LoanService] Loan response:", data);

    return data;
  } catch (error: any) {
    console.error("[LoanService] Error fetching loan:", error);

    return {
      success: false,
      message: error.message || "Failed to fetch loan",
      data: null,
    };
  }
};

export const createLoan = async (
  loanData: LoanFormData
): Promise<ApiResponse<Loan>> => {
  try {
    console.log("[LoanService] Creating loan with data:", loanData);

    const response = await fetch(`${API_URL}/api/loans`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(loanData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LoanService] Loan created:", data);

    return data;
  } catch (error: any) {
    console.error("[LoanService] Error creating loan:", error);

    return {
      success: false,
      message: error.message || "Failed to create loan",
      data: null,
    };
  }
};

export const updateLoan = async (
  id: number,
  loanData: Partial<LoanFormData>
): Promise<ApiResponse<Loan>> => {
  try {
    console.log("[LoanService] Updating loan ID:", id, "with data:", loanData); // This log is seen in screenshot
    const response = await fetch(`${API_URL}/api/loans/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(loanData),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "[LoanService] Update loan error response body:",
        errorBody
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LoanService] Loan updated:", data);

    return data;
  } catch (error: any) {
    console.error("[LoanService] Error updating loan:", error);

    return {
      success: false,
      message: error.message || "Failed to update loan",
      data: null,
    };
  }
};

export const deleteLoan = async (id: number): Promise<ApiResponse<null>> => {
  try {
    console.log("[LoanService] Deleting loan ID:", id);

    const response = await fetch(`${API_URL}/api/loans/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LoanService] Loan deleted:", data);

    return data;
  } catch (error: any) {
    console.error("[LoanService] Error deleting loan:", error);

    return {
      success: false,
      message: error.message || "Failed to delete loan",
      data: null,
    };
  }
};

export const getLoanStats = async (): Promise<ApiResponse<LoanStats>> => {
  try {
    const response = await fetch(`${API_URL}/api/loans/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "[LoanService] Get loan stats error response body:",
        errorBody
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponseData = await response.json(); // This is ApiResponse<LoanStats>
    console.log("[LoanService] Loan stats received:", apiResponseData);

    if (apiResponseData && apiResponseData.success && apiResponseData.data) {
      const backendStats = apiResponseData.data as any; // Cast to any to access potentially non-typed fields before conversion

      // Ensure all numeric fields are numbers, defaulting to 0 if null, undefined, or NaN after conversion
      const parsedAvgInterestRate = Number(backendStats.average_interest_rate);

      const numericStats: LoanStats = {
        total_loans: Number(backendStats.total_loans || 0),
        total_loan_amount: Number(backendStats.total_loan_amount || 0),
        active_loans: Number(backendStats.active_loans || 0),
        average_interest_rate: isNaN(parsedAvgInterestRate)
          ? 0
          : parsedAvgInterestRate,
        completed_loans: Number(backendStats.completed_loans || 0),
        pending_loans: Number(backendStats.pending_loans || 0),
        overdue_loans: Number(backendStats.overdue_loans || 0),
      };
      return { success: true, data: numericStats };
    } else if (apiResponseData && apiResponseData.success === false) {
      return {
        success: false,
        message:
          apiResponseData.message ||
          "Failed to fetch loan stats due to server error.",
        data: null,
      };
    } else {
      console.error(
        "[LoanService] Unexpected loan stats data structure:",
        apiResponseData
      );
      throw new Error("Unexpected data structure for loan stats.");
    }
  } catch (error: any) {
    console.error("[LoanService] Error fetching loan stats:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch loan stats",
      data: null,
    };
  }
};

export const approveLoan = async (
  id: number,
  approvalData: { approved_amount: number; notes?: string }
): Promise<ApiResponse<Loan>> => {
  try {
    // Corrected log message for approveLoan
    console.log(
      "[LoanService] Attempting to APPROVE loan ID:",
      id,
      "with approval data:",
      approvalData
    );
    const response = await fetch(`${API_URL}/api/loans/${id}/approve`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(approvalData),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "[LoanService] Approve loan error response body:",
        errorBody
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LoanService] Loan approved successfully via service:", data);

    return data;
  } catch (error: any) {
    console.error(
      "[LoanService] Error in service while approving loan:",
      error
    );

    return {
      success: false,
      message: error.message || "Failed to approve loan via service",
      data: null,
    };
  }
};

export const rejectLoan = async (
  id: number,
  rejectionData: { notes?: string }
): Promise<ApiResponse<Loan>> => {
  try {
    // Corrected log message for rejectLoan
    console.log(
      "[LoanService] Attempting to REJECT loan ID:",
      id,
      "with rejection data:",
      rejectionData
    );
    const response = await fetch(`${API_URL}/api/loans/${id}/reject`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(rejectionData),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "[LoanService] Reject loan error response body:",
        errorBody
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LoanService] Loan rejected successfully via service:", data);

    return data;
  } catch (error: any) {
    console.error(
      "[LoanService] Error in service while rejecting loan:",
      error
    );

    return {
      success: false,
      message: error.message || "Failed to reject loan via service",
      data: null,
    };
  }
};

export const getClientsWithLoans = async (
  filters: LoanFilters = {}
): Promise<ApiResponse<PaginatedResponse<Loan>>> => {
  try {
    console.log("[LoanService] Fetching clients with loans, filters:", filters);

    const params = new URLSearchParams();

    // Add filters to params
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.client_id)
      params.append("client_id", filters.client_id.toString());

    const url = `${API_URL}/api/loans/clients${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    console.log("[LoanService] Request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LoanService] Clients with loans response received:", data);

    return data;
  } catch (error: any) {
    console.error("[LoanService] Error fetching clients with loans:", error);

    // Return a structured error response
    return {
      success: false,
      message: error.message || "Failed to fetch clients with loans",
      data: {
        loans: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages: 0,
      },
    };
  }
};

export const getLoanById = async (id: number): Promise<ApiResponse<Loan>> => {
  try {
    console.log("[LoanService] Fetching loan with ID:", id);

    const response = await fetch(`${API_URL}/api/loans/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[LoanService] Loan response:", data);

    return data;
  } catch (error: any) {
    console.error("[LoanService] Error fetching loan:", error);

    return {
      success: false,
      message: error.message || "Failed to fetch loan",
      data: null,
    };
  }
};
