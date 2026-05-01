"use client";

import { useSpeechRecognition } from '@/lib/speech';
import { Mic, Square, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface VoiceRecorderProps {
  onResult: (text: string) => void;
}

export default function VoiceRecorder({ onResult }: VoiceRecorderProps) {
  const { 
    isRecording, 
    transcript, 
    interimTranscript, 
    error, 
    startRecording, 
    stopRecording, 
    isSupported,
    hasChecked
  } = useSpeechRecognition();

  useEffect(() => {
    const finalTranscript = transcript.trim();
    if (!isRecording && finalTranscript) {
      onResult(finalTranscript);
    }
  }, [isRecording, transcript, onResult]);

  if (!hasChecked) {
    return (
      <div className="flex flex-col items-center gap-4 mt-10">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Đang kiểm tra trình duyệt...</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3">
        <AlertCircle size={24} />
        <div>
          <p className="text-sm font-bold">Trình duyệt không hỗ trợ Web Speech API.</p>
          <p className="text-xs opacity-80 mt-0.5">Vui lòng sử dụng Chrome (Android) hoặc Safari (iOS).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full mt-6">
      <div className="relative group perspective-1000">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`
            relative z-10 w-24 h-24 rounded-full flex items-center justify-center 
            transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-xl
            ${isRecording 
              ? 'bg-rose-500 hover:bg-rose-600 scale-95 shadow-rose-500/30' 
              : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-indigo-600/30'}
          `}
        >
          {isRecording ? (
            <Square className="w-8 h-8 text-white animate-pulse" strokeWidth={3} />
          ) : (
            <Mic className="w-10 h-10 text-white" strokeWidth={2.5} />
          )}
        </button>

        {isRecording && (
          <div className="absolute inset-0 z-0 bg-rose-500 rounded-full animate-ping opacity-25" />
        )}
      </div>

      <div className="w-full max-w-md min-h-32 p-6 rounded-[2rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center transition-all">
        {error ? (
          <p className="text-rose-500 text-sm font-medium">{error}</p>
        ) : isRecording ? (
          <div className="w-full animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-xs font-bold text-indigo-500 tracking-widest uppercase">Đang nghe...</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-medium text-xl min-h-7">
              {transcript} <span className="text-slate-400 dark:text-slate-600">{interimTranscript}</span>
            </p>
          </div>
        ) : transcript ? (
          <p className="text-slate-800 dark:text-slate-200 font-medium text-xl min-h-7 leading-relaxed">
            {transcript}
          </p>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 italic text-lg">Nhấn để bắt đầu ghi âm...</p>
        )}
      </div>
    </div>
  );
}
