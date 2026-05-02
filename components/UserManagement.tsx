"use client";

import { useState, useMemo } from 'react';
import { IUser, IDebt } from '@/types/debt';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateUser, deleteUser, getDebtsByUser } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, ChevronRight, User as UserIcon, X, History, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function UserManagement() {
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [newName, setNewName] = useState('');

  const handleEdit = (user: IUser) => {
    setEditingUser(user);
    setNewName(user.name);
  };

  const saveEdit = async () => {
    if (editingUser?.id && newName.trim()) {
      await updateUser(editingUser.id, newName.trim());
      setEditingUser(null);
    }
  };

  const handleDelete = async (user: IUser) => {
    if (user.id && confirm(`Bạn có chắc muốn xóa người nợ "${user.name}"?`)) {
      await deleteUser(user.id);
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!selectedUser ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid gap-3"
          >
            {users.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                <UserIcon className="mx-auto w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Chưa có người nợ nào trong danh sách.</p>
              </div>
            ) : (
              users.map((user) => (
                <div 
                  key={user.id} 
                  className="group bg-white dark:bg-slate-900 p-4 pl-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <UserIcon size={20} />
                    </div>
                    {editingUser?.id === user.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <input 
                          autoFocus
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border-b-2 border-indigo-500 outline-none p-1 font-bold text-lg"
                        />
                        <button onClick={saveEdit} className="text-emerald-500 font-bold p-2">Lưu</button>
                        <button onClick={() => setEditingUser(null)} className="text-slate-400 p-2"><X size={18}/></button>
                      </div>
                    ) : (
                      <div className="cursor-pointer flex-1" onClick={() => setSelectedUser(user)}>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{user.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Nhấn để xem chi tiết</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                    <button onClick={() => handleEdit(user)} className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(user)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-all">
                      <Trash2 size={18} />
                    </button>
                    <button onClick={() => setSelectedUser(user)} className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full ml-1">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <UserHistory user={selectedUser} onBack={() => setSelectedUser(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserHistory({ user, onBack }: { user: IUser, onBack: () => void }) {
  const rawUserDebts = useLiveQuery(() => getDebtsByUser(user.name));
  const userDebts = useMemo(() => rawUserDebts || [], [rawUserDebts]);
  
  const total = useMemo(() => {
    return userDebts.reduce((s: number, d: IDebt) => {
      const val = d.so_tien || 0;
      return d.loai === 'tra' ? s - val : s + val;
    }, 0);
  }, [userDebts]);

  return (
    <motion.div 
      key="detail"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-md text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">{user.name}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase">Chi tiết công nợ</p>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">Số dư hiện tại</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black">{total.toLocaleString('vi-VN')}</span>
            <span className="text-lg opacity-60">vnđ</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-indigo-100 uppercase opacity-80">{userDebts.length} Khoản nợ ghi nhận</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold flex items-center gap-2 text-slate-600 uppercase text-xs tracking-widest">
            <History size={16} /> Lịch sử giao dịch
          </h3>
        </div>

        <div className="space-y-3">
          {userDebts.length === 0 ? (
            <p className="text-center py-8 text-slate-400 italic">Chưa có lịch sử giao dịch.</p>
          ) : (
            userDebts.map((debt) => (
              <div key={debt.id} className="bg-white dark:bg-slate-900 p-5 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100 uppercase">{debt.noi_dung || 'Nợ không tiêu đề'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(debt.ngay), 'dd/MM/yyyy')}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-lg font-black tracking-tight ${debt.loai === 'tra' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {debt.loai === 'tra' ? '-' : ''}{debt.so_tien.toLocaleString('vi-VN')}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">vnđ</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
