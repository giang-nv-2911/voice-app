"use client";

import { useState, useEffect, useMemo } from 'react';
import { ParsedDebtResult, IDebt } from '@/types/debt';
import { Save, CheckCircle, UserPlus, AlertCircle, Loader2, Edit2, ReceiptText, CreditCard, Calendar } from 'lucide-react';
import { addDebt, addUser, db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';

interface DebtFormProps {
  parsedData: ParsedDebtResult | null;
  transcript?: string;
  isEdit?: boolean;
  onSaved: () => void;
}

export default function DebtForm({ parsedData, transcript, isEdit, onSaved }: DebtFormProps) {
  const [formData, setFormData] = useState<ParsedDebtResult>({
    nguoi_no: '',
    so_tien: 0,
    noi_dung: '',
    ngay: new Date().toISOString().split('T')[0],
    loai: 'no'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [personBalance, setPersonBalance] = useState<number | null>(null);
  const [shouldAddUser, setShouldAddUser] = useState(false);
  
  // New state for selectable debts
  const [outstandingDebts, setOutstandingDebts] = useState<IDebt[]>([]);
  const [selectedDebtIds, setSelectedDebtIds] = useState<number[]>([]);

  const rawUsers = useLiveQuery(() => db.users.toArray());
  const users = useMemo(() => rawUsers || [], [rawUsers]);

  // Comparison logic
  const matchedUser = useMemo(() => {
    if (!formData.nguoi_no) return null;
    
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const inputName = normalize(formData.nguoi_no);
    
    // 1. Thử khớp chính xác trước
    const exactMatch = users.find(u => u.name.toLowerCase() === formData.nguoi_no.toLowerCase());
    if (exactMatch) return exactMatch;

    // 2. Nếu không khớp chính xác, thử khớp không dấu (Smart Match)
    return users.find(u => normalize(u.name) === inputName);
  }, [formData.nguoi_no, users]);

  const isNewUser = formData.nguoi_no && !matchedUser;

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
      const exists = users.some(u => u.name.toLowerCase() === parsedData.nguoi_no.toLowerCase());
      setShouldAddUser(!exists);
    }
  }, [parsedData, users]);

  // Check balance in real-time for UX feedback
  useEffect(() => {
    async function checkBalance() {
      if (formData.nguoi_no) {
        const debts = await db.debts
          .where('nguoi_no')
          .equalsIgnoreCase(formData.nguoi_no)
          .and(d => d.loai === 'no')
          .toArray();
        const total = debts.reduce((sum, d) => sum + (d.so_tien || 0), 0);
        setPersonBalance(total);
      } else {
        setPersonBalance(null);
      }
    }
    checkBalance();
  }, [formData.nguoi_no]);

  // Effect to fetch outstanding debts when user is matched and it's a repayment
  useEffect(() => {
    const fetchDebts = async () => {
      if (formData.loai === 'tra' && matchedUser) {
        const debts = await db.debts
          .where('nguoi_no')
          .equalsIgnoreCase(matchedUser.name)
          .and(d => d.loai === 'no')
          .toArray();
        setOutstandingDebts(debts);
      } else {
        setOutstandingDebts([]);
        setSelectedDebtIds([]);
      }
    };
    fetchDebts();
  }, [matchedUser, formData.loai]);

  // Smart Auto-Selection Logic (Refined for Strictness)
  useEffect(() => {
    if (formData.loai === 'tra' && formData.so_tien > 0 && outstandingDebts.length > 0) {
      const currentSelectedTotal = outstandingDebts
        .filter(d => selectedDebtIds.includes(d.id!))
        .reduce((sum, d) => sum + d.so_tien, 0);

      // Nếu đang chọn thiếu và không phải do người dùng chủ động xóa hết, hãy tự động điền thêm
      if (currentSelectedTotal < formData.so_tien) {
        // 1. Thử tìm một khoản nợ khớp chính xác số tiền (nếu chưa chọn gì)
        if (selectedDebtIds.length === 0) {
          const exactMatch = outstandingDebts.find(d => d.so_tien === formData.so_tien);
          if (exactMatch) {
            setSelectedDebtIds([exactMatch.id!]);
            return;
          }
        }

        // 2. Tự động tích thêm các mục (Waterfall style) cho đến khi gần đủ hoặc đủ
        let newTotal = currentSelectedTotal;
        const newSelected = [...selectedDebtIds];
        let changed = false;

        for (const debt of outstandingDebts) {
          if (newTotal >= formData.so_tien) break;
          if (!newSelected.includes(debt.id!)) {
            newSelected.push(debt.id!);
            newTotal += debt.so_tien;
            changed = true;
          }
        }

        if (changed) {
          setSelectedDebtIds(newSelected);
        }
      }
    }
  }, [formData.so_tien, outstandingDebts.length, formData.loai]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nguoi_no) return;
    // Chỉ yêu cầu số tiền > 0 nếu KHÔNG phải lệnh xóa sạch nợ
    if (!formData.isClearAll && formData.so_tien <= 0) return;
    
    setIsSaving(true);
    try {
      const finalName = matchedUser ? matchedUser.name : formData.nguoi_no;
      
      if (isNewUser && shouldAddUser) {
        await addUser(formData.nguoi_no);
      }

      // --- SMART WATERFALL / SELECTED DEBTS LOGIC ---
      if (formData.loai === 'tra' && !isEdit) {
        if (formData.isClearAll) {
          // XÓA SẠCH NỢ: Tìm và xóa TẤT CẢ bản ghi nợ của người này
          await db.debts
            .where('nguoi_no')
            .equalsIgnoreCase(finalName)
            .and(d => d.loai === 'no')
            .delete();
        } else {
          // Xử lý nợ theo danh sách chọn hoặc tự động (Waterfall)
          let remainingRepayment = formData.so_tien;
          
          // 1. Nếu có nợ được chọn, ưu tiên trừ nợ đó trước
          if (selectedDebtIds.length > 0) {
            const selectedDebts = outstandingDebts.filter(d => d.id && selectedDebtIds.includes(d.id));
            for (const debt of selectedDebts) {
              if (remainingRepayment <= 0) break;
              if (remainingRepayment >= debt.so_tien) {
                remainingRepayment -= debt.so_tien;
                await db.debts.delete(debt.id!);
              } else {
                await db.debts.update(debt.id!, { so_tien: debt.so_tien - remainingRepayment });
                remainingRepayment = 0;
              }
            }
          }

          // 2. Nếu vẫn còn tiền nợ sau khi trừ nợ chọn (hoặc không chọn gì), thực hiện Waterfall nợ cũ
          if (remainingRepayment > 0) {
            const userDebts = await db.debts
              .where('nguoi_no')
              .equalsIgnoreCase(finalName)
              .and(d => d.loai === 'no')
              .toArray();

            for (const debt of userDebts) {
              // Bỏ qua nợ đã xử lý ở bước 1 (nếu có)
              if (selectedDebtIds.includes(debt.id!)) continue;
              if (remainingRepayment <= 0) break;

              if (remainingRepayment >= debt.so_tien) {
                remainingRepayment -= debt.so_tien;
                await db.debts.delete(debt.id!);
              } else {
                await db.debts.update(debt.id!, { so_tien: debt.so_tien - remainingRepayment });
                remainingRepayment = 0;
              }
            }
          }

          if (remainingRepayment > 0) {
            await addDebt({ ...formData, so_tien: remainingRepayment, nguoi_no: finalName } as Omit<IDebt, 'id'>);
          }
        }
      } else {
        // --- NORMAL SAVE / UPDATE LOGIC ---
        if (parsedData?.id) {
          await db.debts.update(parsedData.id, { ...formData, nguoi_no: finalName });
        } else {
          await addDebt({ ...formData, nguoi_no: finalName } as Omit<IDebt, 'id'>);
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
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
      }, 1000);
    } catch (error) {
      console.error("Error saving debt:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!parsedData && !formData.nguoi_no) return null;

  return (
    <div className="w-full max-w-md mt-6 p-7 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {transcript && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-l-4 border-indigo-500">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Dữ liệu gốc (Máy nghe được)</p>
          <p className="text-slate-600 dark:text-slate-300 italic font-medium">
            &ldquo;{transcript}&rdquo;
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          {isEdit ? <Edit2 className="text-indigo-500 w-6 h-6"/> : <CheckCircle className="text-emerald-500 w-6 h-6"/>}
          {isEdit ? 'Chỉnh sửa bản ghi' : 'Xác nhận thông tin'}
        </h3>
        
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
          formData.loai === 'tra' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
            : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
        }`}>
          {formData.loai === 'tra' ? 'Trả nợ' : 'Nợ mới'}
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

          {isNewUser && formData.nguoi_no && (
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
        
        {!formData.isClearAll ? (
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
                    className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none rounded-2xl font-black text-2xl text-slate-800 dark:text-white transition-all shadow-inner"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ</div>
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
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none rounded-2xl font-bold text-slate-800 dark:text-white transition-all shadow-inner"
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

        {/* SELECTABLE DEBTS SECTION */}
        <AnimatePresence>
          {formData.loai === 'tra' && !formData.isClearAll && outstandingDebts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between ml-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <ReceiptText size={10} /> Các khoản nợ chọn để trừ
                </div>
                <div className="flex gap-3">
                  {selectedDebtIds.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => setSelectedDebtIds([])}
                      className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                    >
                      Bỏ chọn hết
                    </button>
                  )}
                </div>
              </div>

              {/* ALLOCATION SUMMARY BAR */}
              <div className={`p-3 rounded-xl border flex justify-between items-center text-[11px] font-bold transition-colors ${
                (outstandingDebts.filter(d => selectedDebtIds.includes(d.id!)).reduce((sum, d) => sum + d.so_tien, 0) < formData.so_tien && selectedDebtIds.length < outstandingDebts.length)
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'
              }`}>
                <div className="flex flex-col gap-0.5">
                  <div className="text-slate-400 font-bold text-[9px] uppercase tracking-tighter">Đã chọn</div>
                  <div className={(outstandingDebts.filter(d => selectedDebtIds.includes(d.id!)).reduce((sum, d) => sum + d.so_tien, 0) < formData.so_tien && selectedDebtIds.length < outstandingDebts.length) ? 'text-amber-600' : 'text-indigo-600 dark:text-indigo-400'}>
                    {outstandingDebts
                      .filter(d => selectedDebtIds.includes(d.id!))
                      .reduce((sum, d) => sum + d.so_tien, 0)
                      .toLocaleString()}đ
                  </div>
                </div>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="text-slate-400 font-bold text-[9px] uppercase tracking-tighter">Tổng trả</div>
                  <div className="text-emerald-600">
                    {formData.so_tien.toLocaleString()}đ
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-hide">
                {outstandingDebts.map((debt) => {
                  const isSelected = selectedDebtIds.includes(debt.id!);
                  const totalSelected = outstandingDebts
                    .filter(d => selectedDebtIds.includes(d.id!))
                    .reduce((sum, d) => sum + d.so_tien, 0);
                  
                  // UX LOGIC: Disable if not selected and total already covered
                  const isDisabled = !isSelected && totalSelected >= formData.so_tien;

                  return (
                    <div
                      key={debt.id}
                      onClick={() => {
                        if (isDisabled) return;
                        setSelectedDebtIds(prev => 
                          isSelected ? prev.filter(id => id !== debt.id) : [...prev, debt.id!]
                        );
                      }}
                      className={`
                        group relative p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between
                        ${isSelected 
                          ? 'bg-indigo-50/50 border-indigo-500 shadow-sm' 
                          : isDisabled
                            ? 'bg-slate-50/50 border-transparent opacity-40 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-950 border-transparent hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer'}
                      `}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-black transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-800 dark:text-slate-200'}`}>
                          {debt.so_tien.toLocaleString()}đ
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{debt.ngay}</span>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                            • {debt.noi_dung}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                        ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}
                      `}>
                        {isSelected && <CheckCircle size={14} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {formData.loai === 'tra' && personBalance === 0 && !formData.isClearAll && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: 10 }}
              className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-3 overflow-hidden"
            >
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Không tìm thấy khoản nợ cũ</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                  Người này hiện không có khoản nợ nào trong sổ. Ghi nhận <span className="font-bold">Trả nợ</span> lúc này sẽ tạo ra số dư trả trước.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          type="submit"
          disabled={isSaving || (
            formData.loai === 'tra' && 
            !formData.isClearAll && 
            outstandingDebts.length > 0 && 
            (outstandingDebts.filter(d => selectedDebtIds.includes(d.id!)).reduce((sum, d) => sum + d.so_tien, 0) < formData.so_tien) &&
            selectedDebtIds.length < outstandingDebts.length
          )}
          className={`w-full py-5 rounded-[1.75rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale-[0.5] ${
            formData.isClearAll 
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
                : (formData.isClearAll ? 'Xác nhận xóa sạch nợ' : (formData.loai === 'tra' ? 'Xác nhận trả nợ' : 'Lưu sổ nợ'))}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
