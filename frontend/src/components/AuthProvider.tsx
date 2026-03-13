'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import LoadingScreen from './LoadingScreen';

const publicRoutes = ['/login', '/change-password'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  // Evita que o AuthProvider interfira durante um login em progresso
  const loginInProgressRef = useRef(false);

  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  // Expõe uma função global para a página de login sinalizar que está
  // realizando o processo — assim o AuthProvider não interfere com race condition
  useEffect(() => {
    (window as Window & { __authLoginInProgress?: (v: boolean) => void }).__authLoginInProgress =
      (v: boolean) => { loginInProgressRef.current = v; };
    return () => {
      delete (window as Window & { __authLoginInProgress?: (v: boolean) => void }).__authLoginInProgress;
    };
  }, []);

  useEffect(() => {
    // Se um login está em progresso (página de login controlando o redirect),
    // o AuthProvider NÃO deve interferir
    if (loginInProgressRef.current) return;

    const checkAuth = async () => {
      if (isPublic) {
        // Rota pública (/login, /change-password):
        // Só redireciona se houver cookie válido E o login NÃO foi iniciado pela página
        // Isso evita race condition com o submit do formulário de login
        if (loginInProgressRef.current) return;

        try {
          const tokenRes = await fetch('/api/auth/token');
          const { token } = await tokenRes.json();
          if (!token) {
            setUser(null);
            return;
          }
          // Cookie existe (sessão ativa anterior) — redirecionar automaticamente
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
  }, [pathname]);
  // ↑ IMPORTANTE: dependência apenas em "pathname", NÃO em "isAuthenticated"
  // Isso evita que o AuthProvider re-execute e crie race condition quando
  // a página de login atualiza o store após login bem-sucedido

  if (isLoading && !isPublic) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !isPublic) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

