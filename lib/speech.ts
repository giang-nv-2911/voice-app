"use client";

import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [hasChecked, setHasChecked] = useState(false);

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
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'vi-VN';

        recog.onresult = (event: any) => {
          let finalTranscript = "";
          let currentInterim = "";

          for (let i = 0; i < event.results.length; ++i) {
            const result = event.results[i];
            const resultText = result[0].transcript;
            
            if (result.isFinal) {
              const currentTrimmed = finalTranscript.trim().toLowerCase();
              const newTrimmed = resultText.trim().toLowerCase();
              
              // Smart Merge: Nếu kết quả mới bắt đầu bằng kết quả cũ (cumulative), thì thay thế.
              // Nếu không, thì cộng dồn (incremental).
              if (newTrimmed.length > currentTrimmed.length && newTrimmed.startsWith(currentTrimmed)) {
                finalTranscript = resultText;
              } else {
                finalTranscript += (finalTranscript ? " " : "") + resultText.trim();
              }
            } else {
              currentInterim = resultText; // Interim thường chỉ lấy cái cuối cùng trôi nổi
            }
          }
          
          if (finalTranscript) {
            setTranscript(finalTranscript.trim());
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
          setIsRecording(false);
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
