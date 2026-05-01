"use client";

import { useState } from 'react';
import { Filter, X, Search } from 'lucide-react';

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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-4 shadow-sm mb-6 transition-all">
      <div className="flex justify-between items-center px-2">
        <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Filter size={18} />
          Bộ lọc <span className="ml-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-xs text-indigo-600 dark:text-indigo-400 rounded-full font-bold">Lọc</span>
        </h3>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"
        >
          {isOpen ? <X size={20} /> : <Filter size={20} />}
        </button>
      </div>

      <div className={`mt-4 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end ${isOpen ? 'block' : 'hidden md:flex'}`}>
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Người nợ</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              name="person"
              value={filters.person}
              onChange={handleChange}
              placeholder="Tên người..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
        
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Nội dung</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              name="product"
              value={filters.product}
              onChange={handleChange}
              placeholder="VD: bia, cafe..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
        
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Từ ngày</label>
          <input 
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Đến ngày</label>
          <input 
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
          />
        </div>

        <button 
          onClick={onReset}
          className="w-full md:w-auto px-5 py-2.5 bg-slate-100/50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-rose-600 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
