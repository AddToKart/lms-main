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
