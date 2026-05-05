"use client";

import { useState, useEffect, useMemo } from 'react';
import { ParsedDebtResult, IDebt } from '@/types/debt';
import { Save, CheckCircle, UserPlus, AlertCircle, Loader2, Edit2, ReceiptText, CreditCard, Calendar } from 'lucide-react';
import { addDebt, addUser, db, bulkMoveToTrash } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface DebtFormProps {
  parsedData: ParsedDebtResult | null;
  transcript?: string;
  isEdit?: boolean;
  onSaved: () => void;
  onRetryVoice?: () => void;
}

export default function DebtForm({ parsedData, transcript, isEdit, onSaved, onRetryVoice }: DebtFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<ParsedDebtResult>({
    nguoi_no: '',
    so_tien: 0,
    noi_dung: '',
    ngay: new Date().toISOString().split('T')[0],
    loai: 'no'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [shouldAddUser, setShouldAddUser] = useState(false);
  const [remoteDebtors, setRemoteDebtors] = useState<string[]>([]);


  const rawUsers = useLiveQuery(() => db.users.toArray());
  const users = useMemo(() => rawUsers || [], [rawUsers]);

  // LEDGER-BASED DETECTION: Also check existing debt records for names
  const localHistoricalNames = useLiveQuery(async () => {
    const historical = await db.debts.toArray();
    return [...new Set(historical.map(d => d.nguoi_no))].filter(Boolean);
  }, []);

  // Sync remote debtors if logged in
  useEffect(() => {
    if (user) {
      api.get('/api/debts').then(res => {
        const names = [...new Set(res.data.map((d: { debtor_name: string }) => d.debtor_name))].filter(Boolean);
        setRemoteDebtors(names as string[]);
      }).catch(console.error);
    }
  }, [user]);

  const allKnownNames = useMemo(() => {
    const localUsers = users.map(u => u.name);
    const historical = localHistoricalNames || [];
    return [...new Set([...localUsers, ...historical, ...remoteDebtors])];
  }, [users, localHistoricalNames, remoteDebtors]);

  const matchedUser = useMemo(() => {
    const input = formData.nguoi_no?.trim();
    if (!input) return null;

    const normalize = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const inputName = normalize(input);

    // Check against ALL known names (both from user list and debt history)
    const match = allKnownNames.find(name =>
      name.trim().toLowerCase() === input.toLowerCase() ||
      normalize(name.trim()) === inputName
    );

    return match ? { name: match } : null;
  }, [formData.nguoi_no, allKnownNames]);

  const isNewUser = formData.nguoi_no?.trim() && !matchedUser;

  // Reactively sync the "Add User" checkbox with the match result
  useEffect(() => {
    setShouldAddUser(!!isNewUser);
  }, [isNewUser]);

  // Sync prop to state without trigger cascading render warning
  useEffect(() => {
    if (parsedData) {
      setFormData(prev => {
        const isSame = prev.nguoi_no === parsedData.nguoi_no &&
          prev.so_tien === parsedData.so_tien &&
          prev.loai === parsedData.loai &&
          prev.isClearAll === parsedData.isClearAll;
        return isSame ? prev : parsedData;
      });
    }
  }, [parsedData]);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const debtorName = formData.nguoi_no?.trim();
    if (!debtorName) return;
    if (!formData.isClearAll && formData.so_tien <= 0) return;

    setIsSaving(true);
    try {
      if (user) {
        // LOGGED IN: Save to backend
        const backendData = {
          debtor_name: debtorName,
          amount: formData.so_tien,
          description: formData.noi_dung,
          date: new Date(formData.ngay),
          type: formData.loai === 'tra' ? 'borrow' : 'lend',
          transcript: transcript || ''
        };

        if (formData.isClearAll) {
          // LOGGED IN: Call bulk archive endpoint
          await api.delete(`/api/debts/debtor/${debtorName}`);
        } else if (formData.loai === 'tra') {
          // LOGGED IN: SIMPLE REPAYMENT (Ledger Model)
          await api.post('/api/debts/repay', {
            debtor_name: debtorName,
            amount: formData.so_tien,
            transcript: transcript || '',
            date: formData.ngay,
            description: formData.noi_dung
          });
        } else {
          await api.post('/api/debts', backendData);
        }
      } else {
        // NOT LOGGED IN: Save to local Dexie
        const localData = {
          nguoi_no: debtorName,
          so_tien: formData.so_tien,
          noi_dung: formData.isClearAll ? 'XÓA SẠCH NỢ' : formData.noi_dung,
          ngay: formData.ngay,
          loai: formData.loai as 'no' | 'tra'
        };

        if (formData.isClearAll) {
          // Archive all for this user locally
          await bulkMoveToTrash(debtorName);
        } else {
          await addDebt({ ...localData, status: 'pending' });
          if (shouldAddUser) {
            await addUser(debtorName);
          }
        }
      }

      setTimeout(() => {
        if (!isEdit) {
          setFormData({
            nguoi_no: '',
            so_tien: 0,
            noi_dung: '',
            ngay: new Date().toISOString().split('T')[0],
            loai: 'no'
          });
        }
        setShouldAddUser(false);
        onSaved();
        
        if (formData.loai === 'tra' || formData.isClearAll) {
          router.push(`/report?tab=users&debtor=${encodeURIComponent(debtorName)}`);
        }
      }, 1000);
    } catch (error) {
      console.error("Error saving debt:", error);
      alert(user ? "Lỗi khi lưu dữ liệu lên server. Vui lòng thử lại." : "Lỗi khi lưu dữ liệu cục bộ.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!parsedData && !formData.nguoi_no) return null;

  return (
    <div className="w-full max-w-md mt-6 p-7 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500 ease-out">

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          {isEdit ? <Edit2 className="text-indigo-500 w-6 h-6" /> : <CheckCircle className="text-emerald-500 w-6 h-6" />}
          {isEdit ? 'Chỉnh sửa bản ghi' : 'Xác nhận thông tin'}
        </h3>

        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${formData.loai === 'tra'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
          }`}>
          {formData.loai === 'tra' ? 'Trả nợ' : (matchedUser ? 'Nợ cũ' : 'Nợ mới')}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">
            <UserPlus size={10} /> Người nợ
          </div>
          <div className="relative">
            <input
              type="text"
              value={formData.nguoi_no}
              onChange={(e) => setFormData({ ...formData, nguoi_no: e.target.value })}
              required
              className={`
                w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 outline-none transition-all dark:text-white font-bold text-lg placeholder:text-slate-400
                ${matchedUser ? 'border-emerald-500/30' : isNewUser && formData.nguoi_no ? 'border-amber-500/30' : !formData.nguoi_no ? 'border-amber-500/50 animate-pulse' : 'border-transparent focus:border-indigo-500'}
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

          {isNewUser && formData.nguoi_no && !formData.isClearAll && formData.loai !== 'tra' && (
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

          {/* 🚩 UI/UX WARNING: User not found for Repay/Clear actions */}
          {isNewUser && (formData.loai === 'tra' || formData.isClearAll) && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-5 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20">
                <AlertCircle className="text-white" size={24} />
              </div>
              <div>
                <p className="text-rose-600 dark:text-rose-400 font-extrabold text-sm uppercase tracking-wider mb-1">Không tìm thấy người này!</p>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-bold leading-relaxed px-2">
                  Bạn không thể <span className="text-rose-500">{formData.isClearAll ? 'xóa hết nợ' : 'trả nợ'}</span> cho <span className="text-slate-800 dark:text-white">&ldquo;{formData.nguoi_no}&rdquo;</span> vì họ chưa tồn tại trong danh sách.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => onRetryVoice ? onRetryVoice() : window.location.reload()}
                className="mt-2 w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md shadow-rose-500/20 active:scale-95"
              >
                 Vui lòng nói lại tên khác
              </button>
            </motion.div>
          )}
        </div>

        {!formData.isClearAll && !(isNewUser && formData.loai === 'tra') ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">
                  <CreditCard size={10} /> Số tiền
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.so_tien === 0 ? '' : formData.so_tien}
                    onChange={(e) => setFormData({ ...formData, so_tien: Number(e.target.value) })}
                    required={!formData.isClearAll}
                    placeholder="0"
                    className="w-full h-[72px] pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none rounded-2xl font-black text-2xl text-slate-800 dark:text-white transition-all shadow-inner"
                  />
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">đ</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">
                  <Calendar size={10} /> Ngày tháng
                </div>
                <input
                  type="date"
                  value={formData.ngay}
                  onChange={(e) => setFormData({ ...formData, ngay: e.target.value })}
                  required
                  className="w-full h-[72px] px-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none rounded-2xl font-black text-xl text-slate-800 dark:text-white transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">
                <ReceiptText size={10} /> Nội dung nợ
              </div>
              <input
                value={formData.noi_dung}
                onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                placeholder="Ví dụ: Tiền ăn sáng, cafe..."
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none rounded-2xl font-bold text-slate-800 dark:text-white transition-all shadow-inner"
              />
            </div>
          </>
        ) : (
          <div className="p-6 bg-rose-50 dark:bg-rose-900/10 border-2 border-dashed border-rose-200 dark:border-rose-800/50 rounded-[2rem] text-center space-y-2">
            <p className="text-rose-600 dark:text-rose-400 font-black uppercase tracking-tight text-lg">Chế độ Xóa sổ</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Bạn đang chuẩn bị xóa <span className="text-rose-600 font-bold underline italic">toàn bộ</span> lịch sử nợ của <span className="font-extrabold">{formData.nguoi_no}</span>.
            </p>
          </div>
        )}

        {/* Nút lưu chỉ hiển thị khi KHÔNG có lỗi User Not Found */}
        {!(isNewUser && (formData.loai === 'tra' || formData.isClearAll)) && (
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-5 rounded-[1.75rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale-[0.5] ${formData.isClearAll
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200/50'
                : (formData.loai === 'tra'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/50')
              }`}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Save size={24} />
                {isEdit
                  ? 'Cập nhật thay đổi'
                  : (formData.isClearAll ? 'Xác nhận xóa sạch nợ' : (formData.loai === 'tra' ? 'Xác nhận trả nợ' : (matchedUser ? 'Ghi nợ thêm' : 'Lưu nợ mới')))}
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
}
