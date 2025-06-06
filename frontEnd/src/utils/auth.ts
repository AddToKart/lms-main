// API URL from environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Token expiration check
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;

  try {
    // Get the expiration time from the token (JWT tokens have an 'exp' claim)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds

    // Check if the token is expired
    return Date.now() >= exp;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true; // Assume token is expired if there's an error
  }
};

// Refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found to refresh");
    }

    const response = await fetch(`${API_URL}/api/token/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to refresh token");
    }

    // Store the new token
    localStorage.setItem("token", data.token);

    return data.token;
  } catch (error) {
    console.error("Token refresh error:", error);

    // Clear auth data on refresh failure
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");

    return null;
  }
};

// Get authenticated user
export const getAuthUser = (): any => {
  const userJson = localStorage.getItem("user");
  return userJson ? JSON.parse(userJson) : null;
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = localStorage.getItem("token");
  const isAuth = localStorage.getItem("isAuthenticated") === "true";

  if (!token || !isAuth) {
    return false;
  }

  // Optionally verify token with backend
  try {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Token is invalid, clear auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
};

// Login function
export const login = async (credentials: {
  username: string;
  password: string;
}) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Store auth data
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("isAuthenticated", "true");

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Logout function
export const logout = async () => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear auth data regardless of API call success
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
  }
};
