import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import SmartCamera from './SmartCamera';
import ReportMemo from './ReportMemo'; // Подключаем внешний компонент памятки
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  Info, PlusCircle, FileText, ArrowLeft, Camera, Trash2, 
  Send, Plus, Edit2, Download 
} from 'lucide-react';

// ================= ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ЗАМЕРА ИЗОБРАЖЕНИЙ =================
const getImageDimensions = (base64Data) => { 
  return new Promise((resolve) => {
    if (!base64Data) return resolve({ width: 0, height: 0 });
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = base64Data;
  });
};

export default function App() {
  const [screen, setScreen] = useState('main');
  const reports = useLiveQuery(() => db.reports.toArray()) || [];
  const [currentId, setCurrentId] = useState(null);
  const [docType, setDocType] = useState('Списание');
  const [positions, setPositions] = useState([{ id: 1, invNumber: '', photoInv: null, photoObj: null }]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState({ id: null, field: '' });

  // ================= ПЕРЕХВАТ ВХОДЯЩИХ ФАЙЛОВ ИЗ ГАЛЕРЕИ (SHARE TARGET) =================
  useEffect(() => {
    async function checkSharedFiles() {
      if (!('caches' in window)) return;
      try {
        const cache = await caches.open('shared-files-cache');
        const response = await cache.match('/shared-incoming-file');
        if (response) {
          const blob = await response.blob();
          const file = new File([blob], "shared-photo.jpg", { type: blob.type });
       
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result;
            setPositions(prev => {
              const newId = prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1;
              return [...prev, { id: newId, invNumber: '', photoInv: null, photoObj: dataUrl }];
            });
            setScreen(currentScreen => currentScreen === 'main' ? 'create' : currentScreen);
          };
          reader.readAsDataURL(file);
          await cache.delete('/shared-incoming-file');
        }
      } catch (error) {
        console.error("Ошибка при получении файла из Share Target:", error);
      }
    }
    checkSharedFiles();
    window.addEventListener('focus', checkSharedFiles);
    return () => window.removeEventListener('focus', checkSharedFiles);
  }, []);

  const addPosition = () => {
    const newId = positions.length > 0 ? Math.max(...positions.map(p => p.id)) + 1 : 1;
    setPositions([...positions, { id: newId, invNumber: '', photoInv: null, photoObj: null }]);
  };

  const deletePosition = (id) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  const handleInvChange = (id, value) => {
    setPositions(positions.map(p => p.id === id ? { ...p, invNumber: value } : p));
  };

  const openCamera = (id, field) => {
    setCameraTarget({ id, field });
    setCameraActive(true);
  };

  const handleCapturePhoto = (photoData, targetId, targetField) => {
    setPositions(prevPositions => 
      prevPositions.map(p => p.id === targetId ? { ...p, [targetField]: photoData } : p)
    );
    setCameraActive(false);
  };

  const saveDocument = async () => {
    const reportData = {
      type: docType,
      date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      count: positions.length,
      positions: positions
    };
    if (currentId) {
      await db.reports.update(currentId, reportData);
    } else {
      await db.reports.add(reportData);
    }
    closeForm();
  };

  const deleteDocument = async (id) => {
    if(confirm("Удалить этот фотоотчет?")) {
      await db.reports.delete(id);
    }
  };

  const openEdit = (report) => {
    setCurrentId(report.id);
    setDocType(report.type);
    setPositions(report.positions);
    setScreen('create');
  };

  const openPreview = (report) => {
    setPreviewDoc(report);
    setScreen('preview');
  };

  const closeForm = () => {
    setCurrentId(null);
    setDocType('Списание');
    setPositions([{ id: 1, invNumber: '', photoInv: null, photoObj: null }]);
    setScreen('main');
  };

  // ================= ГЕНЕРАЦИЯ EXCEL С АВТОПРОПОРЦИЯМИ КАРТИНОК =================
  const generateExcelBlob = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Фотоотчет');

    worksheet.columns = [
      { key: 'no', width: 6 }, { key: 'inv', width: 25 }, { key: 'photo1', width: 28 }, { key: 'photo2', width: 28 }
    ];

    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Фотоотчет - ${previewDoc.type}`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:D2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Дата: ${previewDoc.date} | Количество ОС: ${previewDoc.positions?.length || 0}`;
    dateCell.font = { name: 'Calibri', size: 11 };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['№', 'Инвентарный номер', 'Фото инвентарного номера', 'Фото общего вида ОС']);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    for (const [index, p] of previewDoc.positions.entries()) {
      const row = worksheet.addRow([index + 1, p.invNumber || '—', '', '']);
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });

      let maxRowHeightPx = 360;
      const imagesToInsert = [];
      const maxWidthPx = 180;
      const maxHeightPx = 360;

      if (p.photoInv) {
        const dims = await getImageDimensions(p.photoInv);
        if (dims.width > 0 && dims.height > 0) {
          const scale = Math.min(maxWidthPx / dims.width, maxHeightPx / dims.height);
          const w = dims.width * scale; const h = dims.height * scale;
          imagesToInsert.push({ base64: p.photoInv, col: 2, w, h });
          if (h > maxRowHeightPx) maxRowHeightPx = h;
        }
      }
      if (p.photoObj) {
        const dims = await getImageDimensions(p.photoObj);
        if (dims.width > 0 && dims.height > 0) {
          const scale = Math.min(maxWidthPx / dims.width, maxHeightPx / dims.height);
          const w = dims.width * scale; const h = dims.height * scale;
          imagesToInsert.push({ base64: p.photoObj, col: 3, w, h });
          if (h > maxRowHeightPx) maxRowHeightPx = h;
        }
      }

      row.height = (maxRowHeightPx + 16) / 1.333;

      imagesToInsert.forEach((imgData) => {
        try {
          const base64Image = imgData.base64.split(';base64,').pop();
          const imageId = workbook.addImage({ base64: base64Image, extension: 'jpeg' });
          const rowOffset = Math.max(8, Math.round((maxRowHeightPx - imgData.h) / 2) + 8);
          worksheet.addImage(imageId, {
            tl: { col: imgData.col, row: row.number - 1, colOff: 12, rowOff: rowOffset },
            ext: { width: imgData.w, height: imgData.h },
            editAs: 'oneCell'
          });
        } catch (error) {
          console.error("Ошибка вставки картинки в Excel:", error);
        }
      });
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  // ================= ДОПОЛНЕННАЯ ФУНКЦИЯ ШЕРИНГА С ДИАГНОСТИКОЙ И ЛАТИНСКИМ ИМЕНЕМ =================
  const handleShareExcel = async () => {
    try {
      if (!navigator.share) {
        alert("Браузер заблокировал Share API. Причина: приложение запущено не через HTTPS или открыто внутри встроенного браузера мессенджера (WebView).");
        await handleDownloadExcel(); 
        return;
      }

      const blob = await generateExcelBlob();
      
      // Системное имя файла делаем строго латиницей, чтобы iOS/Safari не блокировал его отправку
      const systemFileName = `Report_${previewDoc.type}_2026.xlsx`; 
      const file = new File([blob], systemFileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ 
          files: [file], 
          title: `Фотоотчет - ${previewDoc.type}`, 
          text: `Отчет от ${previewDoc.date}` 
        });
      } else {
        alert("Ваша мобильная ОС запретила прямую передачу файлов формата .xlsx через шторку шеринга. Файл будет просто скачан.");
        saveAs(blob, `Фотоотчет_${previewDoc.type}_2026.xlsx`);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        alert("Ошибка при отправке: " + error.message);
        const blob = await generateExcelBlob();
        saveAs(blob, `Фотоотчет_${previewDoc.type}_2026.xlsx`);
      }
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await generateExcelBlob();
      saveAs(blob, `Фотоотчет_${previewDoc.type}_2026.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start sm:py-6 font-sans antialiased text-gray-800">
      <div className="w-full max-w-[460px] min-h-screen sm:min-h-[850px] flex flex-col bg-white sm:shadow-2xl sm:rounded-3xl overflow-hidden border border-gray-200/60 relative">
        
        {cameraActive && (
          <SmartCamera id={cameraTarget.id} field={cameraTarget.field} onCapture={handleCapturePhoto} onClose={() => setCameraActive(false)} />
        )}

        {screen === 'main' && (
          <>
            <header className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Главная</h1>
              <button onClick={() => setScreen('info')} className="text-blue-500 hover:text-blue-600 p-2 rounded-xl bg-blue-50 transition-colors">
                <Info className="w-5 h-5" />
              </button>
            </header>
            <main className="flex flex-col flex-grow px-5 py-4 bg-white">
              <button onClick={() => setScreen('create')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-100 transition-all active:scale-[0.99] mb-5 text-base">
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                <span>Создать</span>
              </button>
              {reports.length === 0 ? (
                <div className="flex flex-col flex-grow items-center justify-center py-20 text-gray-400">
                  <div className="bg-gray-50 p-6 rounded-full mb-3 ring-8 ring-gray-50/50"><FileText className="w-12 h-12 text-gray-300" /></div>
                  <p className="text-sm font-medium">У вас нет документов</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[620px] pb-4">
                  {reports.map((rep) => (
                    <div key={rep.id} className="p-4 border border-gray-200/80 rounded-2xl bg-white shadow-sm flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm truncate">Фотоотчет: {rep.type}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Количество ОС: <span className="font-semibold text-gray-600">{rep.count}</span></p>
                        <p className="text-[11px] text-gray-400 mt-1">Дата: {rep.date}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button onClick={() => openEdit(rep)} className="p-2 text-gray-500 hover:text-blue-500 hover:bg-white rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => openPreview(rep)} className="p-2 text-blue-500 hover:text-blue-600 hover:bg-white rounded-lg"><Send className="w-4 h-4" /></button>
                        <button onClick={() => deleteDocument(rep.id)} className="p-2 text-red-400 hover:text-red-500 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </>
        )}

        {screen === 'create' && (
          <>
            <header className="flex justify-between items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center">
                <button onClick={closeForm} className="text-gray-500 p-1.5 rounded-lg mr-1"><ArrowLeft className="w-5 h-5" /></button>
                <h1 className="text-base font-bold text-gray-800">Создание фотоотчета</h1>
              </div>
              <div className="flex gap-2">
                <button onClick={saveDocument} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs">Сохранить</button>
                <button onClick={() => openPreview({ type: docType, positions, date: 'Черновик' })} className="border border-gray-300 text-gray-600 font-medium py-1.5 px-2.5 rounded-lg text-xs flex items-center gap-1"><Send className="w-3 h-3" /></button>
              </div>
            </header>
       
            <main className="flex flex-col flex-grow px-4 py-4 bg-white overflow-y-auto max-h-[740px]">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Тип списания:</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full bg-blue-50/40 border border-blue-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none appearance-none cursor-pointer font-medium">
                  <option value="Списание">Списание</option>
                  <option value="Реализация">Реализация</option>
                  <option value="Благотворительность">Передача в благотворительность</option>
                  <option value="Утеря/Порча/Кража">Утеря/Порча/Кража</option>
                </select>
              </div>

              {/* ================= СТРОКИ ПОЗИЦИЙ С ИСПОЛЬЗОВАНИЕМ GRID ================= */}
              <div className="flex flex-col gap-3.5 mb-4">
                {positions.map((pos, index) => (
                  <div key={pos.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                    <div className="bg-gray-50/80 px-3 py-2 grid grid-cols-12 gap-2 items-center border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider relative">
                      <div className="col-span-1 text-center">№</div>
                      <div className="col-span-3 text-center">Инв. номер</div>
                      <div className="col-span-4 text-center">Фото инв.</div>
                      <div className="col-span-4 text-center">Общий вид ОС</div>
                      {positions.length > 1 && (
                        <button onClick={() => deletePosition(pos.id)} className="text-red-400 hover:text-red-600 transition-colors absolute right-2.5 top-1/2 -translate-y-1/2 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="p-3 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-center text-xs font-bold text-gray-400">{index + 1}</div>
                      
                      <div className="col-span-3">
                        <input 
                          type="text" placeholder="3-1234" value={pos.invNumber} 
                          onChange={(e) => handleInvChange(pos.id, e.target.value)} 
                          className="w-full bg-white border border-gray-300 rounded-lg px-1 py-1.5 text-xs text-center font-semibold text-gray-700 focus:border-blue-400 focus:outline-none" 
                        />
                      </div>
                      
                      <div className="col-span-4">
                        <div className="w-full h-[55px] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                          {!pos.photoInv ? (
                            <button onClick={() => openCamera(pos.id, 'photoInv')} className="w-full h-full border border-dashed border-blue-300 rounded-lg bg-blue-50/20 flex flex-col items-center justify-center text-[10px] text-blue-600 font-medium hover:bg-blue-50/40 transition-colors">
                              <Camera className="w-3.5 h-3.5 mb-0.5 text-blue-400" />
                              <span className="scale-90">В рамку</span>
                            </button>
                          ) : (
                            <img src={pos.photoInv} onClick={() => openCamera(pos.id, 'photoInv')} className="max-w-full max-h-full object-contain cursor-pointer" alt="инв" />
                          )}
                        </div>
                      </div>

                      <div className="col-span-4">
                        <div className="w-full h-[55px] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                          {!pos.photoObj ? (
                            <button onClick={() => openCamera(pos.id, 'photoObj')} className="w-full h-full border border-dashed border-blue-300 rounded-lg bg-blue-50/20 flex flex-col items-center justify-center text-[10px] text-blue-600 font-medium hover:bg-blue-50/40 transition-colors">
                              <Camera className="w-3.5 h-3.5 mb-0.5 text-blue-400" />
                              <span className="scale-90">Фото ОС</span>
                            </button>
                          ) : (
                            <img src={pos.photoObj} onClick={() => openCamera(pos.id, 'photoObj')} className="max-w-full max-h-full object-contain cursor-pointer" alt="ос" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addPosition} className="w-full border border-blue-300 text-blue-600 py-2.5 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold hover:bg-blue-50/30 transition-all"><Plus className="w-4 h-4 stroke-[2.5]" /><span>Добавить позицию</span></button>
            </main>
          </>
        )}

        {screen === 'preview' && previewDoc && (
          <>
            <header className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <button onClick={() => setScreen('main')} className="text-gray-500 p-1.5 rounded-lg mr-2"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-base font-bold text-gray-800">Предпросмотр Excel</h1>
            </header>
            <main className="flex flex-col flex-grow bg-gray-50 overflow-y-auto max-h-[740px]">
              <div className="p-4 bg-white border-b border-gray-200">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Файл генерации:</p>
                <p className="text-xs font-mono font-bold text-emerald-600 truncate mt-0.5">Фотоотчет_{previewDoc.type}_2026.xlsx</p>
              </div>
              <div className="p-3 flex-grow overflow-x-auto">
                <div className="min-w-[400px] bg-white border border-gray-300 shadow-sm rounded-lg overflow-hidden font-mono text-[11px]">
                  <div className="p-2 border-b border-gray-200 font-bold text-gray-800 text-center bg-gray-50">Фотоотчет - {previewDoc.type}</div>
                  <div className="p-1.5 border-b border-gray-200 text-gray-500 text-[10px] text-center bg-gray-50/50">Дата: {previewDoc.date} | Позиций: {previewDoc.positions?.length || 0}</div>
                  <div className="grid grid-cols-12 bg-[#4472C4] text-white font-bold p-2 text-center border-b border-gray-300">
                    <div className="col-span-1">№</div>
                    <div className="col-span-3 border-l border-white/20">Инв. номер</div>
                    <div className="col-span-4 border-l border-white/20">Фото инв.</div>
                    <div className="col-span-4 border-l border-white/20">Фото общего вида</div>
                  </div>
                  {previewDoc.positions?.map((p, i) => (
                    <div key={p.id} className="grid grid-cols-12 border-b border-gray-200 items-center text-center p-1 min-h-[60px]">
                      <div className="col-span-1 text-gray-400 font-bold">{i + 1}</div>
                      <div className="col-span-3 font-bold text-gray-700">{p.invNumber || '—'}</div>
                      <div className="col-span-4 p-0.5 flex justify-center">
                        {p.photoInv ? <img src={p.photoInv} className="h-12 w-16 object-contain rounded" alt="excel-img" /> : <span className="text-gray-300">нет фото</span>}
                      </div>
                      <div className="col-span-4 p-0.5 flex justify-center">
                        {p.photoObj ? <img src={p.photoObj} className="h-12 w-16 object-contain rounded" alt="excel-img" /> : <span className="text-gray-300">нет фото</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ================= ОБНОВЛЕННАЯ СОВРЕМЕННАЯ ПАНЕЛЬ ОТПРАВКИ ================= */}
              <div className="bg-white border-t border-gray-200 p-4 rounded-t-[24px] shadow-lg mt-auto flex flex-col gap-3">
                <button 
                  onClick={handleShareExcel} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-blue-100 transition-all active:scale-[0.99]"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Отправить отчет (WhatsApp, TG, Почта)</span>
                </button>

                <button 
                  onClick={handleDownloadExcel} 
                  className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Просто скачать файл (.xlsx)</span>
                </button>
              </div>
            </main>
          </>
        )}

        {/* ================= ВЫЗОВ ВЫНЕСЕННОГО КОМПОНЕНТА ПАМЯТКИ ================= */}
        {screen === 'info' && (
          <ReportMemo onClose={() => setScreen('main')} />
        )}

      </div>
    </div>
  );
}