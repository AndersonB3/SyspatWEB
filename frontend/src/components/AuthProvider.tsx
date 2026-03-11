'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import LoadingScreen from './LoadingScreen';

const publicRoutes = ['/login'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Tenta buscar o usuário logado; se o cookie for inválido, o backend retorna 401
        const userData = await authService.me();
        setUser(userData);

        if (userData.mustChangePassword && pathname !== '/change-password') {
          router.push('/change-password');
        } else if (publicRoutes.includes(pathname)) {
          router.push('/modules');
        }
      } catch {
        setUser(null);
        if (!publicRoutes.includes(pathname)) {
          router.push('/login');
        }
      }
    };

    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading && !publicRoutes.includes(pathname)) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !publicRoutes.includes(pathname) && pathname !== '/login') {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
