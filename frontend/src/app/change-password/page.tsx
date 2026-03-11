'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/Toast';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Preencha todos os campos', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('As senhas não conferem', 'warning');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }

      showToast('Senha alterada com sucesso!', 'success');
      router.push('/modules');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Erro ao alterar senha', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-4">
            <Lock size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Alterar Senha</h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.mustChangePassword
              ? 'Você precisa alterar sua senha no primeiro acesso'
              : 'Defina uma nova senha para sua conta'}
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Senha Atual</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full pl-10 pr-11 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Nova Senha</label>
              <div className="relative">
                <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="w-full pl-10 pr-11 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Confirmar Nova Senha</label>
              <div className="relative">
                <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Alterar Senha'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
