"use client";

import { useState, useCallback } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import DebtForm from "@/components/DebtForm";
import { parseSpeechToDebt } from "@/lib/parser";
import { ParsedDebtResult } from "@/types/debt";
import Link from "next/link";
import { ReceiptText, LogIn, LogOut, Cloud, HardDrive, AlertCircle, HelpCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import Image from "next/image";

export default function Home() {
  const { user, logout } = useAuth();
  const [parsedData, setParsedData] = useState<ParsedDebtResult | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [showGuide, setShowGuide] = useState(true);

  const handleSpeechResult = useCallback((text: string) => {
    if (text.trim().split(" ").length < 2) return;
    setLastTranscript(text);
    const data = parseSpeechToDebt(text);
    setParsedData(data);
    setShowGuide(false);
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
          {/* Guide Toggle - Pro UX */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`p-2.5 rounded-xl border transition-all ${
              showGuide 
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-200 dark:shadow-none' 
                : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 shadow-sm'
            }`}
            title={showGuide ? "Đóng hướng dẫn" : "Xem hướng dẫn"}
          >
            {showGuide ? <X size={20} /> : <HelpCircle size={20} />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => logout()}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
              <Image
                src={user.picture}
                alt={user.name}
                width={36}
                height={36}
                className="rounded-full border-2 border-indigo-100 dark:border-indigo-900"
              />
            </div>
          ) : (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/login/google`}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 transition-all"
            >
              <LogIn size={16} className="text-indigo-600" />
              <span>Login</span>
            </a>
          )}

          <Link
            href="/report"
            className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 text-rose-500 hover:scale-105 active:scale-95 transition-all"
          >
            <ReceiptText size={20} />
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col items-center flex-1">
        {showGuide && (
          <div className="w-full max-w-sm mb-10 overflow-hidden rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/50 shadow-2xl shadow-indigo-200/20 dark:shadow-none animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-5 pb-4 border-b border-white/40 dark:border-slate-800/50 relative">
              <button 
                onClick={() => setShowGuide(false)}
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
