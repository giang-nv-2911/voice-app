import { IDebt } from '@/types/debt';
import { format } from 'date-fns';

export default function DebtList({ debts }: { debts: IDebt[] }) {
  if (debts.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
        <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu phù hợp.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {debts.map((debt) => (
        <div key={debt.id} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between gap-4 transition-all hover:shadow-md">
          <div className="flex flex-col">
            <h4 className="font-bold text-lg text-slate-800 dark:text-white leading-none mb-1.5">{debt.nguoi_no}</h4>
            <span className="text-sm text-slate-500 font-medium">{debt.noi_dung || 'Không có nội dung'}</span>
            <span className="text-xs text-slate-400 mt-2 font-mono">{format(new Date(debt.ngay), 'dd/MM/yyyy')}</span>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between">
            <span className="font-black text-xl text-rose-500 tracking-tight">
              {debt.so_tien.toLocaleString('vi-VN')} <span className="text-sm font-bold">đ</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
