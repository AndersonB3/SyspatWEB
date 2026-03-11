// Serviço de Usuários

import { api } from './api';
import { UserRecord } from '@/types/auth';
import { PaginatedResponse } from '@/types/reports';

export type CreateUserPayload = Pick<UserRecord, 'name' | 'username' | 'role'> &
  Partial<Pick<UserRecord, 'email' | 'cpf' | 'birth_date' | 'department' | 'phone' | 'must_change_password'>> & {
    password: string;
  };

export type UpdateUserPayload = Partial<
  Pick<UserRecord, 'name' | 'username' | 'email' | 'cpf' | 'birth_date' | 'role' | 'department' | 'phone' | 'is_active'>
> & { password?: string };

export const usersService = {
  async list(page = 1, limit = 10, search?: string): Promise<PaginatedResponse<UserRecord>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return api.get(`/users?${params}`);
  },

  async getById(id: string): Promise<UserRecord> {
    return api.get(`/users/${id}`);
  },

  async create(data: CreateUserPayload): Promise<UserRecord> {
    return api.post('/users', data);
  },

  async update(id: string, data: UpdateUserPayload): Promise<UserRecord> {
    return api.put(`/users/${id}`, data);
  },

  async deactivate(id: string): Promise<{ message: string }> {
    return api.delete(`/users/${id}`);
  },

  async hardDelete(id: string): Promise<{ message: string }> {
    return api.delete(`/users/${id}/hard`);
  },
};
