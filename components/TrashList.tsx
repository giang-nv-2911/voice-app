"use client";

import { IDebt } from '@/types/debt';
import { format } from 'date-fns';
import { RotateCcw, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { restoreFromTrash, db, bulkRestoreFromTrash, bulkPermanentDeleteFromTrash } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import ConfirmModal from './ConfirmModal';
import { useState } from 'react';

export default function TrashList({
  debts,
  onRefresh
}: {
  debts: (IDebt & { deleted_at?: string })[],
  onRefresh: () => void
}) {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    ids: number[];
    type: 'restore' | 'delete';
  } | null>(null);

  if (debts.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
        <p className="text-slate-500 font-medium">Thùng rác trống.</p>
      </div>
    );
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === debts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(debts.map(d => d.id as number).filter(Boolean));
    }
  };

  const handleConfirm = async () => {
    if (!modalConfig) return;
    const { ids, type } = modalConfig;

    setIsProcessing(true);
    try {
      if (type === 'restore') {
        if (user) {
          await api.post('/api/debts/trash/restore-bulk', { ids });
        } else {
          await bulkRestoreFromTrash(ids);
        }
      } else {
        if (user) {
          await api.delete('/api/debts/trash/bulk', { data: { ids } });
        } else {
          await bulkPermanentDeleteFromTrash(ids);
        }
      }
      setSelectedIds([]);
      onRefresh();
      setModalOpen(false);
    } catch (error) {
      console.error(`${type} failed:`, error);
      alert("Hành động thất bại. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (ids: number[], type: 'restore' | 'delete') => {
    setModalConfig({ ids, type });
    setModalOpen(true);
  };

  return (
    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Bulk Action Controls */}
      <div className="flex items-center justify-between px-2 mb-2 bg-white/50 dark:bg-slate-900/50 p-4 rounded-[1.5rem] backdrop-blur-sm border border-slate-100 dark:border-slate-800 shadow-sm">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={debts.length > 0 && selectedIds.length === debts.length}
              onChange={toggleSelectAll}
              className="hidden peer"
            />
            <div className={`w-6 h-6 rounded-lg border-2 transition-all flex ml-2 items-center justify-center ${selectedIds.length === debts.length ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-700'}`}>
              <CheckCircle size={14} className={`text-white transition-opacity ${selectedIds.length === debts.length ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
            </div>
          </div>
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {selectedIds.length > 0 ? `Đã chọn ${selectedIds.length}` : 'Chọn tất cả'}
          </span>
        </label>

        {selectedIds.length > 0 && (
          <div className="flex gap-2 animate-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => openModal(selectedIds, 'restore')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-tight shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <RotateCcw size={14} /> Khôi phục
            </button>
            <button
              onClick={() => openModal(selectedIds, 'delete')}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-tight shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              <Trash2 size={14} /> Xóa sạch
            </button>
          </div>
        )}
      </div>

      {debts.map((debt) => (
        <div
          key={debt.id}
          onClick={() => debt.id && toggleSelect(debt.id)}
          className={`
            relative group bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-5 rounded-[2rem] border transition-all cursor-pointer
            ${selectedIds.includes(debt.id as number)
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-md'
              : 'border-slate-100 dark:border-slate-800 hover:bg-white/60 dark:hover:bg-slate-900/60'}
          `}
        >
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Individual Checkbox */}
              <div className="flex-shrink-0">
                <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedIds.includes(debt.id as number)
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                  }`}>
                  <CheckCircle size={12} className={`text-white transition-opacity ${selectedIds.includes(debt.id as number) ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg text-slate-400 dark:text-slate-500 leading-none uppercase tracking-tight line-through opacity-60">{debt.nguoi_no}</h4>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-[10px] font-bold uppercase text-slate-500">{debt.noi_dung || 'Không tiêu đề'}</span>
                  <div className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(debt.ngay), 'dd/MM/yyyy')}</span>
                </div>

                {debt.deleted_at && (
                  <div className="flex items-center gap-1.5 text-rose-500/60 bg-rose-50/50 dark:bg-rose-950/10 px-3 py-1.5 rounded-xl w-fit border border-rose-100/50 dark:border-rose-900/20">
                    <RotateCcw size={10} />
                    <span className="text-[9px] font-black uppercase tracking-tight italic">Xóa: {format(new Date(debt.deleted_at), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end justify-between min-w-[100px]">
              <span className="font-black text-xl tracking-tighter text-slate-300 dark:text-slate-700">
                {debt.so_tien.toLocaleString('vi-VN')}
                <span className="text-[10px] ml-1 opacity-50 font-mono">đ</span>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); debt.id && openModal([debt.id], 'restore'); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 hover:scale-105 active:scale-95 transition-all rounded-xl text-[10px] font-black uppercase tracking-tight"
                >
                  <RotateCcw size={12} />
                  <span>Khôi phục</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); debt.id && openModal([debt.id], 'delete'); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-500 hover:scale-105 active:scale-95 transition-all rounded-xl text-[10px] font-black uppercase tracking-tight"
                >
                  <Trash2 size={12} />
                  <span>Xóa sạch</span>
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
        title={modalConfig?.type === 'restore' ? 'Khôi phục hàng loạt' : 'Xóa vĩnh viễn'}
        message={modalConfig?.type === 'restore'
          ? `Khôi phục ${modalConfig?.ids.length} bản ghi đã chọn về trạng thái hoạt động?`
          : `CẢNH BÁO: ${modalConfig?.ids.length} bản ghi này sẽ biến mất VĨNH VIỄN khỏi hệ thống!`}
        confirmText={modalConfig?.type === 'restore' ? "Khôi phục ngay" : "Xóa vĩnh viễn"}
        cancelText="Hủy bỏ"
        type={modalConfig?.type === 'restore' ? 'info' : 'danger'}
        isLoading={isProcessing}
      />
    </div>
  );
}
