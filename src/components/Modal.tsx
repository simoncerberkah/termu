import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, subtitle, maxWidth = 'max-w-md', onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} glass-modal rounded-t-[28px] sm:rounded-[30px] p-4 sm:p-6 sm:my-auto animate-modal max-h-[92dvh] overflow-y-auto`}
      >
        <div className="sm:hidden w-10 h-1.5 rounded-full bg-black/15 mx-auto mb-3" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-black/[0.06]">
          <div className="min-w-0">
            <h3 className="font-display text-lg sm:text-xl font-semibold text-[#2B2B2B] leading-tight">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-[#6E7178] mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full glass-tile hover:bg-white flex items-center justify-center text-[#2B2B2B] shrink-0 transition"
            aria-label="Tutup jendela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null;
  const styles: Record<ToastItem['type'], string> = {
    success: 'bg-[#232428]/92 text-white border-white/20',
    error: 'bg-[#9E2420]/94 text-white border-red-200/30',
    warning: 'bg-[#FFF3DA]/95 text-[#7A3F04] border-white/80',
    info: 'bg-white/90 text-[#2B2B2B] border-white/95',
  };
  return (
    <div
      className="fixed top-4 right-4 left-4 sm:left-auto z-[95] flex flex-col gap-2 pointer-events-none max-w-sm ml-auto"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.14)] text-xs font-semibold animate-modal ${styles[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
