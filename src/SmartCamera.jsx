import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

export default function SmartCamera({ id, field, onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    if (stream) stopCamera();
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Ошибка доступа к камере:", err);
      alert("Не удалось открыть камеру. Проверьте разрешения.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // ================= СНИМОК С ЗАЩИТОЙ ОТ ЧБ ПОЛОС =================
  const capture = async () => {
    const video = videoRef.current;
    if (!video || !stream) return;

    // ПУТЬ 1: Нативный захват кадра через ImageCapture (Решает проблему на Android)
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && ('ImageCapture' in window || window.ImageCapture)) {
        const imageCapture = new window.ImageCapture(videoTrack);
        
        // Запрашиваем прямой снимок с матрицы камеры
        const blob = await imageCapture.takePhoto();
        
        const reader = new FileReader();
        reader.onloadend = () => {
          onCapture(reader.result, id, field); // Возвращает чистый цветной Base64 JPEG
        };
        reader.readAsDataURL(blob);
        return; // Успешно выходим, холст не понадобился
      }
    } catch (error) {
      console.warn("ImageCapture не поддерживается или дал сбой, переключаемся на Canvas Fallback:", error);
    }

    // ПУТЬ 2: Резервный Canvas (Для iOS/Safari, где нет бага «зебры»)
    if (video.readyState < 2 || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Флаг willReadFrequently: true заставляет систему обрабатывать графику в софтварном режиме,
    // что спасает от сбоев видеопамяти графического чипа.
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(dataUrl, id, field);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-4 font-sans">
      {/* Верхняя панель */}
      <div className="flex justify-between items-center text-white z-10 pt-2">
        <span className="text-xs font-mono bg-black/40 px-3 py-1 rounded-full border border-white/10">
          {field === 'photoInv' ? 'Режим: Снимок инвентарника' : 'Режим: Общий вид ОС'}
        </span>
        <button onClick={onClose} className="p-2 bg-white/10 active:bg-white/20 rounded-full transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Контейнер видеопотока */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-contain"
        />
        
        {field === 'photoInv' && (
          <div className="absolute border-2 border-dashed border-yellow-400 w-72 h-28 rounded-2xl pointer-events-none flex flex-col items-center justify-center p-2 bg-yellow-400/5 shadow-[0_0_50px_rgba(0,0,0,0.6)]">
            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-md">
              Поместите инвентарный номер сюда
            </span>
          </div>
        )}
      </div>

      {/* Нижняя панель управления */}
      <div className="flex justify-between items-center gap-6 px-10 pb-6 z-10 mt-auto">
        <button onClick={toggleCamera} className="p-3.5 bg-white/10 active:bg-white/20 text-white rounded-full transition-all active:scale-95 border border-white/5">
          <RefreshCw className="w-5 h-5" />
        </button>
        
        <button onClick={capture} className="w-20 h-20 bg-white p-1 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-xl shadow-black/50">
          <div className="w-full h-full border-4 border-black/5 rounded-full flex items-center justify-center">
            <div className="w-14 h-14 bg-red-600 rounded-full hover:bg-red-700 transition-colors" />
          </div>
        </button>

        <div className="w-12 h-12 invisible" />
      </div>
    </div>
  );
}