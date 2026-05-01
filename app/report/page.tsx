"use client";

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BarChart3, Users, ReceiptText, Trash2 } from 'lucide-react';
import FilterBar, { FilterState } from '@/components/FilterBar';
import DebtList from '@/components/DebtList';
import SummaryTabs from '@/components/SummaryTabs';
import UserManagement from '@/components/UserManagement';
import { clearAllData } from '@/lib/db';

type ViewMode = 'summary' | 'users' | 'list';

export default function ReportPage() {
  const [activeView, setActiveView] = useState<ViewMode>('summary');
  
  const handleClear = async () => {
    if (confirm("HÀNH ĐỘNG NÀY SẼ XÓA TOÀN BỘ DỮ LIỆU NỢ VÀ NGƯỜI DÙNG! Bạn có chắc chắn không?")) {
      await clearAllData();
      alert("Đã xóa sạch dữ liệu.");
      window.location.reload();
    }
  };

  const [filters, setFilters] = useState<FilterState>({
    person: '',
    product: '',
    fromDate: '',
    toDate: ''
  });

  const rawDebtsResult = useLiveQuery(() => db.debts.toArray());
  const rawDebts = useMemo(() => rawDebtsResult || [], [rawDebtsResult]);

  const filteredDebts = useMemo(() => {
    return rawDebts.filter(d => {
      const matchPerson = filters.person === '' || d.nguoi_no.toLowerCase().includes(filters.person.toLowerCase());
      const matchProduct = filters.product === '' || d.noi_dung.toLowerCase().includes(filters.product.toLowerCase());
      const matchFromDate = filters.fromDate === '' || d.ngay >= filters.fromDate;
      const matchToDate = filters.toDate === '' || d.ngay <= filters.toDate;
      
      return matchPerson && matchProduct && matchFromDate && matchToDate;
    }).sort((a, b) => (b.id || 0) - (a.id || 0)); // Sort by newest
  }, [rawDebts, filters]);

  const tabs: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: 'summary', label: 'Thống kê', icon: BarChart3 },
    { id: 'users', label: 'Người nợ', icon: Users },
    { id: 'list', label: 'Lịch sử', icon: ReceiptText },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 pb-32">
      <div className="w-full max-w-lg mb-8 mt-2 flex items-center justify-between">
        <Link 
          href="/" 
          className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-lg text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all border border-slate-100 dark:border-slate-800"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 bg-clip-text text-transparent transform transition-all whitespace-nowrap">Báo cáo</h1>
        <button 
          onClick={handleClear}
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
          onReset={() => setFilters({ person: '', product: '', fromDate: '', toDate: '' })} 
        />
        
        <div className="sticky top-4 z-20 flex p-1.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[1.75rem] shadow-xl overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`
                relative flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-tighter
                ${activeView === tab.id ? 'text-indigo-600 dark:text-white' : 'text-slate-400 hover:text-slate-600'}
              `}
            >
              {activeView === tab.id && (
                <motion.div 
                  layoutId="activeViewBg"
                  className="absolute inset-0 bg-indigo-50 dark:bg-slate-800 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon size={16} className={`relative z-10 ${activeView === tab.id ? 'text-indigo-500' : 'text-slate-400'}`} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeView === 'summary' && <SummaryTabs debts={filteredDebts} />}
              {activeView === 'users' && <UserManagement />}
              {activeView === 'list' && <DebtList debts={filteredDebts} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
