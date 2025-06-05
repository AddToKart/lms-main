// API URL from environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = `${baseURL}/api`;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { method = "GET", headers = {}, body } = config;

    // Get token from localStorage
    const token = localStorage.getItem("token");

    // Set default headers
    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if token exists
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    // Merge headers
    const finalHeaders = { ...defaultHeaders, ...headers };

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: finalHeaders,
    };

    // Add body for non-GET requests
    if (body && method !== "GET") {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(
        `${this.baseURL}${endpoint}`,
        requestOptions
      );

      // Handle unauthorized responses
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }

      // Parse response
      const data = await response.json();

      // Handle non-OK responses
      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value.toString());
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: "POST", body: data });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: "PUT", body: data });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_URL);
