'use client';

import AuthProvider from '@/components/AuthProvider';
import { ToastContainer } from '@/components/Toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastContainer />
      {children}
    </AuthProvider>
  );
}
