"use client";

import { useState, useCallback } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import DebtForm from "@/components/DebtForm";
import { parseSpeechToDebt } from "@/lib/parser";
import { ParsedDebtResult } from "@/types/debt";
import Link from "next/link";
import { ReceiptText } from "lucide-react";

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedDebtResult | null>(null);

  const handleSpeechResult = useCallback((text: string) => {
    if (text.trim().split(" ").length < 2) return;
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
          <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">Giọng nói</p>
        </div>
        <Link 
          href="/report"
          className="p-3.5 bg-white dark:bg-slate-900 rounded-[1.25rem] shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-all"
        >
          <ReceiptText size={24} />
        </Link>
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-8 px-5 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[1.5rem] border border-indigo-100/50 dark:border-indigo-800/30">
          <p className="text-indigo-900/90 dark:text-indigo-300 font-semibold mb-1">Bấm vào micro và đọc nội dung cần ghi</p>
          <p className="text-sm text-indigo-700/60 dark:text-indigo-400/60 italic sm:inline-block">vd: &quot;anh Nam nợ 200k tiền ăn sáng&quot;</p>
        </div>

        <VoiceRecorder onResult={handleSpeechResult} />

        <DebtForm parsedData={parsedData} onSaved={() => setParsedData(null)} />
      </div>
    </main>
  );
}
