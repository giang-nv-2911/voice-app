"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Check, Trash2, RotateCcw, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'info',
  isLoading = false
}: ConfirmModalProps) {
  
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="text-rose-500" size={28} />,
          bg: 'bg-rose-50 dark:bg-rose-950/20',
          border: 'border-rose-100 dark:border-rose-900/30',
          button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="text-amber-500" size={28} />,
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-amber-100 dark:border-amber-900/30',
          button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none'
        };
      case 'success':
        return {
          icon: <Check className="text-emerald-500" size={28} />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          border: 'border-emerald-100 dark:border-emerald-900/30',
          button: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-none'
        };
      case 'info':
      default:
        return {
          icon: <RotateCcw className="text-indigo-500" size={28} />,
          bg: 'bg-indigo-50 dark:bg-indigo-950/20',
          border: 'border-indigo-100 dark:border-indigo-900/30',
          button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 overflow-hidden pointer-events-auto relative"
            >
              <div className="p-8 text-center">
                {/* Icon Container */}
                <div className={`w-20 h-20 mx-auto rounded-[2rem] ${styles.bg} ${styles.border} border-2 flex items-center justify-center mb-6`}>
                  {styles.icon}
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
                  {title}
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 px-4">
                  {message}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${styles.button}`}
                  >
                    {isLoading && <Loader2 className="animate-spin" size={16} />}
                    {confirmText}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    {cancelText}
                  </button>
                </div>
              </div>
              
              {/* Optional X close button at top right */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors"
                title="Hủy bỏ"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
