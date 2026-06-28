// User model
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'referrer' | 'candidate';
  phone?: string;
  company?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

// Auth response
export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  message: string;
}

// Login request
export interface LoginRequest {
  email: string;
  password: string;
}

// Signup request
export interface SignupRequest {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  user_type: 'referrer' | 'candidate';
  phone?: string;
  company?: string;
}
