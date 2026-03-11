// Tipos de Autenticação

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  cpf?: string;
  birthDate?: string;
  role: UserRole;
  department?: string;
  phone?: string;
  isActive?: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Registro de usuário conforme retornado pelo backend (snake_case). */
export interface UserRecord {
  id: string;
  name: string;
  username: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
  role: UserRole;
  department?: string;
  phone?: string;
  is_active: boolean;
  must_change_password?: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'VIEWER';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
