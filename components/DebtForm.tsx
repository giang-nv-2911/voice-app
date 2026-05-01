"use client";

import { useState, useEffect, useMemo } from 'react';
import { ParsedDebtResult, IDebt } from '@/types/debt';
import { Save, CheckCircle, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { addDebt, addUser, db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface DebtFormProps {
  parsedData: ParsedDebtResult | null;
  onSaved: () => void;
}

export default function DebtForm({ parsedData, onSaved }: DebtFormProps) {
  const [formData, setFormData] = useState<ParsedDebtResult>({
    nguoi_no: '',
    so_tien: 0,
    noi_dung: '',
    ngay: new Date().toISOString().split('T')[0]
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shouldAddUser, setShouldAddUser] = useState(false);

  const rawUsers = useLiveQuery(() => db.users.toArray());
  const users = useMemo(() => rawUsers || [], [rawUsers]);

  // Comparison logic
  const matchedUser = useMemo(() => {
    if (!formData.nguoi_no) return null;
    return users.find(u => u.name.toLowerCase() === formData.nguoi_no.toLowerCase());
  }, [formData.nguoi_no, users]);

  const isNewUser = formData.nguoi_no && !matchedUser;

  useEffect(() => {
    if (parsedData) {
      setFormData(parsedData);
      // Sugggest adding user if not in list
      const exists = users.some(u => u.name.toLowerCase() === parsedData.nguoi_no.toLowerCase());
      setShouldAddUser(!exists);
    }
  }, [parsedData, users]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'so_tien' ? Number(value) : value
    }));

    if (name === 'nguoi_no') {
      const isStillNew = !users.some(u => u.name.toLowerCase() === value.toLowerCase());
      setShouldAddUser(isStillNew);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nguoi_no || formData.so_tien <= 0) return;
    
    setIsSaving(true);
    try {
      // Use the matched user's exact name if found, otherwise use current name
      const finalName = matchedUser ? matchedUser.name : formData.nguoi_no;
      
      // If it's a new user and shouldAddUser is checked, add to users table
      if (isNewUser && shouldAddUser) {
        await addUser(formData.nguoi_no);
      }

      await addDebt({
        ...formData,
        nguoi_no: finalName
      } as Omit<IDebt, 'id'>);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          nguoi_no: '',
          so_tien: 0,
          noi_dung: '',
          ngay: new Date().toISOString().split('T')[0]
        });
        setShouldAddUser(false);
        onSaved();
      }, 1500);
    } catch (error) {
      console.error("Error saving debt:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!parsedData && !formData.nguoi_no) return null;

  return (
    <div className="w-full max-w-md mt-6 p-7 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <CheckCircle className="text-emerald-500 w-6 h-6"/>
        Xác nhận thông tin
      </h3>
      
      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400">Người nợ</label>
          <div className="relative">
            <input 
              type="text" 
              name="nguoi_no"
              value={formData.nguoi_no} 
              onChange={handleChange}
              required
              className={`
                w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 outline-none transition-all dark:text-white font-medium text-lg placeholder:text-slate-400
                ${matchedUser ? 'border-emerald-500/30' : isNewUser ? 'border-amber-500/30' : 'border-transparent focus:border-indigo-500'}
              `}
              placeholder="Tên người nợ"
            />
            {matchedUser && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Đã lưu</span>
              </div>
            )}
          </div>

          {isNewUser && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30 flex flex-col gap-2.5 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle size={16} />
                <span className="text-xs font-bold">Người nợ mới (chưa có trong danh sách)</span>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={shouldAddUser}
                    onChange={(e) => setShouldAddUser(e.target.checked)}
                    className="hidden peer"
                  />
                  <div className="w-5 h-5 rounded-md border-2 border-amber-300 dark:border-amber-700 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all flex items-center justify-center">
                    <UserPlus size={12} className={`text-white transition-opacity ${shouldAddUser ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 group-hover:text-amber-600 transition-colors">Thêm vào danh sách người nợ</span>
              </label>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400">Số tiền (VNĐ)</label>
            <input 
              type="number" 
              name="so_tien"
              value={formData.so_tien || ''} 
              onChange={handleChange}
              required
              min="0"
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 outline-none transition-all dark:text-white font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400">Ngày</label>
            <input 
              type="date" 
              name="ngay"
              value={formData.ngay} 
              onChange={handleChange}
              required
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 outline-none transition-all dark:text-white font-medium text-base"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400">Nội dung</label>
          <input 
            type="text" 
            name="noi_dung"
            value={formData.noi_dung} 
            onChange={handleChange}
            className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500 outline-none transition-all dark:text-white font-medium text-lg"
            placeholder="vd: tiền bia, ăn sáng..."
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSaving || showSuccess}
          className={`
            w-full mt-8 py-4 rounded-2xl font-bold text-white text-lg flex justify-center items-center gap-3 transition-all duration-300
            ${showSuccess 
              ? 'bg-emerald-500 shadow-emerald-500/25' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25 shadow-xl active:scale-95'}
          `}
        >
          {showSuccess ? (
            <>
              <CheckCircle size={24} />
              Đã lưu thành công!
            </>
          ) : isSaving ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <Save size={24} />
              Lưu sổ nợ
            </>
          )}
        </button>
      </form>
    </div>
  );
}
