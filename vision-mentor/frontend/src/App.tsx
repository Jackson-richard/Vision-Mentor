import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const WS_URL = 'ws://127.0.0.1:8000/ws';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [statusText, setStatusText] = useState('Connect');

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio state
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Audio Playback Queue
  const nextPlayTimeRef = useRef<number>(0);

  // Screen Capture Interval
  const frameIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const initWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatusText('Connecting...');
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      setIsConnected(true);
      setStatusText('Connected');
    };

    socket.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'audio' && msg.data) {
          playPCM16(msg.data);
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setStatusText('Connect');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setStatusText('Connect');
    };

    wsRef.current = socket;
  };

  const playPCM16 = (base64Data: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    const ctx = audioContextRef.current;

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32Array.length, 16000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
    }
    
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
  };

  const startMic = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      // Deprecated but highly standard cross-browser implementation for quick hackathons
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const float32Data = e.inputBuffer.getChannelData(0);
        const int16Data = new Int16Array(float32Data.length);
        for (let i = 0; i < float32Data.length; i++) {
            let s = Math.max(-1, Math.min(1, float32Data[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to Base64 manually to avoid large buffer delays
        let binary = '';
        const bytes = new Uint8Array(int16Data.buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);

        wsRef.current.send(JSON.stringify({
          realtime_input: {
            media_chunks: [
              {
                mime_type: "audio/pcm;rate=16000",
                data: base64
              }
            ]
          }
        }));
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      
      setIsMicActive(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone permission denied or not available.");
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 2, max: 5 } } // low framerate
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsScreenShared(true);

      // Extract frames
      frameIntervalRef.current = window.setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = 1280; // normalized width
          canvas.height = (video.videoHeight / video.videoWidth) * canvas.width;
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64Jpeg = dataUrl.split(',')[1];
          
          wsRef.current.send(JSON.stringify({
            realtime_input: {
              media_chunks: [
                {
                  mime_type: "image/jpeg",
                  data: base64Jpeg
                }
              ]
            }
          }));
        }
      }, 1000); // 1 frame per second

    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopAll = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsMicActive(false);
    setIsScreenShared(false);
    setIsConnected(false);
    setStatusText('Connect');
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Vision Mentor</h1>
        <p className="subtitle">Real-time Multimodal AI Tutor</p>
      </div>

      <div className="controls">
        {!isConnected ? (
          <button onClick={initWebSocket}>
            <span>🔌</span> {statusText}
          </button>
        ) : (
          <button onClick={stopAll} className="active" style={{ background: '#ef4444', borderColor: '#b91c1c' }}>
            <span>Disconnect</span>
          </button>
        )}

        <button 
          onClick={startMic} 
          disabled={!isConnected || isMicActive}
          className={isMicActive ? "active" : ""}
        >
          <span className="icon">🎤</span> Voice Input
        </button>

        <button 
          onClick={startScreenShare} 
          disabled={!isConnected || isScreenShared}
          className={isScreenShared ? "active" : ""}
        >
          <span className="icon">📺</span> Share Screen
        </button>
      </div>

      <div className="preview-container">
        <div className={`status-indicator ${!isConnected ? 'offline' : (isScreenShared || isMicActive) ? 'connecting' : ''}`}>
          <div className={`dot ${!isConnected ? 'offline' : (isScreenShared || isMicActive) ? 'connecting' : ''}`}></div>
          {isConnected ? (isScreenShared || isMicActive ? 'Transmitting Data' : 'Connected') : 'Offline'}
        </div>
        
        <video 
          ref={videoRef} 
          muted 
          style={{ display: isScreenShared ? 'block' : 'none' }}
        />
        
        {!isScreenShared && (
          <div className="placeholder-text">
            Start screen sharing to let the AI see your context.
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="canvas-hidden" />
    </div>
  );
}
