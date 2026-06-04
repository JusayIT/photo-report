import React, { useRef, useEffect, useState } from 'react';

export default function SmartCamera({ id, field, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  // СТРОГАЯ ПРОВЕРКА: Если поле равно 'photoInv', то это инвентарник и нужна рамка
  const isOverlay = field === 'photoInv';

  useEffect(() => {
    async function startCamera() {
      try {
        const constraints = {
          video: {
            facingMode: 'environment', // Задняя камера для съемки ОС
            width: { ideal: 1280 },
            height: { ideal: 720 }
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

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;
      
      // Целевое соотношение сторон — строго горизонтальные 4:3 под формат отчета
      const targetAspect = 4 / 3;
      
      let sX = 0;
      let sY = 0;
      let sWidth = vWidth;
      let sHeight = vHeight;

      // Рассчитываем кадрирование (Center Crop)
      if (vWidth / vHeight > targetAspect) {
        // Поток шире, чем 4:3 (например, 16:9 на ноутбуке) -> отрезаем лишнее по бокам
        sWidth = vHeight * targetAspect;
        sX = (vWidth - sWidth) / 2;
      } else {
        // Поток уже/вертикальнее, чем 4:3 (портретный режим смартфона) -> отрезаем лишнее сверху и снизу
        sHeight = vWidth / targetAspect;
        sY = (vHeight - sHeight) / 2;
      }

      // Устанавливаем физический размер холста холста равным вырезанному фрагменту
      canvas.width = sWidth;
      canvas.height = sHeight;

      // Вырезаем центральную часть видеопотока (имитируем поведение CSS object-cover)
      ctx.drawImage(
        video, 
        sX, sY, sWidth, sHeight, // Координаты и размеры исходного кадра (откуда берем)
        0, 0, canvas.width, canvas.height // Координаты и размеры на холсте (куда рисуем)
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // Передаем снимок, ID строки и тип поля обратно в App.jsx
      onCapture(dataUrl, id, field);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 select-none">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Заголовок меняется в зависимости от типа поля */}
        <div className="relative py-4 border-b border-gray-100 flex items-center justify-center bg-white">
          <h3 className="text-gray-900 font-bold text-sm">
            {isOverlay ? "Фото инвентарного номера" : "Фото общего вида объекта"}
          </h3>
          <button onClick={onClose} className="absolute right-4 text-gray-400 hover:text-gray-600 text-lg p-1">✕</button>
        </div>

        {/* Область превью камеры */}
        <div className="relative bg-gray-950 aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-center p-6 max-w-xs">
              <p className="text-red-400 text-xs font-semibold mb-2">⚠ Доступ ограничен</p>
              <p className="text-gray-500 text-[11px]">{error}</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}

          {/* Желтая рамка-трафарет появляется ТОЛЬКО для инвентарного номера */}
          {!error && isOverlay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              {/* Рамка фокуса */}
              <div className="w-[75%] h-[40%] border-2 border-yellow-400 rounded-xl flex items-center justify-center p-4 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                {/* Текст подсказки по ТЗ */}
                <span className="text-yellow-400 text-[11px] font-bold text-center bg-black/50 px-2 py-1 rounded-md tracking-wide">
                  Наведите инвентарный номер в рамку
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Панель управления */}
        <div className="bg-white px-6 py-4 flex items-center justify-center gap-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 max-w-[130px] py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
          >
            ✕ Отмена
          </button>

          <button
            onClick={handleCapture}
            disabled={!!error}
            className="flex-1 max-w-[150px] py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-1.293-1.293A1 1 0 0012.414 3H7.586a1 1 0 00-.707.293L5.586 5H4zm6 9a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
            Снять
          </button>
        </div>

      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}