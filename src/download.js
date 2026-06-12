/**
 * Универсальный метод скачивания файлов, адаптированный под мобильные устройства.
 * @param {Blob|string} fileData - Файл в формате Blob или строка Base64 (DataURL)
 * @param {string} filename - Имя сохраняемого файла с расширением
 */
export const safeDownload = (fileData, filename) => {
    let blob = fileData;
  
    // Если пришла строка Base64, принудительно переводим её в честный Blob, 
    // так как мобильные браузеры блокируют прямые переходы по data:URL
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      const parts = fileData.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    }
  
    // Создаем внутреннюю безопасную ссылку на объект в памяти
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = blobUrl;
    link.download = filename;
    link.target = '_blank'; 
  
    // Обязательный шаг для мобильных движков: ссылка должна физически существовать в DOM
    document.body.appendChild(link);
    
    // Симулируем нажатие
    link.click();
  
    // Удаляем элементы из памяти, чтобы не перегружать вкладку смартфона
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 200);
  };