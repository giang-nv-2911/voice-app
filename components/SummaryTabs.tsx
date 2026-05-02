"use client";

import { IDebt } from '@/types/debt';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Package, Calendar } from 'lucide-react';

export default function SummaryTabs({ debts }: { debts: IDebt[] }) {
  const [activeTab, setActiveTab] = useState<'person' | 'product' | 'date'>('person');

  const totalAmount = useMemo(() => {
    return debts.reduce((sum, d) => {
      const value = d.so_tien || 0;
      return d.loai === 'tra' ? sum - value : sum + value;
    }, 0);
  }, [debts]);

  const summaryData = useMemo(() => {
    const summary: Record<string, number> = {};
    for (const d of debts) {
      let key = '';
      if (activeTab === 'person') key = d.nguoi_no;
      if (activeTab === 'product') key = d.noi_dung || 'Khác';
      if (activeTab === 'date') key = d.ngay;
      
      const value = d.so_tien || 0;
      if (!summary[key]) summary[key] = 0;
      
      if (d.loai === 'tra') {
        summary[key] -= value;
      } else {
        summary[key] += value;
      }
    }
    return Object.entries(summary).sort((a, b) => {
      if (activeTab === 'date') return b[0].localeCompare(a[0]);
      return b[1] - a[1];
    });
  }, [debts, activeTab]);

  const tabs = [
    { id: 'person', label: 'Người nợ', icon: Users },
    { id: 'product', label: 'Nội dung', icon: Package },
    { id: 'date', label: 'Ngày', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-900 dark:bg-black rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <TrendingUp className="text-indigo-400 w-5 h-5" />
            </div>
            <span className="text-indigo-300/80 font-bold uppercase tracking-widest text-[10px]">Báo cáo tổng kết</span>
          </div>
          <p className="text-slate-400 font-medium mb-1">Tổng cộng nợ cần thu</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {totalAmount.toLocaleString('vi-VN')}
            </span>
            <span className="text-xl font-bold text-slate-500 lowercase">vnđ</span>
          </div>
          <div className="mt-8 flex gap-4">
            <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Bản ghi</p>
              <p className="text-lg font-bold">{debts.length}</p>
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Phát sinh</p>
              <p className="text-lg font-bold text-emerald-400 text-sm">Hợp lệ</p>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-20 -mt-20" />
      </motion.div>

      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-inner overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as 'person' | 'product' | 'date')}
            className={`
              relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300
              ${activeTab === t.id ? 'text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            {activeTab === t.id && (
              <motion.div 
                layoutId="activeTabBg"
                className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <t.icon className={`relative z-10 w-4 h-4 transition-colors ${activeTab === t.id ? 'text-indigo-500' : 'text-slate-400'}`} />
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {summaryData.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-slate-500 py-12 italic bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800"
            >
              Không tìm thấy dữ liệu.
            </motion.p>
          ) : (
            summaryData.map(([key, amount], index) => (
              <motion.div 
                key={key}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group p-5 bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-center relative z-10">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{key}</span>
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                       {Math.round((amount / totalAmount) * 100)}% GIA TRỊ NỢ
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-rose-500 dark:text-rose-400 text-xl tracking-tight">
                      {amount.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">vnđ</span>
                  </div>
                </div>
                
                {/* Visual Bar Background */}
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${(amount / totalAmount) * 100}%` }} 
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
