import { IDebt } from '@/types/debt';
import { format } from 'date-fns';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteDebt, db } from '@/lib/db';
import DebtForm from './DebtForm';

export default function DebtList({ debts }: { debts: IDebt[] }) {
  const [editingDebt, setEditingDebt] = useState<IDebt | null>(null);

  if (debts.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
        <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu phù hợp.</p>
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc muốn xóa bản ghi này?")) {
      await deleteDebt(id);
    }
  };

  return (
    <>
      <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {debts.map((debt) => (
          <div key={debt.id} className="relative group bg-white dark:bg-slate-900 p-5 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex justify-between gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white leading-none uppercase tracking-tight">{debt.nguoi_no}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    debt.loai === 'tra' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                  }`}>
                    {debt.loai === 'tra' ? 'Trả' : 'Nợ'}
                  </span>
                </div>
                <span className="text-sm text-slate-500 font-bold mb-3">{debt.noi_dung || 'Không có nội dung'}</span>
                <span className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">{format(new Date(debt.ngay), 'dd/MM/yyyy')}</span>
              </div>
              
              <div className="flex flex-col items-end justify-between">
                <span className={`font-black text-2xl tracking-tighter ${debt.loai === 'tra' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {debt.loai === 'tra' ? '-' : ''}{debt.so_tien.toLocaleString('vi-VN')}
                  <span className="text-xs font-bold ml-1 uppercase">đ</span>
                </span>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingDebt(debt)}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => debt.id && handleDelete(debt.id)}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingDebt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto pt-24 pb-24">
          <div className="w-full max-w-md relative">
            <button 
              onClick={() => setEditingDebt(null)}
              className="absolute -top-12 right-0 text-white font-bold text-sm bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all border border-white/10"
            >
              Hủy chỉnh sửa
            </button>
            <DebtForm 
              parsedData={editingDebt} 
              isEdit={true}
              onSaved={() => setEditingDebt(null)} 
            />
          </div>
        </div>
      )}
    </>
  );
}
