'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import LoadingScreen from './LoadingScreen';

const publicRoutes = ['/login', '/change-password'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  useEffect(() => {
    const checkAuth = async () => {
      if (isPublic) {
        // Se o store já tem usuário autenticado, redireciona direto
        if (isAuthenticated && user) {
          if (user.mustChangePassword) {
            router.push('/change-password');
          } else {
            router.push('/modules');
          }
          return;
        }

        try {
          const tokenRes = await fetch('/api/auth/token');
          const { token } = await tokenRes.json();
          if (!token) {
            setUser(null);
            return;
          }
          const userData = await authService.me();
          setUser(userData);
          if (userData.mustChangePassword) {
            router.push('/change-password');
          } else {
            router.push('/modules');
          }
        } catch {
          setUser(null);
        }
        return;
      }

      // Rotas protegidas — se o store já tem usuário, confiar nele
      if (isAuthenticated && user) {
        if (user.mustChangePassword && !pathname.startsWith('/change-password')) {
          router.push('/change-password');
        }
        return;
      }

      // Store vazio — verificar com o backend
      try {
        const userData = await authService.me();
        setUser(userData);

        if (userData.mustChangePassword && !pathname.startsWith('/change-password')) {
          router.push('/change-password');
        }
      } catch {
        setUser(null);
        router.push('/login');
      }
    };

    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isAuthenticated]);

  if (isLoading && !isPublic) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !isPublic) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

