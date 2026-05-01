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
          let currentInterim = "";
          let newFinal = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              newFinal += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          
          if (newFinal) {
            setTranscript((prev) => {
              const separator = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
              return (prev + separator + newFinal.trim()).trim();
            });
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
