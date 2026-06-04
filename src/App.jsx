import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import SmartCamera from './SmartCamera';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  Info, PlusCircle, FileText, ArrowLeft, Camera, Trash2, 
  Send, Plus, Edit2, Download, CheckCircle, AlertTriangle 
} from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState('main');
  const reports = useLiveQuery(() => db.reports.toArray()) || [];
  const [currentId, setCurrentId] = useState(null);
  const [docType, setDocType] = useState('Списание');
  const [positions, setPositions] = useState([{ id: 1, invNumber: '', photoInv: null, photoObj: null }]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState({ id: null, field: '' });

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

  // ================= ГЕНЕРАЦИЯ EXCEL =================
  const generateExcelBlob = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Фотоотчет');

    worksheet.columns = [
      { key: 'no', width: 6 },
      { key: 'inv', width: 25 },
      { key: 'photo1', width: 52 }, 
      { key: 'photo2', width: 52 }  
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

    previewDoc.positions.forEach((p, index) => {
      const row = worksheet.addRow([index + 1, p.invNumber || '—', '', '']);
      row.height = 250; 

      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });

      const addImageToCell = (base64Data, colNumber) => {
        if (!base64Data) return;
        try {
          const base64Image = base64Data.split(';base64,').pop();
          const imageId = workbook.addImage({ base64: base64Image, extension: 'jpeg' });
          
          worksheet.addImage(imageId, {
            tl: { col: colNumber, row: row.number - 1, colOff: 33, rowOff: 66 },
            ext: { width: 350, height: 200 },           
            editAs: 'oneCell'                            
          });
        } catch (error) {
          console.error("Ошибка при добавлении изображения в Excel:", error);
        }
      };

      addImageToCell(p.photoInv, 2); 
      addImageToCell(p.photoObj, 3); 
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  const handleShareExcel = async () => {
    try {
      const blob = await generateExcelBlob();
      const fileName = `Фотоотчет_${previewDoc.type}_2026.xlsx`;
      const file = new File([blob], fileName, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Фотоотчет - ${previewDoc.type}`,
          text: `Отчет от ${previewDoc.date}`
        });
      } else {
        saveAs(blob, fileName);
      }
    } catch (error) {
      console.error("Ошибка при отправке:", error);
      const blob = await generateExcelBlob();
      saveAs(blob, `Фотоотчет_${previewDoc.type}_2026.xlsx`);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await generateExcelBlob();
      saveAs(blob, `Фотоотчет_${previewDoc.type}_2026.xlsx`);
    } catch (error) {
      console.error("Ошибка при скачивании файла:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start sm:py-6 font-sans antialiased text-gray-800">
      <div className="w-full max-w-[460px] min-h-screen sm:min-h-[850px] flex flex-col bg-white sm:shadow-2xl sm:rounded-3xl overflow-hidden border border-gray-200/60 relative">
        
        {cameraActive && (
          <SmartCamera 
            id={cameraTarget.id} field={cameraTarget.field}
            onCapture={handleCapturePhoto} onClose={() => setCameraActive(false)} 
          />
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
                  <div className="bg-gray-50 p-6 rounded-full mb-3 ring-8 ring-gray-50/50">
                    <FileText className="w-12 h-12 text-gray-300 stroke-[1.2]" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">У вас нет документов</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[620px] pb-4">
                  {reports.map((rep) => (
                    <div key={rep.id} className="p-4 border border-gray-200/80 rounded-2xl bg-white shadow-sm hover:border-gray-300 transition-all flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm truncate">Фотоотчет: {rep.type}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Количество ОС: <span className="font-semibold text-gray-600">{rep.count}</span></p>
                        <p className="text-[11px] text-gray-400 mt-1">Дата: {rep.date}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button onClick={() => openEdit(rep)} className="p-2 text-gray-500 hover:text-blue-500 hover:bg-white rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => openPreview(rep)} className="p-2 text-blue-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"><Send className="w-4 h-4" /></button>
                        <button onClick={() => deleteDocument(rep.id)} className="p-2 text-red-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                <button onClick={saveDocument} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-all">Сохранить</button>
                <button onClick={() => openPreview({ type: docType, positions, date: 'Черновик' })} className="border border-gray-300 text-gray-600 font-medium py-1.5 px-2.5 rounded-lg text-xs flex items-center gap-1"><Send className="w-3 h-3" /></button>
              </div>
            </header>

            <main className="flex flex-col flex-grow px-4 py-4 bg-white overflow-y-auto max-h-[740px]">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Тип списания:</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full bg-blue-50/40 border border-blue-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-medium appearance-none cursor-pointer">
                  <option value="Списание">Списание</option>
                  <option value="Реализация">Реализация</option>
                  <option value="Благотворительность">Передача в благотворительность</option>
                  <option value="Утеря/Порча/Кража">Утеря/Порча/Кража</option>
                </select>
              </div>

              <div className="flex flex-col gap-3.5 mb-4">
                {positions.map((pos, index) => (
                  <div key={pos.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                    <div className="bg-gray-50/80 px-3 py-1.5 flex justify-between items-center border-b border-gray-100 text-[11px] font-bold text-gray-400">
                      <div className="flex gap-6"><span className="w-3">№</span><span>Инвентарный номер</span></div>
                      {positions.length > 1 && <button onClick={() => deletePosition(pos.id)} className="text-red-400 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                    <div className="p-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-400 w-3">{index + 1}</span>
                      <input type="text" placeholder="3-1234" value={pos.invNumber} onChange={(e) => handleInvChange(pos.id, e.target.value)} className="w-[100px] bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-center font-semibold text-gray-700 focus:border-blue-400 focus:outline-none" />
                      <div className="w-[85px] h-[55px]">
                        {!pos.photoInv ? (
                          <button onClick={() => openCamera(pos.id, 'photoInv')} className="w-full h-full border border-dashed border-blue-300 rounded-lg bg-blue-50/20 flex flex-col items-center justify-center text-[10px] text-blue-600 font-medium"><Camera className="w-3.5 h-3.5 mb-0.5 text-blue-400" /><span className="scale-90">В рамку</span></button>
                        ) : <img src={pos.photoInv} onClick={() => openCamera(pos.id, 'photoInv')} className="w-full h-full object-cover rounded-lg border cursor-pointer" alt="инв" />}
                      </div>
                      <div className="w-[85px] h-[55px]">
                        {!pos.photoObj ? (
                          <button onClick={() => openCamera(pos.id, 'photoObj')} className="w-full h-full border border-dashed border-blue-300 rounded-lg bg-blue-50/20 flex flex-col items-center justify-center text-[10px] text-blue-600 font-medium"><Camera className="w-3.5 h-3.5 mb-0.5 text-blue-400" /><span className="scale-90">Фото ОС</span></button>
                        ) : <img src={pos.photoObj} onClick={() => openCamera(pos.id, 'photoObj')} className="w-full h-full object-cover rounded-lg border cursor-pointer" alt="ос" />}
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

              <div className="bg-white border-t border-gray-200 p-4 rounded-t-2xl shadow-lg mt-auto">
                <p className="text-xs font-bold text-gray-500 mb-3 text-center uppercase tracking-wide">Отправить готовый отчет</p>
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  <button onClick={handleShareExcel} className="p-2.5 bg-emerald-50 text-emerald-700 active:bg-emerald-100 rounded-xl text-xs font-bold text-center transition-colors shadow-sm border border-emerald-200/50">WhatsApp</button>
                  <button onClick={handleShareExcel} className="p-2.5 bg-sky-50 text-sky-700 active:bg-sky-100 rounded-xl text-xs font-bold text-center transition-colors shadow-sm border border-sky-200/50">Telegram</button>
                  <button onClick={handleShareExcel} className="p-2.5 bg-blue-50 text-blue-700 active:bg-blue-100 rounded-xl text-xs font-bold text-center transition-colors shadow-sm border border-blue-200/50">Почта</button>
                </div>
                <button onClick={handleDownloadExcel} className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all">
                  <Download className="w-4 h-4" /><span>Скачать Excel файл (.xlsx)</span>
                </button>
              </div>
            </main>
          </>
        )}

        {/* ================= АВТОНОМНЫЙ ЭКРАН ПАМЯТКИ С СУПЕР-СТИЛИЗАЦИЕЙ ТЕКСТА ================= */}
        {screen === 'info' && (
          <>
            <header className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
              <button onClick={() => setScreen('main')} className="text-gray-500 p-1.5 rounded-xl mr-2 hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Требования к фотоотчету</h1>
            </header>

            <main className="flex flex-col flex-grow bg-white overflow-y-auto">
              <div className="p-4">
                <div className="bg-gray-50/80 rounded-[20px] p-5 text-[14px] text-gray-700 leading-relaxed shadow-sm border border-gray-100">
                  {/* 1 абзац — Жирный */}
                  <p className="mb-4 font-bold text-gray-900">
                    В заявки 1С на реализацию, благотворительность, списание обязательно должны вкладывать таблицу с указанием:
                  </p>
                  
                  {/* Перечисление — Обычное */}
                  <ol className="list-decimal pl-5 space-y-2 mb-5 font-normal text-gray-700">
                    <li>Номер по порядку</li>
                    <li>Инвентарный номер выбывающего ОС</li>
                    <li>Фото инвентарного номера — инвентарник четкий, читаемый (не поворачивать)</li>
                    <li>Фото общего вида ОС — без загромождения и без растягивания/сжатия фотографии</li>
                  </ol>
                  
                  {/* 3 абзац — Курсив */}
                  <p className="italic text-gray-500">
                    Фотоотчет вкладывается в заявку в единственном экземпляре.
                  </p>
                </div>
              </div>

              <div className="px-4 pb-10 flex flex-col gap-6">
                
                {/* Пример КОРРЕКТНОГО отчета */}
                <div className="border-[3px] border-[#00B050] rounded-[24px] overflow-hidden bg-white shadow-sm">
                  <div className="bg-[#00B050]/10 flex items-center justify-center gap-2 py-3 border-b-[3px] border-[#00B050]">
                    <CheckCircle className="w-5 h-5 text-[#00B050]" />
                    <h2 className="text-[#00B050] font-bold text-[15px]">Пример корректного фотоотчета</h2>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse min-w-[340px]">
                      <thead>
                        <tr className="border-b border-gray-300 bg-gray-50">
                          <th className="border-r border-gray-300 p-1.5 text-center w-7 font-bold text-gray-500">№</th>
                          <th className="border-r border-gray-300 p-1.5 text-center font-bold text-gray-500">Инв. номер</th>
                          <th className="border-r border-gray-300 p-1.5 text-center w-[125px] font-bold text-gray-500">Фото инвентарника</th>
                          <th className="p-1.5 text-center w-[125px] font-bold text-gray-500">Фото общего вида</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="border-r border-gray-200 p-2 text-center font-bold text-gray-400">1</td>
                          <td className="border-r border-gray-200 p-2 font-bold text-gray-700">Uk-2617</td>
                          <td className="border-r border-gray-200 p-1">
                            <div className="h-14 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col items-center justify-center text-[10px] text-emerald-700 font-semibold p-1 text-center leading-tight">
                              <span>[ Штрих-код ]</span>
                              <span className="text-[9px] text-emerald-600 font-normal mt-0.5">Четкий, горизонтальный</span>
                            </div>
                          </td>
                          <td className="p-1">
                            <div className="h-14 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col items-center justify-center text-[10px] text-emerald-700 font-semibold p-1 text-center leading-tight">
                              <span>[ Стол ]</span>
                              <span className="text-[9px] text-emerald-600 font-normal mt-0.5">Виден полностью</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-200 p-2 text-center font-bold text-gray-400">2</td>
                          <td className="border-r border-gray-200 p-2 font-bold text-gray-700">3-00875</td>
                          <td className="border-r border-gray-200 p-1">
                            <div className="h-14 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col items-center justify-center text-[10px] text-emerald-700 font-semibold p-1 text-center leading-tight">
                              <span>[ Наклейка Kaspi ]</span>
                              <span className="text-[9px] text-emerald-600 font-normal mt-0.5">Текст читается</span>
                            </div>
                          </td>
                          <td className="p-1">
                            <div className="h-14 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col items-center justify-center text-[10px] text-emerald-700 font-semibold p-1 text-center leading-tight">
                              <span>[ Кресло ]</span>
                              <span className="text-[9px] text-emerald-600 font-normal mt-0.5">В центре кадра</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Пример НЕКОРРЕКТНОГО отчета */}
                <div className="border-[3px] border-[#FF0000] rounded-[24px] overflow-hidden bg-white shadow-sm">
                  <div className="bg-[#FF0000]/10 flex items-center justify-center gap-2 py-3 border-b-[3px] border-[#FF0000]">
                    <AlertTriangle className="w-5 h-5 text-[#FF0000]" />
                    <h2 className="text-[#FF0000] font-bold text-[15px]">Пример некорректного фотоотчета</h2>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-[10px] text-left border-collapse min-w-[340px]">
                      <thead>
                        <tr className="border-b border-gray-300 bg-gray-50">
                          <th className="border-r border-gray-300 p-1.5 text-center w-7 font-bold text-gray-500">№</th>
                          <th className="border-r border-gray-300 p-1.5 text-center font-bold text-gray-500">Инв. номер</th>
                          <th className="border-r border-gray-300 p-1.5 text-center w-[125px] font-bold text-gray-500">Фото инвентарника</th>
                          <th className="p-1.5 text-center w-[125px] font-bold text-gray-500">Фото общего вида</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Строка 1 */}
                        <tr className="border-b border-gray-200">
                          <td className="border-r border-gray-200 p-1.5 text-center font-bold text-gray-400">1</td>
                          <td className="border-r border-gray-200 p-1.5 font-semibold text-gray-700">3-18778</td>
                          <td className="border-r border-gray-200 p-1">
                            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-1 text-center min-h-[50px] flex flex-col justify-center">
                              <span className="font-bold">Размыто</span>
                              <span className="text-[9px] font-medium text-red-500 mt-0.5">ИНВ не читаемый</span>
                            </div>
                          </td>
                          <td className="p-1">
                            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-1 text-center min-h-[50px] flex flex-col justify-center leading-tight">
                              <span className="font-bold">Загромождение</span>
                              <span className="text-[8.5px] font-medium text-red-500 mt-0.5">Непонятно, какое именно ОС списывается</span>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Строка 2 */}
                        <tr className="border-b border-gray-200">
                          <td className="border-r border-gray-200 p-1.5 text-center font-bold text-gray-400">2</td>
                          <td className="border-r border-gray-200 p-1.5 font-semibold text-gray-700">Us-3665</td>
                          <td className="border-r border-gray-200 p-1">
                            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-1 text-center min-h-[50px] flex flex-col justify-center">
                              <span className="font-bold">Зеркально</span>
                              <span className="text-[8.5px] font-medium text-red-500 mt-0.5">Отражено справа налево</span>
                            </div>
                          </td>
                          <td className="p-1">
                            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-1 text-center min-h-[50px] flex flex-col justify-center leading-tight">
                              <span className="font-bold">Искажение</span>
                              <span className="text-[8.5px] font-medium text-red-500 mt-0.5">Видно частично, фото сильно растянуто</span>
                            </div>
                          </td>
                        </tr>

                        {/* Строка 3 */}
                        <tr className="border-b border-gray-200">
                          <td className="border-r border-gray-200 p-1.5 text-center font-bold text-gray-400">3</td>
                          <td className="border-r border-gray-200 p-1.5 font-semibold text-gray-700">Je-1439</td>
                          <td className="border-r border-gray-200 p-1">
                            <div className="bg-red-50/60 text-red-600 border border-dashed border-red-300 rounded-lg p-1 text-center min-h-[50px] flex items-center justify-center font-bold text-[9px] uppercase tracking-wide">
                              Отсутствует
                            </div>
                          </td>
                          <td className="p-1">
                            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-1 text-center min-h-[50px] flex flex-col justify-center leading-tight">
                              <span className="font-bold">Обрезано</span>
                              <span className="text-[8.5px] font-medium text-red-500 mt-0.5">ОС обрезано на фото, не видно целиком</span>
                            </div>
                          </td>
                        </tr>

                        {/* Строка 4 */}
                        <tr>
                          <td className="border-r border-gray-200 p-1.5 text-center font-bold text-gray-400">4</td>
                          <td className="border-r border-gray-200 p-1.5 font-semibold text-gray-700">Je-2174</td>
                          <td className="border-r border-gray-200 p-1">
                            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-1 text-center min-h-[50px] flex flex-col justify-center">
                              <span className="font-bold">Сжато</span>
                              <span className="text-[8.5px] font-medium text-red-500 mt-0.5">Расположено неверно / боком</span>
                            </div>
                          </td>
                          <td className="p-1">
                            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-1 text-center min-h-[50px] flex flex-col justify-center leading-tight">
                              <span className="font-bold">Повернуто</span>
                              <span className="text-[8.5px] font-medium text-red-500 mt-0.5">Фото перевернуто на 90 градусов</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </main>
          </>
        )}

      </div>
    </div>
  );
}