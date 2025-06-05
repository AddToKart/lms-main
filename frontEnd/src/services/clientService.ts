import type {
  ClientFilters,
  ClientFormData,
  ClientResponse,
  ClientsResponse,
  ClientCreateResponse,
  ClientUpdateResponse,
  ClientDeleteResponse,
} from "../types/client";

// API URL from environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Get authentication token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Create headers with authentication
const createHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Get all clients with filters
export const getClients = async (
  filters: ClientFilters
): Promise<ClientsResponse> => {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.limit) queryParams.append("limit", filters.limit.toString());
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.status) queryParams.append("status", filters.status);

  const response = await fetch(
    `${API_URL}/api/clients?${queryParams.toString()}`,
    {
      method: "GET",
      headers: createHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch clients: ${response.statusText}`);
  }

  return response.json();
};

// Create a new client
export const createClient = async (
  clientData: ClientFormData
): Promise<ClientCreateResponse> => {
  const response = await fetch(`${API_URL}/api/clients`, {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create client: ${response.statusText}`);
  }

  return response.json();
};

// Update an existing client
export const updateClient = async (
  id: number,
  clientData: ClientFormData
): Promise<ClientUpdateResponse> => {
  const response = await fetch(`${API_URL}/api/clients/${id}`, {
    method: "PUT",
    headers: createHeaders(),
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update client: ${response.statusText}`);
  }

  return response.json();
};

// Delete a client
export const deleteClient = async (
  id: number
): Promise<ClientDeleteResponse> => {
  const response = await fetch(`${API_URL}/api/clients/${id}`, {
    method: "DELETE",
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete client: ${response.statusText}`);
  }

  return response.json();
};

// Get a single client by ID
export const getClientById = async (id: number): Promise<ClientResponse> => {
  const response = await fetch(`${API_URL}/api/clients/${id}`, {
    method: "GET",
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch client: ${response.statusText}`);
  }

  return response.json();
};
