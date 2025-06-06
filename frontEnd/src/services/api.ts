const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Allow returning raw Response for file downloads
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T> | Response> => {
  try {
    const token = localStorage.getItem("token");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        window.location.href = "/login";
        throw new Error("Authentication failed");
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const contentType = response.headers.get("content-type");

    // Check for Excel file
    if (
      contentType &&
      (contentType.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) ||
        contentType.includes("application/octet-stream"))
    ) {
      // For Excel files, return the raw response for the browser to handle download
      return response;
    }

    // Check for other file types
    if (contentType && !contentType.includes("application/json")) {
      // For non-JSON content types, return the raw response
      return response;
    }

    // For JSON content types, parse as JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

export default apiRequest;
