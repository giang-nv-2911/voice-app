"use client";

import { useState, useCallback } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import DebtForm from "@/components/DebtForm";
import { parseSpeechToDebt } from "@/lib/parser";
import { ParsedDebtResult } from "@/types/debt";
import Link from "next/link";
import { ReceiptText, LogIn, LogOut, Cloud, HardDrive } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import Image from "next/image";

export default function Home() {
  const { user, logout } = useAuth();
  const [parsedData, setParsedData] = useState<ParsedDebtResult | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>("");

  const handleSpeechResult = useCallback((text: string) => {
    if (text.trim().split(" ").length < 2) return;
    setLastTranscript(text);
    const data = parseSpeechToDebt(text);
    setParsedData(data);
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
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
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
                width={40}
                height={40}
                className="rounded-full border-2 border-indigo-100 dark:border-indigo-900"
              />
            </div>
          ) : (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/login/google`}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              <LogIn size={18} className="text-indigo-600" />
              <span>Login</span>
            </a>
          )}
          
          <Link
            href="/report"
            className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-all"
          >
            <ReceiptText size={20} />
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-8 px-5 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[1.5rem] border border-indigo-100/50 dark:border-indigo-800/30">
          <p className="text-indigo-900/90 dark:text-indigo-300 font-semibold mb-1">Bấm vào micro và đọc nội dung cần ghi</p>
          <p className="text-sm text-indigo-700/60 dark:text-indigo-400/60 italic sm:inline-block">vd: &quot;anh Nam nợ 200k tiền ăn sáng ngày 30 tháng 4 năm 2026&quot;</p>
        </div>

        <VoiceRecorder onResult={handleSpeechResult} />

        <DebtForm
          parsedData={parsedData}
          transcript={lastTranscript}
          onSaved={() => {
            setParsedData(null);
            setLastTranscript("");
          }}
        />
      </div>
    </main>
  );
}
