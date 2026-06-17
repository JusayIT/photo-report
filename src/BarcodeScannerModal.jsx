import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const BarcodeScannerModal = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    // Конфигурация сканера
    const formatsToSupport = [
      // Можно ограничить типы штрихкодов для ускорения работы, 
      // но по умолчанию он ищет все популярные (EAN-13, Code 128 и т.д.)
    ];

    const scanner = new Html5QrcodeScanner(
      "scanner-reader", // ID элемента, куда встроен сканер
      {
        fps: 15,          // Частота кадров в секунду
        qrbox: { width: 250, height: 150 }, // Размер рамки прицела для штрихкода
        rememberLastUsedCamera: true,
        // Заставляем использовать именно заднюю камеру (environment)
        supportedScanTypes: [0] // 0 означает только камеру (без загрузки файлов)
      },
      /* verbose= */ false
    );

    // Запуск сканирования
    scanner.render(
      (decodedText) => {
        // Успешный скан
        onScanSuccess(decodedText);
        scanner.clear().then(() => onClose()); // Выключаем камеру и закрываем модалку
      },
      (errorMessage) => {
        // Ошибки поиска штрихкода в кадре (можно не выводить, чтобы не спамить в консоль)
      }
    );

    // Очистка при размонтировании компонента (если пользователь просто закрыл модалку)
    return () => {
      scanner.clear().catch((error) => console.error("Ошибка остановки сканера", error));
    };
  }, [onScanSuccess, onClose]);

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3>Сканирование штрихкода</h3>
        {/* Сюда библиотека вставит видеопоток с камеры и свои кнопки управления */}
        <div id="scanner-reader" style={{ width: "100%" }}></div>
        
        <button onClick={onClose} style={closeButtonStyle}>
          Отмена
        </button>
      </div>
    </div>
  );
};

// Простые стили для модального окна (можно заменить на ваши Tailwind/CSS классы)
const modalOverlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.7)", display: "flex",
  justifyContent: "center", alignItems: "center", zIndex: 1000
};

const modalContentStyle = {
  background: "#fff", padding: "20px", borderRadius: "8px",
  width: "90%", maxWidth: "450px", textAlign: "center", color: "#000"
};

const closeButtonStyle = {
  marginTop: "15px", padding: "10px 20px", background: "#f44336",
  color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer"
};

export default BarcodeScannerModal;