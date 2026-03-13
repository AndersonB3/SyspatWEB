'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Garante que o portal só é criado no cliente (evita erro de hidratação SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Portal renderiza diretamente no <body>, escapando de qualquer
  // stacking context criado por backdrop-filter, transform ou filter.
  return createPortal(
    <div
      ref={overlayRef}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto' }}
      className="flex items-start justify-center bg-black/60 backdrop-blur-sm p-6"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`${sizeClasses[size]} w-full my-auto flex flex-col bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl`}
        style={{ animation: 'modalIn 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 shrink-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
