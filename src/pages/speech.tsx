// /pages/index.js
import { useState } from "react";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  let mediaRecorder: MediaRecorder;

  const startRecording = async () => {
    setIsRecording(true);
    setTranscript("");
    setError("");

    try {
      // Request access to the user's microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      const audioChunks: BlobPart[] | undefined = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const reader = new FileReader();

        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64AudioMessage = typeof reader.result === "string" ? reader.result.split(",")[1] : "";

          // Send audio data to API route
          const response = await fetch("/api/speech-to-text", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ audioData: base64AudioMessage }),
          });

          const result = await response.json();

          if (response.ok) {
            setTranscript(result.text);
          } else {
            setError("Speech recognition failed. Please try again.");
          }
        };
      };

      mediaRecorder.start();
    } catch (err) {
      console.error(err);
      setError("Error accessing the microphone");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorder.stop();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Speech to Text Converter</h1>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      {transcript && (
        <div style={{ marginTop: "20px" }}>
          <h3>Transcript:</h3>
          <p>{transcript}</p>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}