'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
        <p className="text-slate-400 text-sm">Carregando...</p>
      </div>
    </div>
  );
}
