// src/components/VoiceRecorder.jsx
import { useState, useRef } from "react";
import { Mic, Square } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunks.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "voice-command.webm");

        await fetch(`${API_BASE}/api/voice/voice-command`, {
          method: "POST",
          body: formData
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("❌ Error al acceder al micrófono:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <button
      className="pad-btn mic"
      onClick={isRecording ? stopRecording : startRecording}
      title={isRecording ? "Detener grabación" : "Grabar comando por voz"}
      aria-label={isRecording ? "Detener grabación" : "Grabar comando por voz"}
      style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}
    >
      {isRecording ? <Square /> : <Mic />}
    </button>
  );
}
