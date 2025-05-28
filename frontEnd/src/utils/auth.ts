// API URL from environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Token expiration check
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  try {
    // Get the expiration time from the token (JWT tokens have an 'exp' claim)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    
    // Check if the token is expired
    return Date.now() >= exp;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume token is expired if there's an error
  }
};

// Refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await fetch(`${API_URL}/api/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to refresh token');
    }
    
    // Store the new token
    localStorage.setItem('token', data.token);
    
    return data.token;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear auth data on refresh failure
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    return null;
  }
};

// Get authenticated user
export const getAuthUser = (): any => {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!token || !isAuth) {
    return false;
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    // Try to refresh the token
    const newToken = await refreshToken();
    return !!newToken;
  }
  
  return true;
};

// Secure fetch with authentication
export const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Get the token
  let token = localStorage.getItem('token');
  
  // Check if token is expired
  if (token && isTokenExpired(token)) {
    // Try to refresh the token
    token = await refreshToken();
    
    if (!token) {
      throw new Error('Authentication expired. Please log in again.');
    }
  }
  
  // Add authorization header if token exists
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 Unauthorized errors
  if (response.status === 401) {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    // Redirect to login
    window.location.href = '/login';
    
    throw new Error('Authentication expired. Please log in again.');
  }
  
  return response;
};

// Logout function
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  window.location.href = '/login';
};
