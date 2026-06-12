import React, { useRef, useEffect, useState } from 'react';

export default function SmartCamera({ id, field, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [qualityWarning, setQualityWarning] = useState(null);
  const isOverlay = field === 'photoInv';

  useEffect(() => {
    async function startCamera() {
      try {
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
        setError(null);
      } catch (err) {
        console.error("Ошибка при доступе к камере:", err);
        setError("Не удалось запустить камеру. Проверьте разрешения.");
      }
    }

    startCamera();

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
      }
    }

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
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

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
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setQualityWarning(null);
      onCapture(dataUrl, id, field);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-2 select-none">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* Окно предупреждения о качестве */}
        {qualityWarning && (
          <div className="absolute inset-x-4 top-16 bg-red-50 border-2 border-red-200 p-4 rounded-2xl z-30 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <span className="text-red-500 text-sm font-bold mb-1">⚠ Некачественный снимок</span>
              <p className="text-gray-700 text-xs font-semibold leading-relaxed mb-3">{qualityWarning}</p>
              <button 
                onClick={() => setQualityWarning(null)} 
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-md transition-all active:scale-95"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        )}

        {/* Верхняя панель */}
        <div className="relative py-4 border-b border-gray-100 flex items-center justify-center bg-white">
          <h3 className="text-gray-900 font-bold text-sm">
            {isOverlay ? "Фото инвентарного номера" : "Фото общего вида объекта"}
          </h3>
          <button onClick={onClose} className="absolute right-4 text-gray-400 hover:text-gray-600 text-lg p-1">✕</button>
        </div>

        {/* Экран камеры в пропорции 3:4 */}
        <div className="relative bg-gray-950 aspect-[3/4] w-full flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-center p-6 max-w-xs">
              <p className="text-red-400 text-xs font-semibold mb-2">⚠ Доступ ограничен</p>
              <p className="text-gray-500 text-[11px]">{error}</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}

          {/* Трафарет рамки для инвентарного номера */}
          {!error && isOverlay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-[85%] h-[22%] border-2 border-yellow-400 rounded-xl flex items-center justify-center p-4 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <span className="text-yellow-400 text-[11px] font-bold text-center bg-black/60 px-2.5 py-1.5 rounded-lg tracking-wide">
                  Наведите инвентарный номер в рамку
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Нижняя панель управления */}
        <div className="bg-white px-6 py-4 flex items-center justify-center gap-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 max-w-[130px] py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-all"
          >
            ✕ Отмена
          </button>

          <button
            onClick={handleCapture}
            disabled={!!error || !!qualityWarning}
            className="flex-1 max-w-[170px] py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-1.293-1.293A1 1 0 0012.414 3H7.586a1 1 0 00-.707.293L5.586 5H4zm6 9a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
            Снять кадр
          </button>
        </div>

      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}