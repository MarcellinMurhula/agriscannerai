import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCcw, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CameraScanProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export function CameraScan({ onCapture, onClose }: CameraScanProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      const base64 = capturedImage.split(',')[1];
      onCapture(base64);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#F8FAF8] flex flex-col items-center justify-center p-4"
    >
      <div className="relative w-full max-w-lg aspect-[3/4] bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-white">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={cn("w-full h-full object-cover opacity-80", capturedImage && "hidden")}
            />
            {capturedImage && (
              <img 
                src={capturedImage} 
                alt="Captured crop" 
                className="w-full h-full object-cover opacity-80"
              />
            )}
            
            {/* Viewfinder brackets */}
            {!capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -translate-x-1 -translate-y-1 rounded-sm"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white translate-x-1 -translate-y-1 rounded-sm"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -translate-x-1 translate-y-1 rounded-sm"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white translate-x-1 translate-y-1 rounded-sm"></div>
                </div>
              </div>
            )}

            {/* Status indicator */}
            <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <div className="w-2 h-2 rounded-full bg-red-500 status-dot"></div>
              <span className="text-[10px] font-bold text-white tracking-[0.2em]">SCANNER LIVE</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-10 w-full max-w-lg flex items-center justify-center gap-8">
        <button 
          onClick={onClose}
          className="w-14 h-14 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-red-500 transition-all flex items-center justify-center shadow-sm"
        >
          <X className="w-6 h-6" />
        </button>

        {!capturedImage ? (
          <button 
            onClick={capturePhoto}
            disabled={!!error}
            className="w-24 h-24 rounded-full bg-white border-8 border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl group"
          >
            <div className="w-12 h-12 rounded-full bg-agri-primary group-hover:scale-110 transition-transform" />
          </button>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={retakePhoto}
              className="w-14 h-14 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-agri-primary transition-all flex items-center justify-center shadow-sm"
            >
              <RefreshCcw className="w-6 h-6" />
            </button>
            <button 
              onClick={confirmPhoto}
              className="px-8 h-14 rounded-2xl bg-agri-primary text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <Check className="w-6 h-6" />
              DÉTECTER
            </button>
          </div>
        )}
        
        <div className="w-14 h-14 invisible" /> {/* Spacer */}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
