export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  fullName: string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}
