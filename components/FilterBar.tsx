"use client";

import { useState } from 'react';
import { Filter, X, Search, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterState {
  person: string;
  product: string;
  fromDate: string;
  toDate: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export default function FilterBar({ filters, onChange, onReset }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const hasFilters = filters.person !== '' || filters.product !== '' || filters.fromDate !== '' || filters.toDate !== '';

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Search Bar Header */}
      <div className="flex items-center gap-3 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] shadow-lg shadow-slate-200/20 dark:shadow-none transition-all group focus-within:ring-2 focus-within:ring-indigo-500/20">
        <div className="flex-1 flex items-center px-4">
          <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            name="person"
            value={filters.person}
            onChange={handleChange}
            placeholder="Tìm theo người nợ..."
            className="w-full px-3 py-2 bg-transparent outline-none text-sm font-medium dark:text-white placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex items-center gap-2 pr-2">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all
              ${isOpen || hasFilters ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}
            `}
          >
            <Filter size={14} />
            <span>Bộ lọc</span>
            {hasFilters && !isOpen && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 z-50 p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/80 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Tùy chỉnh lọc</h4>
              <button 
                onClick={onReset}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Làm mới
              </button>
            </div>

            <div className="space-y-5">
              {/* Product Filter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nội dung nợ</label>
                <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 py-1 px-4">
                  <Search size={16} className="text-slate-400" />
                  <input 
                    name="product"
                    value={filters.product}
                    onChange={handleChange}
                    placeholder="Vay tiền, cafe..."
                    className="flex-1 px-3 py-2.5 bg-transparent outline-none text-sm font-medium dark:text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Date Range Picker Style */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Khoảng thời gian</label>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase ml-2">Từ ngày</span>
                    <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/50 px-3">
                      <Calendar size={14} className="text-slate-400 mr-1" />
                      <input 
                        type="date"
                        name="fromDate"
                        value={filters.fromDate}
                        onChange={handleChange}
                        className="w-full py-2.5 bg-transparent outline-none text-xs font-bold dark:text-white dark:scheme-dark cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase ml-2">Đến ngày</span>
                    <div className="relative flex items-center bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/50 px-3">
                      <Calendar size={14} className="text-slate-400 mr-1" />
                      <input 
                        type="date"
                        name="toDate"
                        value={filters.toDate}
                        onChange={handleChange}
                        className="w-full py-2.5 bg-transparent outline-none text-xs font-bold dark:text-white dark:scheme-dark cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
            >
              Áp dụng bộ lọc
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
