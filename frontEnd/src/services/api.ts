const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Request cache to prevent duplicate requests
const requestCache = new Map<string, Promise<any>>();

// Debounce helper
const debounceCache = new Map<string, NodeJS.Timeout>();

function debounceRequest<T>(
  key: string,
  fn: () => Promise<T>,
  delay: number = 300
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Clear existing timeout
    if (debounceCache.has(key)) {
      clearTimeout(debounceCache.get(key)!);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        const result = await fn();
        debounceCache.delete(key);
        resolve(result);
      } catch (error) {
        debounceCache.delete(key);
        reject(error);
      }
    }, delay);

    debounceCache.set(key, timeout);
  });
}

// Enhanced fetch with caching and rate limit handling
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  useCache: boolean = true
): Promise<ApiResponse<T>> {
  const cacheKey = `${endpoint}-${JSON.stringify(options)}`;

  // Return cached promise if it exists and caching is enabled
  if (useCache && requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const requestPromise = (async (): Promise<ApiResponse<T>> => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle rate limiting specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // Default 5 seconds

        // Clear cache entry to allow retry
        requestCache.delete(cacheKey);

        throw new Error(
          `Rate limit exceeded. Please wait ${Math.ceil(
            waitTime / 1000
          )} seconds before trying again.`
        );
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Cache successful response for 30 seconds
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 30000);

      return data;
    } catch (error) {
      // Remove failed request from cache
      requestCache.delete(cacheKey);
      throw error;
    }
  })();

  // Cache the promise
  if (useCache) {
    requestCache.set(cacheKey, requestPromise);
  }

  return requestPromise;
}

// API functions with debouncing for frequently called endpoints
export const getClients = (filters: ClientFilters) =>
  debounceRequest(`clients-${JSON.stringify(filters)}`, () =>
    apiRequest<{ clients: Client[]; total: number; totalPages: number }>(
      "/api/clients?" +
        new URLSearchParams(
          Object.entries(filters)
            .filter(([_, v]) => v !== "" && v !== undefined)
            .map(([k, v]) => [k, String(v)])
        )
    )
  );

export const getLoans = (filters: LoanFilters) =>
  debounceRequest(`loans-${JSON.stringify(filters)}`, () =>
    apiRequest<{ loans: Loan[]; total: number; totalPages: number }>(
      "/api/loans?" +
        new URLSearchParams(
          Object.entries(filters)
            .filter(([_, v]) => v !== "" && v !== undefined)
            .map(([k, v]) => [k, String(v)])
        )
    )
  );

export const getPayments = (filters: PaymentFilters) =>
  debounceRequest(`payments-${JSON.stringify(filters)}`, () =>
    apiRequest<{ payments: Payment[]; total: number; totalPages: number }>(
      "/api/payments?" +
        new URLSearchParams(
          Object.entries(filters)
            .filter(([_, v]) => v !== "" && v !== undefined)
            .map(([k, v]) => [k, String(v)])
        )
    )
  );

// Stats endpoints with longer debounce
export const getClientStats = () =>
  debounceRequest(
    "client-stats",
    () => apiRequest<ClientStats>("/api/clients/stats"),
    1000 // 1 second debounce for stats
  );

export const getLoanStats = () =>
  debounceRequest(
    "loan-stats",
    () => apiRequest<LoanStats>("/api/loans/stats"),
    1000
  );

export const getPaymentStats = () =>
  debounceRequest(
    "payment-stats",
    () => apiRequest<PaymentStats>("/api/payments/stats"),
    1000
  );

// Non-debounced functions for immediate actions
export const createClient = (data: ClientFormData) =>
  apiRequest<Client>(
    "/api/clients",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    false
  );

export const updateClient = (id: number, data: Partial<ClientFormData>) =>
  apiRequest<Client>(
    `/api/clients/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    false
  );

export const deleteClient = (id: number) =>
  apiRequest<void>(
    `/api/clients/${id}`,
    {
      method: "DELETE",
    },
    false
  );

export const createLoan = (data: LoanFormData) =>
  apiRequest<Loan>(
    "/api/loans",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    false
  );

export const updateLoan = (id: number, data: Partial<LoanFormData>) =>
  apiRequest<Loan>(
    `/api/loans/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    false
  );

export const deleteLoan = (id: number) =>
  apiRequest<void>(
    `/api/loans/${id}`,
    {
      method: "DELETE",
    },
    false
  );

export const approveLoan = (
  id: number,
  data: { approved_amount: number; notes: string }
) =>
  apiRequest<Loan>(
    `/api/loans/${id}/approve`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    false
  );

export const rejectLoan = (id: number, data: { notes: string }) =>
  apiRequest<Loan>(
    `/api/loans/${id}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    false
  );

export const createPayment = (data: PaymentFormData) =>
  apiRequest<Payment>(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    false
  );

export const updatePayment = (id: number, data: Partial<PaymentFormData>) =>
  apiRequest<Payment>(
    `/api/payments/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    false
  );

export const deletePayment = (id: number) =>
  apiRequest<void>(
    `/api/payments/${id}`,
    {
      method: "DELETE",
    },
    false
  );

export const getActiveLoans = () => apiRequest<Loan[]>("/api/loans/active");

// Clear all caches (useful for logout or when data becomes stale)
export const clearApiCache = () => {
  requestCache.clear();
  debounceCache.forEach((timeout) => clearTimeout(timeout));
  debounceCache.clear();
};

// Export types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ClientFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface LoanFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  loan_id?: number;
}

export interface Client {
  id: number;
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
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: number;
  client_id: number;
  client_name?: string;
  loan_amount: number;
  approved_amount?: number;
  installment_amount?: number;
  interest_rate: number;
  term_months: number;
  purpose: string;
  start_date: string;
  end_date: string;
  status: string;
  next_due_date?: string;
  payment_frequency: string;
  remaining_balance?: number;
  approval_date?: string;
  approval_notes?: string;
  approved_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  loan_id: number;
  client_id: number;
  client_name?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  status: string;
  notes?: string;
  processed_by?: number;
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
  status: string;
}

export interface LoanFormData {
  client_id: number;
  loan_amount: number;
  approved_amount?: number;
  interest_rate: number;
  term_months: number;
  purpose: string;
  start_date: string;
  status: string;
}

export interface PaymentFormData {
  loan_id: number;
  client_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  status: string;
  notes?: string;
}

export interface ClientStats {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  blacklisted_clients: number;
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

export interface PaymentStats {
  total_payments: number;
  total_payment_amount: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
}
