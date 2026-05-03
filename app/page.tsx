"use client";

import { useState, useCallback, useEffect } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import DebtForm from "@/components/DebtForm";
import { parseSpeechToDebt } from "@/lib/parser";
import { ParsedDebtResult } from "@/types/debt";
import Link from "next/link";
import { ReceiptText, LogOut, Cloud, HardDrive, HelpCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Home() {
  const { user, logout } = useAuth();
  const [parsedData, setParsedData] = useState<ParsedDebtResult | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [showGuide, setShowGuide] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Initialize guide state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hideGuide');
    if (saved === 'true') {
      setShowGuide(false);
    }
  }, []);

  // Professional state persistent toggle
  const toggleGuide = useCallback(() => {
    setShowGuide(prev => {
      const next = !prev;
      localStorage.setItem('hideGuide', String(!next));
      return next;
    });
  }, []);

  const handleSpeechResult = useCallback((text: string) => {
    if (text.trim().split(" ").length < 2) return;
    setLastTranscript(text);
    const data = parseSpeechToDebt(text);
    setParsedData(data);

    // Auto-hide but keep persistent if it was already hidden
    setShowGuide(false);
    localStorage.setItem('hideGuide', 'true');
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-24 pb-20 relative">
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 bg-clip-text text-transparent transform transition-all duration-500">
            Sổ Nợ
          </h1>
          <p className="font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-2">
            Giọng nói
            {user ? (
              <span className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                <Cloud size={10} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-800">
                <HardDrive size={10} /> Local
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main utilities grouped */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleGuide}
              className={`w-[42px] h-[42px] flex items-center justify-center rounded-xl border transition-all ${showGuide
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-100 dark:shadow-none'
                : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 shadow-sm'
                }`}
              title="Hướng dẫn"
            >
              {showGuide ? <X size={20} /> : <HelpCircle size={20} />}
            </button>

            <Link
              href="/report"
              className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-rose-500 hover:scale-105 active:scale-95 transition-all"
              title="Lịch sử & Báo cáo"
            >
              <ReceiptText size={20} />
            </Link>
          </div>

          {/* Auth Action - Prominent & Final */}
          {user ? (
            <div className="relative pl-1 flex-shrink-0">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative group transition-all"
              >
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-0 group-hover:opacity-20 transition-opacity" />
                <Image
                  src={user.picture}
                  alt={user.name}
                  width={42}
                  height={42}
                  className="relative rounded-full border-2 border-white dark:border-slate-800 shadow-md transform group-active:scale-95 transition-transform"
                />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 8, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full z-50 w-48 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-800/50 shadow-2xl"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                      </div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-sm font-bold"
                      >
                        <LogOut size={16} />
                        Đăng xuất
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/login/google`}
              className="h-[42px] flex items-center gap-2 px-3 sm:px-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[12px] font-black hover:scale-[1.02] active:scale-[0.98] transition-all group flex-shrink-0"
            >
              <div className="relative w-5 h-5">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <span className="hidden sm:inline">Google Login</span>
            </a>
          )}
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col items-center flex-1">
        {showGuide && (
          <div className="w-full max-w-sm mb-10 overflow-hidden rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/50 shadow-2xl shadow-indigo-200/20 dark:shadow-none animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-5 pb-4 border-b border-white/40 dark:border-slate-800/50 relative">
              <button
                onClick={toggleGuide}
                className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                  <span className="text-sm font-bold">A</span>
                </div>
                <h2 className="text-slate-800 dark:text-slate-200 font-bold text-lg leading-tight">Hướng dẫn ghi sổ</h2>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Bấm micro và nói tự nhiên theo các mẫu dưới đây</p>
            </div>

            <div className="p-5 space-y-6">
              {/* Pattern Flow */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.1em]">Cấu trúc chuẩn</p>
                <div className="flex items-center flex-wrap gap-2 group">
                  <span className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm border border-slate-100 dark:border-slate-700 transform transition-transform group-hover:scale-105">Tên</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-800" />
                  <span className="px-3 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-100 dark:shadow-none">Nợ / Trả</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-800" />
                  <span className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm border border-slate-100 dark:border-slate-700">Số tiền</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-800" />
                  <span className="px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-medium italic border border-dashed border-slate-200 dark:border-slate-700">Ghi chú...</span>
                </div>
              </div>

              {/* Examples */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Ví dụ thông dụng</p>
                <div className="grid gap-2.5">
                  {[
                    { tag: 'Ghi nợ', text: 'Nam nợ 200k tiền ăn sáng', color: 'rose', bg: 'bg-rose-500' },
                    { tag: 'Trả nợ', text: 'Lan trả 500 nghìn hôm qua', color: 'amber', bg: 'bg-amber-500' },
                    { tag: 'Xong', text: 'Anh Nam hết nợ', color: 'emerald', bg: 'bg-emerald-500' }
                  ].map((ex, i) => (
                    <div key={i} className="group relative p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-white dark:border-slate-700/50 transition-all hover:shadow-lg hover:shadow-indigo-100 dark:hover:shadow-none hover:-translate-y-0.5">
                      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${ex.bg}`} />
                      <div className="flex flex-col gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest text-${ex.color}-600 dark:text-${ex.color}-400`}>{ex.tag}</span>
                        <p className="text-slate-700 dark:text-slate-200 text-[13px] font-medium leading-relaxed italic">
                          &quot;{ex.text}&quot;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div className="mt-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <div className="flex gap-2">
                  <span className="text-sm">💡</span>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium leading-normal italic">
                    Bạn không cần nói ngày tháng, hệ thống sẽ tự động lấy ngày hôm nay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <VoiceRecorder onResult={handleSpeechResult} />

        <DebtForm
          parsedData={parsedData}
          transcript={lastTranscript}
          onSaved={() => {
            setParsedData(null);
            setLastTranscript("");
            // Keeping guide hidden after save to maintain focus on next action
          }}
        />
      </div>
    </main>
  );
}
