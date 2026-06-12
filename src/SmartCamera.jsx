import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

export default function SmartCamera({ id, field, onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
<<<<<<< HEAD
  const [error, setError] = useState(null);
  const [qualityWarning, setQualityWarning] = useState(null);
  const isOverlay = field === 'photoInv';
=======
  const [facingMode, setFacingMode] = useState('environment'); // По умолчанию задняя камера
>>>>>>> bb2be7bdfc87e802c1f8bad635052fc40098b750

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

<<<<<<< HEAD
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Алгоритм проверки качества снимка (Засветы и Размытие)
  const checkImageQuality = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    let whitePixels = 0;
    const totalPixels = width * height;
    // Переводим в массив градаций серого для анализа четкости
    const grayData = new Int32Array(totalPixels);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      grayData[i/4] = brightness;
      
      // Считаем слишком яркие пиксели (блики/засветы)
      if (r > 245 && g > 245 && b > 245) {
        whitePixels++;
=======
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
>>>>>>> bb2be7bdfc87e802c1f8bad635052fc40098b750
      }
    } catch (err) {
      console.error("Ошибка доступа к камере:", err);
      alert("Не удалось открыть камеру. Проверьте разрешения в настройках браузера.");
    }
<<<<<<< HEAD

    // 1. Проверка на избыточный засвет (более 15% площади кадра)
    if ((whitePixels / totalPixels) > 0.15) {
      return "Обнаружен сильный засвет! Измените угол съемки или отойдите от прямого источника света.";
    }

    // 2. Оценка фокуса по методу Дисперсии Лапласиана
    let laplacianSum = 0;
    let count = 0;
    const laplacianBuffer = new Float32Array(totalPixels);

    for (let y = 1; y < height - 1; y += 2) { 
      for (let x = 1; x < width - 1; x += 2) {
        const idx = y * width + x;
        const val = (grayData[idx] * 4) - 
                    grayData[idx - 1] - 
                    grayData[idx + 1] - 
                    grayData[idx - width] - 
                    grayData[idx + width];
        laplacianBuffer[idx] = val;
        laplacianSum += val;
        count++;
      }
    }

    const laplacianMean = laplacianSum / count;
    let varianceSum = 0;
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = y * width + x;
        varianceSum += Math.pow(laplacianBuffer[idx] - laplacianMean, 2);
      }
    }
    
    const blurScore = varianceSum / count;
    // Порог размытия: если ниже 8.0 — снимок явно смазан
    if (blurScore < 8.0) {
      return "Фото слишком размытое или не в фокусе. Пожалуйста, зафиксируйте телефон и переснимите.";
    }

    return null;
=======
>>>>>>> bb2be7bdfc87e802c1f8bad635052fc40098b750
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !stream) return;

<<<<<<< HEAD
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;
      
      // Целевая пропорция модуля камеры (3:4 вертикальная)
      const targetAspect = 3 / 4;
      let sWidth = vWidth;
      let sHeight = vHeight;
      let sx = 0;
      let sy = 0;

      // Вычисляем координаты центрированного кропа (умный object-cover)
      if (vWidth / vHeight < targetAspect) {
        // Если поток уже, чем 3:4
        sHeight = vWidth / targetAspect;
        sy = (vHeight - sHeight) / 2;
      } else {
        // Если поток шире, чем 3:4 (стандартная ситуация для большинства смартфонов)
        sWidth = vHeight * targetAspect;
        sx = (vWidth - sWidth) / 2;
      }

      // Устанавливаем размеры холста строго под пропорции 3:4
      canvas.width = sWidth;
      canvas.height = sHeight;

      // Вырезаем центральную часть кадра и рисуем на холсте
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

      // Валидация качества
      const errorWarning = checkImageQuality(ctx, canvas.width, canvas.height);
      if (errorWarning) {
        setQualityWarning(errorWarning);
        return;
=======
    // ПУТЬ 1: Нативный захват через ImageCapture (Защита от ЧБ-зебры на Android)
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && ('ImageCapture' in window || window.ImageCapture)) {
        const imageCapture = new window.ImageCapture(videoTrack);
        const blob = await imageCapture.takePhoto();
        
        const reader = new FileReader();
        reader.onloadend = () => {
          onCapture(reader.result, id, field); // Возвращает цветной Base64 JPEG
        };
        reader.readAsDataURL(blob);
        return; 
>>>>>>> bb2be7bdfc87e802c1f8bad635052fc40098b750
      }
    } catch (error) {
      console.warn("ImageCapture дал сбой, переключаемся на Canvas Fallback:", error);
    }

    // ПУТЬ 2: Резервный Canvas (Для iOS/Safari и десктопного режима)
    if (video.readyState < 2 || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // willReadFrequently: true переводит обработку в программный режим, спасая от сбоев GPU
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
      {/* Верхняя панель управления */}
      <div className="flex justify-between items-center text-white z-10 pt-2">
        <span className="text-xs font-mono bg-black/40 px-3 py-1 rounded-full border border-white/10">
          {field === 'photoInv' ? 'Снимок инвентарника' : 'Общий вид ОС'}
        </span>
        <button onClick={onClose} className="p-2 bg-white/10 active:bg-white/20 rounded-full transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Окно предпросмотра видео */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-contain"
        />
        
        {/* Рамка-прицел для инвентарных номеров */}
        {field === 'photoInv' && (
          <div className="absolute border-2 border-dashed border-yellow-400 w-72 h-28 rounded-2xl pointer-events-none flex flex-col items-center justify-center p-2 bg-yellow-400/5 shadow-[0_0_50px_rgba(0,0,0,0.6)]">
            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-md">
              Поместите штрих-код / текст сюда
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