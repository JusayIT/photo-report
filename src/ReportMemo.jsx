import React from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

// === ИМПОРТ ИЗ ВАШЕЙ ПАПКИ ASSETS ===
import img1a from './assets/1a.jpg';
import img1b from './assets/1b.jpg';
import img2a from './assets/2a.jpg';
import img2b from './assets/2b.jpg';

import img3a from './assets/3a.jpg';
import img3b from './assets/3b.jpg';
import img4a from './assets/4a.jpg';
import img4b from './assets/4b.jpg';
// 5a отсутствует по условию
import img5b from './assets/5b.jpg';
import img6a from './assets/6a.jpg';
import img6b from './assets/6b.jpg';

export default function ReportMemo({ onClose }) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Шапка памятки */}
      <header className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <button onClick={onClose} className="text-gray-500 p-1.5 rounded-xl mr-2 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Требования к фотоотчету</h1>
      </header>

      {/* Основной контент */}
      <main className="flex flex-col flex-grow bg-white overflow-y-auto pb-10">
        
        {/* Текстовые правила */}
        <div className="p-4">
          <div className="bg-gray-50/80 rounded-[20px] p-5 text-[14px] text-gray-700 leading-relaxed shadow-sm border border-gray-100">
            <p className="mb-4 font-bold text-gray-900">
              В заявки 1С на реализацию, благотворительность, списание обязательно должны вкладывать таблицу с указанием:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mb-5 font-normal text-gray-700">
              <li>Номер по порядку</li>
              <li>Инвентарный номер выбывающего ОС</li>
              <li>Фото инвентарного номера — инвентарник четкий, читаемый (не поворачивать)</li>
              <li>Фото общего вида ОС — без загромождения и без растягивания/сжатия фотографии</li>
            </ol>
            <p className="italic text-gray-500">Фотоотчет вкладывается в заявку в единственном экземпляре.</p>
          </div>
        </div>

        {/* Секция интерактивных таблиц */}
        <div className="px-4 flex flex-col gap-6">
          
          {/* ================= КОРРЕКТНЫЙ ПРИМЕР (1 и 2) ================= */}
          <div className="border-[3px] border-[#00B050] rounded-[24px] overflow-hidden bg-white shadow-sm">
            <div className="bg-[#00B050]/10 flex items-center justify-center gap-2 py-3 border-b-[3px] border-[#00B050]">
              <CheckCircle className="w-5 h-5 text-[#00B050]" />
              <h2 className="text-[#00B050] font-bold text-[14px] uppercase tracking-wide">Пример корректного отчета</h2>
            </div>
            
            <div className="w-full overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse min-w-[390px]">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50 text-gray-500 font-bold">
                    <th className="border-r border-gray-300 p-1.5 text-center w-7">№</th>
                    <th className="border-r border-gray-300 p-1.5 text-center w-20">Инв. №</th>
                    <th className="border-r border-gray-300 p-1.5 text-center w-[140px]">Фото инвентарника</th>
                    <th className="p-1.5 text-center w-[140px]">Фото общего вида</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Строка 1 */}
                  <tr className="border-b border-gray-200">
                    <td className="border-r border-gray-200 p-2 text-center font-bold text-gray-400">1</td>
                    <td className="border-r border-gray-200 p-2 font-bold text-gray-700 text-center">Uk-2617</td>
                    <td className="border-r border-gray-200 p-1">
                      <div className="bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img1a} alt="Тег 1" className="h-12 w-24 object-contain rounded bg-white shadow-sm" />
                        <span className="text-[9px] text-emerald-600 font-medium mt-1 leading-none">Четкий, горизонтальный</span>
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img1b} alt="ОС 1" className="h-12 w-24 object-contain rounded bg-white shadow-sm" />
                        <span className="text-[9px] text-emerald-600 font-medium mt-1 leading-none">Виден полностью</span>
                      </div>
                    </td>
                  </tr>
                  {/* Строка 2 */}
                  <tr className="border-b border-gray-200">
                    <td className="border-r border-gray-200 p-2 text-center font-bold text-gray-400">2</td>
                    <td className="border-r border-gray-200 p-2 font-bold text-gray-700 text-center">3-00875</td>
                    <td className="border-r border-gray-200 p-1">
                      <div className="bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img2a} alt="Тег 2" className="h-12 w-24 object-contain rounded bg-white shadow-sm" />
                        <span className="text-[9px] text-emerald-600 font-medium mt-1 leading-none">Читаемый код</span>
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img2b} alt="ОС 2" className="h-12 w-24 object-contain rounded bg-white shadow-sm" />
                        <span className="text-[9px] text-emerald-600 font-medium mt-1 leading-none">Объект по центру</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= НЕКОРРЕКТНЫЙ ПРИМЕР (3, 4, 5, 6) ================= */}
          <div className="border-[3px] border-[#DC2626] rounded-[24px] overflow-hidden bg-white shadow-sm">
            <div className="bg-[#DC2626]/10 flex items-center justify-center gap-2 py-3 border-b-[3px] border-[#DC2626]">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              <h2 className="text-[#DC2626] font-bold text-[14px] uppercase tracking-wide">Некорректный фотоотчет</h2>
            </div>
            
            <div className="w-full overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse min-w-[390px]">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50 text-gray-500 font-bold">
                    <th className="border-r border-gray-300 p-1.5 text-center w-7">№</th>
                    <th className="border-r border-gray-300 p-1.5 text-center w-20">Инв. №</th>
                    <th className="border-r border-gray-300 p-1.5 text-center w-[140px]">Фото инвентарника</th>
                    <th className="p-1.5 text-center w-[140px]">Фото общего вида</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Строка 3 (Фото 3a и 3b) */}
                  <tr className="border-b border-gray-200">
                    <td className="border-r border-gray-200 p-2 text-center font-bold text-gray-400">1</td>
                    <td className="border-r border-gray-200 p-2 font-bold text-gray-700 text-center">3-18778</td>
                    <td className="border-r border-gray-200 p-1">
                      <div className="bg-red-50 rounded-lg border border-red-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img3a} alt="Брак тег 3" className="h-12 w-24 object-contain rounded bg-white shadow-sm opacity-75 grayscale-[30%]" />
                        <span className="text-[9px] text-red-600 font-semibold mt-1 leading-none text-center">ИНВ не читаемый</span>
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="bg-red-50 rounded-lg border border-red-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img3b} alt="Брак ОС 3" className="h-12 w-24 object-contain rounded bg-white shadow-sm opacity-75" />
                        <span className="text-[9px] text-red-600 font-semibold mt-1 leading-none text-center">Загромождение</span>
                      </div>
                    </td>
                  </tr>

                  {/* Строка 4 (Фото 4a и 4b) */}
                  <tr className="border-b border-gray-200">
                    <td className="border-r border-gray-200 p-2 text-center font-bold text-gray-400">2</td>
                    <td className="border-r border-gray-200 p-2 font-bold text-gray-700 text-center">Us-3665</td>
                    <td className="border-r border-gray-200 p-1">
                      <div className="bg-red-50 rounded-lg border border-red-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img4a} alt="Брак тег 4" className="h-12 w-24 object-contain rounded bg-white shadow-sm opacity-75" />
                        <span className="text-[9px] text-red-600 font-semibold mt-1 leading-none text-center">Перевернут/Отражен</span>
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="bg-red-50 rounded-lg border border-red-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img4b} alt="Брак ОС 4" className="h-12 w-24 object-contain rounded bg-white shadow-sm opacity-75" />
                        <span className="text-[9px] text-red-600 font-semibold mt-1 leading-none text-center">Частично/Растянуто</span>
                      </div>
                    </td>
                  </tr>

                  {/* Строка 5 (Нет 5a, есть только 5b) */}
                  <tr className="border-b border-gray-200">
                    <td className="border-r border-gray-200 p-2 text-center font-bold text-gray-400">3</td>
                    <td className="border-r border-gray-200 p-2 font-bold text-gray-700 text-center">je-1439</td>
                    <td className="border-r border-gray-200 p-1">
                      <div className="bg-red-100 rounded-lg border-2 border-dashed border-red-300 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <span className="text-[10px] font-bold text-red-700 uppercase">НЕТ ФОТО</span>
                        <span className="text-[8px] text-red-500 font-medium mt-1 text-center leading-none">Фото инв. отсутствует!</span>
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="bg-red-50 rounded-lg border border-red-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img5b} alt="Брак ОС 5" className="h-12 w-24 object-contain rounded bg-white shadow-sm opacity-75" />
                        <span className="text-[9px] text-red-600 font-semibold mt-1 leading-none text-center">Обезано</span>
                      </div>
                    </td>
                  </tr>

                  {/* Строка 6 (Фото 6a и 6b) */}
                  <tr className="border-b border-gray-200">
                    <td className="border-r border-gray-200 p-2 text-center font-bold text-gray-400">4</td>
                    <td className="border-r border-gray-200 p-2 font-bold text-gray-700 text-center">je-2174</td>
                    <td className="border-r border-gray-200 p-1">
                      <div className="bg-red-50 rounded-lg border border-red-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img6a} alt="Брак тег 6" className="h-12 w-24 object-contain rounded bg-white shadow-sm opacity-75" />
                        <span className="text-[9px] text-red-600 font-semibold mt-1 leading-none text-center">Неверный ракурс</span>
                      </div>
                    </td>
                    <td className="p-1">
                      <div className="bg-red-50 rounded-lg border border-red-200 flex flex-col items-center justify-center p-1 min-h-[85px]">
                        <img src={img6b} alt="Брак ОС 6" className="h-12 w-24 object-contain rounded bg-white shadow-sm opacity-75" />
                        <span className="text-[9px] text-red-600 font-semibold mt-1 leading-none text-center">Обрезан объект</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}