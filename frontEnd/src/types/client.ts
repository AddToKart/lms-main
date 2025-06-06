export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  id_type?: string;
  id_number?: string;
  status: "active" | "inactive" | "blacklisted";
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  id_type: string;
  id_number: string;
  status: "active" | "inactive" | "blacklisted";
}

export interface ClientFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "" | "active" | "inactive" | "blacklisted";
}

export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  blacklisted: number;
}

export interface ClientResponse {
  success: boolean;
  message: string;
  data: Client;
}

export interface ClientsResponse {
  success: boolean;
  message: string;
  data: {
    clients: Client[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  };
}

// Add the missing response types
export interface ClientListResponse extends ClientsResponse {}
export interface ClientCreateResponse extends ClientResponse {}
export interface ClientUpdateResponse extends ClientResponse {}
export interface ClientDeleteResponse {
  success: boolean;
  message: string;
}

// Interfaces for Client Details View

export interface ClientDetailsData {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  id_type?: string;
  id_number?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  loans: ClientLoan[];
  upcoming_payments: ClientUpcomingPayment[];
  active_loans_count: number;
  total_remaining_balance: number;
  total_upcoming_payments_amount: number;
}

export interface ClientLoan {
  id: string; // Consider if this should be number, aligning with database types
  loan_type: string; // Renamed from 'type' for clarity, align with backend
  loan_amount: number; // Renamed from 'amount' for clarity
  approved_amount: number;
  remaining_balance: number;
  interest_rate: number;
  term_months: number;
  start_date?: string;
  end_date?: string;
  status: string;
  next_due_date?: string; // Ensure this is a parsable date string
}

export interface ClientUpcomingPayment {
  loan_id: string; // Consider if this should be number
  loan_type: string;
  amount_due: number;
  due_date: string; // Ensure this is a parsable date string
}

export interface ClientDetailsApiResponse {
  success: boolean;
  data: ClientDetailsData;
  message?: string;
}
