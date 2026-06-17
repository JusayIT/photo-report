// Имя кэша для входящих файлов (ваш старый кэш)
const SHARE_CACHE = 'shared-files-cache';
// НОВЫЙ КЭШ: Для статики самого приложения (HTML, JS, CSS)
const STATIC_CACHE = 'app-static-v1';

// При установке воркера можно заранее закэшировать главную страницу
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(['/', '/index.html']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. ВАШ КОД: Перехватываем только POST-запрос, который отправляет Share Target
  if (event.request.method === 'POST' && url.pathname === '/shared-incoming-file') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('shared-file') || formData.get('image');

          if (file) {
            const cache = await caches.open(SHARE_CACHE);
            await cache.put('/shared-incoming-file', new Response(file));
          }
        } catch (error) {
          console.error('Ошибка сохранения расшаренного файла в SW:', error);
        }

        return Response.redirect('/', 303);
      })()
    );
    return; // Выходим, чтобы код ниже не перехватил этот POST-запрос
  }

  // 2. НОВЫЙ КОД: Обработка оффлайна для обычных запросов (GET)
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Если файл есть в кэше — отдаем его (быстрая загрузка)
        if (cachedResponse) {
          // Параллельно обновляем кэш из сети на будущее (Stale-While-Revalidate)
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {/* Игнорируем ошибки сети в фоне */});
          
          return cachedResponse;
        }

        // Если файла в кэше нет, идем в сеть
        return fetch(event.request)
          .then((networkResponse) => {
            // Кэшируем только успешные ответы от нашего же сайта
            if (networkResponse.status === 200 && url.origin === self.location.origin) {
              const responseToCache = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {
            // ОФФЛАЙН-ФОЛБЕК: Если сети нет и это запрос страницы (навигация), возвращаем корень сайта
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
    );
  }
});