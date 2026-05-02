"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(isRecording);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("Checking Speech Recognition support...");
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.log("SpeechRecognition not found in window");
        setHasChecked(true);
        return;
      }

      try {
        const isAndroid = /Android/i.test(navigator.userAgent);
        const recog = new SpeechRecognition();
        
        // Android thường bị bug lặp chữ khi bật continuous, nên ta sẽ quản lý thủ công
        recog.continuous = !isAndroid; 
        recog.interimResults = true;
        recog.lang = 'vi-VN';

        recog.onresult = (event: any) => {
          const finalFragments: string[] = [];
          let currentInterim = "";

          for (let i = 0; i < event.results.length; ++i) {
            const result = event.results[i];
            const resultText = result[0].transcript.trim();
            
            if (result.isFinal && resultText) {
              finalFragments.push(resultText);
            } else if (!result.isFinal) {
              currentInterim = resultText;
            }
          }
          
          // Lọc bỏ trùng lặp thông minh hơn
          const uniqueFragments = finalFragments.filter((current, idx) => {
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            const currentNorm = normalize(current);
            if (!currentNorm) return false;

            return !finalFragments.some((other, otherIdx) => {
              if (idx === otherIdx) return false;
              const otherNorm = normalize(other);
              return otherNorm.length > currentNorm.length && otherNorm.includes(currentNorm);
            });
          });

          const mergedTranscript = uniqueFragments.join(" ").trim();
          
          if (mergedTranscript) {
            setTranscript(mergedTranscript);
          }
          
          setInterimTranscript(currentInterim);
        };

        recog.onerror = (event: any) => {
          console.error("Speech recognition error event:", event);
          if (event.error === 'not-allowed') {
            setError("Microphone permission denied.");
          } else {
            setError(`Speech recognition error: ${event.error}`);
          }
          setIsRecording(false);
        };

        recog.onend = () => {
          console.log("Speech recognition ended");
          // Nếu vẫn đang trong trạng thái ghi âm (isRecording) mà máy tự ngắt (thường trên Android), hãy khởi động lại
          if (isRecordingRef.current) {
            try {
              recog.start();
            } catch (e) {
              console.error("Failed to auto-restart recognition:", e);
              setIsRecording(false);
            }
          } else {
            setIsRecording(false);
          }
        };

        setRecognition(recog);
        console.log("SpeechRecognition initialized successfully");
      } catch (e) {
        console.error("Speech recognition initialization failed:", e);
      } finally {
        setHasChecked(true);
      }
    }
  }, []);

  const startRecording = useCallback(() => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    
    if (!recognition) {
      setError("Browser does not support Web Speech API.");
      return;
    }

    try {
      recognition.start();
      setIsRecording(true);
    } catch (err: any) {
      if (err.name === "InvalidStateError") {
        setIsRecording(true);
      } else {
        console.error("Failed to start speech recognition:", err);
        setError("Failed to start speech recognition.");
      }
    }
  }, [recognition]);

  const stopRecording = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  }, [recognition]);
  
  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isRecording,
    transcript,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported: !!recognition,
    hasChecked
  };
}
