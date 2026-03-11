'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

export default function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-2xl transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${colors[type]}`}
    >
      <Icon size={20} />
      <span className="text-sm font-medium max-w-xs">{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-2 hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
}

// Hook para gerenciar toasts
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let addToastFn: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function showToast(message: string, type: ToastType = 'info') {
  if (addToastFn) addToastFn({ message, type });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastFn = (toast) => {
      setToasts((prev) => [...prev, { ...toast, id: ++toastId }]);
    };
    return () => { addToastFn = null; };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
        />
      ))}
    </div>
  );
}
