// public/sw.js

// Имя кэша для входящих файлов
const SHARE_CACHE = 'shared-files-cache';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Перехватываем только POST-запрос, который отправляет Share Target
  if (event.request.method === 'POST' && url.pathname === '/shared-incoming-file') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('shared-file') || formData.get('image');

          if (file) {
            const cache = await caches.open(SHARE_CACHE);
            // Сохраняем файл в кэш, чтобы React (App.jsx) мог его забрать
            await cache.put('/shared-incoming-file', new Response(file));
          }
        } catch (error) {
          console.error('Ошибка сохранения расшаренного файла в SW:', error);
        }

        // Редирекми пользователя на главную страницу приложения, где сработает React
        return Response.redirect('/', 303);
      })()
    );
  }
});