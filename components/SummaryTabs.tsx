"use client";

import { IDebt } from '@/types/debt';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Calendar } from 'lucide-react';

export default function SummaryTabs({ debts }: { debts: IDebt[] }) {
  const [activeTab, setActiveTab] = useState<'person' | 'date'>('person');

  // Advanced Stats Calculation
  const stats = useMemo(() => {
    let lend = 0;
    let borrow = 0;
    const persons: Record<string, number> = {};

    for (const d of debts) {
      const val = d.so_tien || 0;
      if (d.loai === 'tra') {
        borrow += val;
        if (d.nguoi_no) persons[d.nguoi_no] = (persons[d.nguoi_no] || 0) - val;
      } else {
        lend += val;
        if (d.nguoi_no) persons[d.nguoi_no] = (persons[d.nguoi_no] || 0) + val;
      }
    }

    const netBalance = lend - borrow;
    const recoveryRate = lend > 0 ? Math.round((borrow / lend) * 100) : 0;
    const activeDebtors = Object.entries(persons).filter(([personName, bal]) => bal > 0);
    
    // Find top debtor
    let topDebtor = { name: 'Chưa có', amount: 0 };
    if (activeDebtors.length > 0) {
      const top = [...activeDebtors].sort((a, b) => b[1] - a[1])[0];
      topDebtor = { name: top[0], amount: top[1] };
    }

    return { 
      netBalance, 
      lend, 
      borrow, 
      recoveryRate, 
      debtorCount: activeDebtors.length,
      topDebtor
    };
  }, [debts]);

  const summaryData = useMemo(() => {
    const summary: Record<string, number> = {};
    for (const d of debts) {
      let key = '';
      if (activeTab === 'person') key = d.nguoi_no;
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
    { id: 'date', label: 'Ngày', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* 🌟 ENHANCED STATS DASHBOARD */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-900 dark:bg-black rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <TrendingUp className="text-indigo-400 w-5 h-5" />
              </div>
              <span className="text-indigo-300/80 font-black uppercase tracking-widest text-[9px]">Tổng quan tài chính</span>
            </div>
            {/* Tỉ lệ thu hồi hidden as requested */}
          </div>

          <div className="space-y-1 mb-8">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Dư nợ hiện tại</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-slate-500 bg-clip-text text-transparent">
                {stats.netBalance.toLocaleString('vi-VN')}
              </span>
              <span className="text-xl font-bold text-slate-500 lowercase">vnđ</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm space-y-1">
              <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Cho nợ</p>
              <p className="text-lg font-black">{stats.lend.toLocaleString('vi-VN')}đ</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm space-y-1">
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Đã thu hồi</p>
              <p className="text-lg font-black">{stats.borrow.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Users className="text-rose-400" size={14} />
              </div>
              <div>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Người nợ nhất</p>
                <p className="text-xs font-bold text-slate-200">{stats.topDebtor.name}</p>
              </div>
            </div>
            <div className="text-right text-xs font-black text-rose-500">
              {stats.topDebtor.amount.toLocaleString('vi-VN')}đ
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px] -ml-10 -mb-10" />
      </motion.div>

      <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-inner overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id as 'person' | 'date')}
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
                       {stats.netBalance > 0 ? Math.round((amount / stats.netBalance) * 100) : 0}% DƯ NỢ
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-black text-xl tracking-tight ${amount < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {amount.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">vnđ</span>
                  </div>
                </div>
                
                {/* Visual Bar Background */}
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div 
                  className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-out ${amount < 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, Math.abs((amount / (stats.netBalance || 1)) * 100))}%` }} 
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
