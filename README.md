# KAIROS — тестовое задание (Fullstack)

Одностраничный лендинг «KAIROS» по макету из Figma: адаптивная вёрстка на чистом
TypeScript/CSS (сборка — Vite), автоплей видео в Hero, авторизация через Google
OAuth2 и live-курсы криптовалют по публичному WebSocket (Binance).

```
kairos/
├── frontend/   # Vite + TypeScript + CSS, без фреймворков
└── backend/    # Python (Flask) — только Google OAuth2 handshake
```

## Как это работает

- **Hero**: фоновое видео `<video autoplay muted loop playsinline>` — комбинация
  атрибутов, которая гарантированно автоплеится во всех современных браузерах
  (звук по спецификации обязан быть выключен для автоплея). Кнопка «Play Video»
  открывает то же видео в модалке уже со звуком и контролами.
- **Google-кнопка**: фронтенд ничего не знает о client secret. Клик редиректит
  на `GET /auth/google/login` бэкенда → бэкенд редиректит на Google →
  Google возвращает код на `GET /auth/google/callback` → бэкенд обменивает код
  на токен, забирает профиль (`name`, `email`, `picture`) и редиректит
  обратно на фронтенд с этими данными в query-параметрах. Сессий и БД нет,
  как и требовалось — состояние авторизации хранится только в `localStorage`
  на клиенте.
- **Курсы криптовалют**: один общий WebSocket на
  `wss://stream.binance.com:9443/stream?streams=...@ticker` (публичный,
  без ключа). Для пар без ликвидного тикера на Binance (Tether как quote-актив
  сам по себе, Midnight — новый токен без пары к USDT) на месте остаётся
  статичное значение из макета, вместо того чтобы ронять весь виджет.

## Быстрый старт локально

### 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# впишите в .env свои GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (см. ниже)
python app.py
# сервер поднимется на http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # по умолчанию уже указывает на http://localhost:8000
npm run dev
# откройте адрес, который выведет Vite (обычно http://localhost:5173)
```

### 3. Видео для Hero

Файлы `hero-video.mp4` и `hero-poster.jpg` не хранятся в репозитории как
плейсхолдеры — положите свой экспорт в `frontend/public/assets/` (см.
`frontend/public/assets/README.md`). Дальше всё работает без правок кода.

## Настройка Google OAuth2

1. В [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   создайте OAuth client ID типа **Web application**.
2. В **Authorized redirect URIs** добавьте:
   - `http://localhost:8000/auth/google/callback` — для локальной разработки;
   - `https://<ваш-бэкенд-домен>/auth/google/callback` — для продакшена.
3. Client ID и Client Secret положите в `backend/.env`.
4. `BACKEND_PUBLIC_URL` и `FRONTEND_URL` в `backend/.env` должны совпадать
   с реальными адресами в проде (иначе Google откажет в редиректе, а CORS
   на бэкенде не пустит фронтенд).

## Продакшен-сборка

```bash
cd frontend
npm run build      # -> frontend/dist, статика для любого хостинга
npm run preview    # локальный просмотр собранной версии
```

## Деплой

Проект не завязан на конкретную платформу — ниже рабочая связка, которую
проще всего поднять бесплатно:

- **Frontend** (`frontend/dist`): Vercel / Netlify / Cloudflare Pages.
  Build command: `npm run build`, output dir: `dist`. Не забудьте задать
  `VITE_BACKEND_URL` в переменных окружения хостинга — это адрес бэкенда.
- **Backend**: Render / Railway / Fly.io — деплой как обычное Python-приложение
  (`Procfile` уже включён: `gunicorn app:app`). Переменные окружения —
  как в `backend/.env.example`, только с реальными продакшен-значениями.

После деплоя обновите **Authorized redirect URI** в Google Cloud на реальный
адрес бэкенда и `FRONTEND_URL`/`VITE_BACKEND_URL` в переменных окружения
обоих сервисов — иначе редирект после логина уйдёт не туда.

## Стек и ограничения по ТЗ

- Frontend: TypeScript + CSS, без фреймворков/библиотек, сборка через Vite.
- Backend: Python (Flask) — выбран из допустимого списка (Go/PHP/Rust/Python).
- Без работы с сессиями и без БД — как и требует ТЗ.
- Курсы криптовалют — публичный WebSocket (Binance), без API-ключа.
