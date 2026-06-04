import Dexie from 'dexie';

// Инициализируем локальную базу данных для хранения отчетов по ТЗ
export const db = new Dexie('PhotoReportDB');

db.version(1).stores({
  reports: '++id, type, date, count' // Автоинкрементный ID, тип списания, дата, количество ОС
});