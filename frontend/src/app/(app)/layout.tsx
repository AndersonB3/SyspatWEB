'use client';

import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
