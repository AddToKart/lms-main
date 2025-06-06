import { ApiResponse, PaginatedResponse } from "../types/common";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  country?: string;
  status: "active" | "inactive" | "blacklisted";
  created_at: string;
  updated_at: string;
}

export interface ClientFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ClientFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  status?: "active" | "inactive" | "blacklisted";
}

export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  blacklisted: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const getClients = async (
  filters: ClientFilters = {}
): Promise<ApiResponse<PaginatedResponse<Client>>> => {
  try {
    console.log(
      "[ClientService] Fetching clients with filters:",
      JSON.stringify(filters)
    ); // Log filters safely

    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);

    const url = `${API_URL}/api/clients${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    console.log("[ClientService] Request URL:", url);

    const fetchResponse = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!fetchResponse.ok) {
      let errorBody = "Could not read error body.";
      try {
        errorBody = await fetchResponse.text();
      } catch (e) {
        /* ignore */
      }
      console.error(
        `[ClientService] HTTP error! Status: ${fetchResponse.status}, Body: ${errorBody}`
      );
      throw new Error(`HTTP error! status: ${fetchResponse.status}`);
    }

    let responseData: any;
    const responseText = await fetchResponse.text(); // Get raw text first

    try {
      responseData = JSON.parse(responseText);
    } catch (jsonError: any) {
      console.error(
        "[ClientService] Failed to parse JSON response:",
        jsonError.message
      );
      console.error(
        "[ClientService] Raw response text on JSON error:",
        responseText
      );
      throw new Error(
        "Failed to parse server response. The response was not valid JSON."
      );
    }

    // Log the parsed data structure
    console.log(
      "[ClientService] Parsed JSON data:",
      JSON.stringify(responseData, null, 2)
    );

    // Defensive checks for the expected structure
    if (typeof responseData !== "object" || responseData === null) {
      console.error(
        "[ClientService] Invalid response: Expected an object, got:",
        typeof responseData,
        responseData
      );
      throw new Error("Invalid response structure from API: Not an object.");
    }
    if (typeof responseData.success !== "boolean") {
      console.error(
        '[ClientService] Invalid response: Missing or non-boolean "success" flag.'
      );
      throw new Error(
        'Invalid response structure from API: Missing "success" flag.'
      );
    }

    if (responseData.success === true) {
      if (typeof responseData.data !== "object" || responseData.data === null) {
        console.error(
          '[ClientService] Invalid response: "data" property is missing or not an object in successful response.'
        );
        throw new Error(
          'Successful API response has invalid "data" property structure.'
        );
      }
      if (!Array.isArray(responseData.data.clients)) {
        console.error(
          '[ClientService] Invalid response: "data.clients" is not an array in successful response.'
        );
        throw new Error(
          'Successful API response has "data.clients" not as an array.'
        );
      }
      if (typeof responseData.data.total !== "number") {
        console.error(
          '[ClientService] Invalid response: "data.total" is not a number in successful response.'
        );
        throw new Error(
          'Successful API response has "data.total" not as a number.'
        );
      }
    }

    // console.log('[ClientService] Returning processed data structure is valid.'); // Old log replaced by JSON.stringify above
    return responseData as ApiResponse<PaginatedResponse<Client>>;
  } catch (error: any) {
    // Log the error message and stack trace to understand where the TypeError originates
    console.error(
      `[ClientService] Error in getClients service call. Message: ${error.message}. Stack: ${error.stack}`
    );

    // Ensure filters is an object before accessing its properties
    const safeFilters =
      typeof filters === "object" && filters !== null ? filters : {};

    return {
      success: false,
      message:
        error.message || "Failed to fetch clients due to an unexpected error.",
      data: {
        clients: [],
        total: 0,
        page: safeFilters.page || 1,
        limit: safeFilters.limit || 10,
        totalPages: 0,
      },
    };
  }
};

export const getClient = async (id: number): Promise<ApiResponse<Client>> => {
  try {
    console.log("[ClientService] Fetching client with ID:", id);

    const response = await fetch(`${API_URL}/api/clients/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[ClientService] Client response:", data);

    return data;
  } catch (error: any) {
    console.error("[ClientService] Error fetching client:", error);

    return {
      success: false,
      message: error.message || "Failed to fetch client",
      data: null,
    };
  }
};

export const createClient = async (
  clientData: ClientFormData
): Promise<ApiResponse<Client>> => {
  try {
    console.log("[ClientService] Creating client with data:", clientData);

    const response = await fetch(`${API_URL}/api/clients`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[ClientService] Client created:", data);

    return data;
  } catch (error: any) {
    console.error("[ClientService] Error creating client:", error);

    return {
      success: false,
      message: error.message || "Failed to create client",
      data: null,
    };
  }
};

export const updateClient = async (
  id: number,
  clientData: Partial<ClientFormData>
): Promise<ApiResponse<Client>> => {
  try {
    console.log(
      "[ClientService] Updating client ID:",
      id,
      "with data:",
      clientData
    );

    const response = await fetch(`${API_URL}/api/clients/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[ClientService] Client updated:", data);

    return data;
  } catch (error: any) {
    console.error("[ClientService] Error updating client:", error);

    return {
      success: false,
      message: error.message || "Failed to update client",
      data: null,
    };
  }
};

export const deleteClient = async (id: number): Promise<ApiResponse<null>> => {
  try {
    console.log("[ClientService] Deleting client ID:", id);

    const response = await fetch(`${API_URL}/api/clients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[ClientService] Client deleted:", data);

    return data;
  } catch (error: any) {
    console.error("[ClientService] Error deleting client:", error);

    return {
      success: false,
      message: error.message || "Failed to delete client",
      data: null,
    };
  }
};

export const getClientDetailsById = async (
  id: number
): Promise<ApiResponse<Client>> => {
  try {
    console.log("[ClientService] Fetching client details with ID:", id);

    const response = await fetch(`${API_URL}/api/clients/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[ClientService] Client details response:", data);

    return data;
  } catch (error: any) {
    console.error("[ClientService] Error fetching client details:", error);

    return {
      success: false,
      message: error.message || "Failed to fetch client details",
      data: null,
    };
  }
};

export const getClientStats = async (): Promise<ApiResponse<ClientStats>> => {
  try {
    console.log("[ClientService] Fetching client stats");
    const response = await fetch(`${API_URL}/api/clients/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "[ClientService] Get client stats error response body:",
        errorBody
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("[ClientService] Client stats received:", data);

    // Add a check for the data structure if necessary
    if (
      data &&
      data.success &&
      data.data &&
      typeof data.data.total_clients === "number" &&
      typeof data.data.active_clients === "number" &&
      typeof data.data.inactive_clients === "number" &&
      typeof data.data.blacklisted_clients === "number"
    ) {
      // Map backend stats to frontend ClientStats type
      const mappedData: ClientStats = {
        total: data.data.total_clients,
        active: data.data.active_clients,
        inactive: data.data.inactive_clients,
        blacklisted: data.data.blacklisted_clients,
      };
      return { success: true, data: mappedData };
    } else if (data && data.success === false) {
      return {
        success: false,
        message:
          data.message || "Failed to fetch client stats due to server error.",
        data: null,
      };
    } else {
      // Handle unexpected structure
      console.error(
        "[ClientService] Unexpected client stats data structure:",
        data
      );
      throw new Error("Unexpected data structure for client stats.");
    }
  } catch (error: any) {
    console.error("[ClientService] Error fetching client stats:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch client stats",
      data: null,
    };
  }
};

// Export additional functions for compatibility
export { getClients as fetchClients };
