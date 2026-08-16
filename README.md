# KAIROS

Адаптивный landing-сайт по макету из Figma с авторизацией через Google OAuth2 и курсами криптовалют в реальном времени.

- **Живой сайт:** https://kairos-drab-theta.vercel.app/
- **Backend:** https://kairos-kpmc.onrender.com/

> Backend развёрнут на бесплатном тарифе Render и «засыпает» после ~15 минут без запросов — первый вход через Google после простоя может занять 30–50 секунд, пока сервис поднимается.

## Возможности

- **Hero-секция** с фоновым видео, которое автоматически запускается в любом браузере (`autoplay muted loop playsinline`), и кнопкой полноэкранного просмотра со звуком.
- **Вход через Google (OAuth2)** — Authorization Code flow. Клиентский секрет никогда не попадает во фронтенд: весь обмен кодом на токен происходит на backend. Сессии и база данных не используются — backend возвращает профиль (имя, email, аватар) фронтенду через query-параметры после успешного входа.
- **Курсы криптовалют в реальном времени** — прямое подключение к публичному WebSocket-потоку Binance (`wss://stream.binance.com`), без API-ключа. Для монет без ликвидной пары на Binance (например, Midnight) используется статичное значение из макета.
- **Адаптивная вёрстка** — отдельные раскладки для десктопа, планшета и мобильных экранов.

## Стек

| | |
|---|---|
| **Frontend** | TypeScript + CSS (без фреймворков и UI-библиотек), сборка через **Vite** |
| **Backend** | Python, **Flask** (без базы данных и серверных сессий) |
| **Данные о ценах** | Публичный WebSocket Binance |
| **Авторизация** | Google OAuth2 |

## Структура проекта

```
kairos/
├── frontend/   # Vite + TypeScript + CSS
└── backend/    # Flask — только OAuth2-обмен с Google
```

## Backend: эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/health` | Проверка, что сервис жив |
| `GET` | `/auth/google/login` | Инициирует вход: редиректит на страницу согласия Google |
| `GET` | `/auth/google/callback` | Google возвращается сюда с одноразовым кодом; backend обменивает его на токен, получает профиль пользователя и редиректит обратно на frontend с данными в query-параметрах |

## Запуск локально

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Впишите в `backend/.env` собственные `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` (Google Cloud Console → Credentials → OAuth Client ID, тип Web application; Authorized redirect URI: `http://localhost:8000/auth/google/callback`).

```bash
python app.py
```

Backend поднимется на `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite выведет адрес (обычно `http://localhost:5173`).

## Сборка для продакшена

```bash
cd frontend
npm run build      # → frontend/dist
npm run preview    # локальная проверка собранной версии
```

## Деплой

- **Frontend** (Vercel) — root directory `frontend`, build command `npm run build`, output directory `dist`, переменная окружения `VITE_BACKEND_URL` = адрес backend.
- **Backend** (Render) — root directory `backend`, start command `gunicorn app:app`, переменные окружения `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, `BACKEND_PUBLIC_URL`.

После деплоя в Google Cloud Console добавляется боевой `Authorized redirect URI`:
`https://kairos-kpmc.onrender.com/auth/google/callback`

## Автор

Разработано в рамках тестового задания.
Репозиторий: https://github.com/dankor10/KAIROS
