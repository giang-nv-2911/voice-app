"use client";

import { IDebt } from '@/types/debt';
import { format } from 'date-fns';
import { RotateCcw, Trash2 } from 'lucide-react';
import { restoreFromTrash, db } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import ConfirmModal from './ConfirmModal';
import { useState } from 'react';

export default function TrashList({ debts }: { debts: (IDebt & { deleted_at?: string })[] }) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    id: number;
    type: 'restore' | 'delete';
  } | null>(null);

  if (debts.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
        <p className="text-slate-500 font-medium">Thùng rác trống.</p>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!modalConfig) return;
    const { id, type } = modalConfig;

    try {
      if (type === 'restore') {
        if (user) {
          await api.post(`/api/debts/trash/restore/${id}`);
        } else {
          await restoreFromTrash(id);
        }
      } else {
        if (user) {
          // Placeholder for server permanent delete
        } else {
          await db.deletedDebts.delete(id);
        }
      }
      window.location.reload();
    } catch (error) {
      console.error(`${type} failed:`, error);
    }
  };

  const openModal = (id: number, type: 'restore' | 'delete') => {
    setModalConfig({ id, type });
    setModalOpen(true);
  };

  return (
    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/30 p-6 rounded-[2rem] mb-2 flex items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 dark:border-amber-800/50 relative z-10">
          <Trash2 size={28} />
        </div>
        <div className="relative z-10">
          <p className="text-base font-black text-amber-900 dark:text-amber-200 leading-tight">Thùng rác</p>
          <p className="text-xs font-bold text-amber-700/70 dark:text-amber-400/70 uppercase tracking-tight mt-0.5">Các bản ghi đã xóa có thể được khôi phục tại đây.</p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      </div>

      {debts.map((debt) => (
        <div key={debt.id} className="relative group bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-100/50 dark:border-slate-800/50 shadow-sm transition-all hover:bg-white/60 dark:hover:bg-slate-900/60">
          <div className="flex justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-xl text-slate-400 dark:text-slate-500 leading-none uppercase tracking-tight line-through decoration-slate-300 dark:decoration-slate-700">{debt.nguoi_no}</h4>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Đã ẩn</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                 <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] font-bold uppercase">{debt.noi_dung || 'Không tiêu đề'}</span>
                 </div>
                 <div className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                 <span className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(debt.ngay), 'dd/MM/yyyy')}</span>
              </div>

              {debt.deleted_at && (
                <div className="flex items-center gap-1.5 text-rose-500/60 bg-rose-50/50 dark:bg-rose-950/10 px-3 py-1.5 rounded-xl w-fit border border-rose-100/50 dark:border-rose-900/20">
                  <RotateCcw size={10} />
                  <span className="text-[9px] font-black uppercase tracking-tight">Xóa lúc: {format(new Date(debt.deleted_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end justify-between">
              <div className="flex flex-col items-end">
                <span className="font-black text-2xl tracking-tighter text-slate-300 dark:text-slate-700">
                  {debt.so_tien.toLocaleString('vi-VN')}
                  <span className="text-xs font-bold ml-1 uppercase opacity-50 font-mono">đ</span>
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <button 
                  onClick={() => debt.id && openModal(debt.id, 'restore')}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 text-xs font-black uppercase tracking-widest"
                >
                  <RotateCcw size={16} />
                  <span>Khôi phục</span>
                </button>
                <button 
                  onClick={() => debt.id && openModal(debt.id, 'delete')}
                  className="p-3 bg-white dark:bg-slate-800 text-rose-500 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  title="Xóa vĩnh viễn"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <ConfirmModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        title={modalConfig?.type === 'restore' ? 'Khôi phục bản ghi?' : 'Xóa vĩnh viễn?'}
        message={modalConfig?.type === 'restore' 
          ? 'Bản ghi này sẽ quay trở lại danh sách công nợ đang hoạt động.' 
          : 'Hành động này không thể hoàn tác. Dữ liệu sẽ biến mất vĩnh viễn.'}
        confirmText={modalConfig?.type === 'restore' ? 'Khôi phục ngay' : 'Xóa vĩnh viễn'}
        type={modalConfig?.type === 'restore' ? 'success' : 'danger'}
      />
    </div>
  );
}
