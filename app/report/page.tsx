"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BarChart3, Users, ReceiptText, Trash2, Loader2, Cloud, HardDrive } from 'lucide-react';
import FilterBar, { FilterState } from '@/components/FilterBar';
import DebtList from '@/components/DebtList';
import SummaryTabs from '@/components/SummaryTabs';
import UserManagement from '@/components/UserManagement';
import TrashList from '@/components/TrashList';
import ConfirmModal from '@/components/ConfirmModal';
import { clearAllData, db } from '@/lib/db';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { IDebt } from '@/types/debt';

type ViewMode = 'summary' | 'users' | 'list' | 'trash';

export default function ReportPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewMode>('summary');
  const [autoOpenDebtor, setAutoOpenDebtor] = useState<string | undefined>(undefined);
  const [rawDebts, setRawDebts] = useState<IDebt[]>([]);
  const [deletedDebts, setDeletedDebts] = useState<IDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as ViewMode;
      const debtor = params.get('debtor');
      if (tab) setActiveView(tab);
      if (debtor) setAutoOpenDebtor(debtor);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        // LOGGED IN: Fetch from backend
        const [debtsRes, trashRes] = await Promise.all([
          api.get('/api/debts'),
          api.get('/api/debts/trash')
        ]);

        const mapDebt = (d: { id: number; debtor_name?: string; amount?: number; description?: string; date?: string; type?: string; status?: string; deleted_at?: string }) => {
          if (!d) return null;
          return {
            id: d.id,
            nguoi_no: d.debtor_name || 'Không rõ',
            so_tien: Number(d.amount) || 0,
            noi_dung: d.description || '',
            ngay: (d.date || new Date().toISOString()).split('T')[0],
            loai: d.type === 'borrow' ? 'tra' : 'no',
            status: d.status,
            deleted_at: d.deleted_at
          };
        };

        setRawDebts(debtsRes.data.map(mapDebt).filter(Boolean));
        setDeletedDebts(trashRes.data.map(mapDebt).filter(Boolean));
      } else {
        // NOT LOGGED IN: Fetch from local Dexie
        const [localDebts, localTrash] = await Promise.all([
          db.debts.toArray(),
          db.deletedDebts.toArray()
        ]);
        setRawDebts(localDebts || []);
        setDeletedDebts(localTrash || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirmClear = async () => {
    try {
      if (user) {
        // Online: Clear server data
        await api.delete('/api/debts/purge');
      }
      
      // Always clear local data
      await clearAllData();
      
      // Update UI state
      await fetchData();
      setModalOpen(false);
    } catch (error) {
      console.error("Purge failed:", error);
      alert("Xóa dữ liệu thất bại. Vui lòng thử lại.");
    }
  };

  const handleClearClick = () => {
    setModalOpen(true);
  };

  const [filters, setFilters] = useState<FilterState>({
    person: '',
    fromDate: '',
    toDate: ''
  });

  const filteredDebts = useMemo(() => {
    return rawDebts.filter(d => {
      const matchPerson = filters.person === '' || d.nguoi_no.toLowerCase().includes(filters.person.toLowerCase());
      const matchFromDate = filters.fromDate === '' || d.ngay >= filters.fromDate;
      const matchToDate = filters.toDate === '' || d.ngay <= filters.toDate;

      return matchPerson && matchFromDate && matchToDate;
    }).sort((a, b) => {
      const dateA = new Date(a.ngay).getTime();
      const dateB = new Date(b.ngay).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }, [rawDebts, filters]);

  const tabs = [
    { id: 'summary' as const, label: 'Thống kê', icon: BarChart3 },
    { id: 'users' as const, label: 'Người nợ', icon: Users },
    { id: 'list' as const, label: 'Lịch sử', icon: ReceiptText },
    ...(user ? [{ id: 'trash' as const, label: 'Thùng rác', icon: Trash2 }] : []),
  ];

  // Safety: If user is not logged in but somehow on trash tab (e.g. after logout)
  useEffect(() => {
    if (!user && activeView === 'trash') {
      setActiveView('summary');
    }
  }, [user, activeView]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 pb-32">
      <div className="w-full max-w-lg mb-8 mt-2 flex items-center justify-between">
        <Link
          href="/"
          className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-lg text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all border border-slate-100 dark:border-slate-800"
        >
          <ChevronLeft size={24} />
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-black bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 bg-clip-text text-transparent transform transition-all tracking-tight">Báo cáo</h1>
          <div className="flex items-center gap-1.5 mt-1">
            {user ? (
              <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                <Cloud size={10} className="animate-pulse" /> Cloud Sync
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800/50">
                <HardDrive size={10} /> Offline Mode
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleClearClick}
          className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-95 transition-all border border-slate-100 dark:border-slate-800"
          title="Xóa toàn bộ dữ liệu"
        >
          <Trash2 size={24} />
        </button>
      </div>

      <div className="w-full max-w-lg space-y-6">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({ person: '', fromDate: '', toDate: '' })}
        />

        <div className="sticky top-6 z-30 flex gap-1 p-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[1rem] shadow-2xl shadow-indigo-500/10 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`
                relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl text-[9px] font-black transition-all duration-500 uppercase tracking-widest min-w-[70px]
                ${activeView === tab.id ? 'text-indigo-600 dark:text-white' : 'text-slate-400 hover:text-slate-500'}
              `}
            >
              {activeView === tab.id && (
                <motion.div
                  layoutId="activeViewBg"
                  className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <tab.icon size={18} className={`relative z-10 transition-transform duration-500 ${activeView === tab.id ? 'text-indigo-500 scale-110' : 'text-slate-400'}`} />
              <span className="relative z-10">{tab.label}</span>
              {tab.id === 'trash' && deletedDebts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-rose-500 to-pink-600 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-lg relative z-20 animate-in zoom-in duration-300">
                  {deletedDebts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {activeView === 'summary' && <SummaryTabs debts={filteredDebts} />}
                {activeView === 'users' && <UserManagement debts={rawDebts} autoOpenDebtor={autoOpenDebtor} />}
                {activeView === 'list' && <DebtList debts={filteredDebts} />}
                {activeView === 'trash' && <TrashList debts={deletedDebts} onRefresh={fetchData} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Xóa toàn bộ dữ liệu?"
        message={`HÀNH ĐỘNG NÀY SẼ XÓA VĨNH VIỄN TOÀN BỘ DỮ LIỆU NỢ ${user ? 'trên SERVER' : 'cục bộ'}! Bạn có thực sự chắc chắn không?`}
        confirmText="Xóa sạch tất cả"
        cancelText="Không, dừng lại"
        type="danger"
      />
    </main>
  );
}
