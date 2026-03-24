# ⚡ FreelanceHub — Агрегатор фриланс-проектов

Агрегирует проекты с **Upwork, Freelancer.com, FL.ru, Habr Freelance и Kwork** в реальном времени. Уведомления в Telegram для премиум-пользователей.

**Стек:** Next.js 14 · Supabase · Vercel Cron · Telegram Bot API

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка Supabase

1. Создай аккаунт на [supabase.com](https://supabase.com)
2. Создай новый проект
3. Перейди в **SQL Editor** и выполни содержимое файла `supabase/schema.sql`
4. В разделе **Database → Replication** включи `projects` таблицу для Realtime

### 3. Переменные окружения

Скопируй `.env.example` в `.env.local` и заполни значения:

```bash
cp .env.example .env.local
```

| Переменная | Где взять |
|------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) в Telegram |
| `CRON_SECRET` | Любая случайная строка (генератор паролей) |
| `UPWORK_REFERRAL` | Твой реферальный токен Upwork (опционально) |
| `FREELANCER_REFERRAL` | Твой реферальный токен Freelancer (опционально) |
| `KWORK_REFERRAL` | Твой реферальный токен Kwork (опционально) |

### 4. Запуск в разработке

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

---

## 📦 Деплой на Vercel

```bash
# Установи Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

После деплоя добавь все переменные из `.env.local` в **Vercel → Settings → Environment Variables**.

Vercel автоматически подхватит `vercel.json` и запустит cron каждую минуту (`/api/cron/parse`).

> **Важно:** Vercel Cron требует план **Hobby** (бесплатный, но с ограничениями) или **Pro**. На Hobby — минимальный интервал 1 раз в день, на Pro — каждую минуту.

---

## 🤖 Настройка Telegram-бота

### Создание бота
1. Открой [@BotFather](https://t.me/BotFather)
2. `/newbot` → придумай имя → получи токен
3. Добавь токен в `TELEGRAM_BOT_TOKEN`

### Регистрация webhook
После деплоя вызови один раз:

```bash
curl "https://api.telegram.org/bot<ТВОЙ_ТОКЕН>/setWebhook?url=https://<ТВОЙ_ДОМЕН>/api/telegram/subscribe"
```

### Как пользователи подключают уведомления
1. Пользователь открывает бота, отправляет `/start`
2. Бот присылает **Chat ID**
3. Пользователь вставляет Chat ID на сайте в настройках профиля
4. Сайт вызывает `POST /api/telegram/subscribe` с `telegram_chat_id`
5. Готово — как только появится новый проект, придёт уведомление

---

## 🗂️ Структура проекта

```
freelance-aggregator/
├── app/
│   ├── api/
│   │   ├── projects/route.js        # GET /api/projects — список проектов
│   │   ├── cron/parse/route.js      # GET /api/cron/parse — запуск парсеров
│   │   └── telegram/subscribe/route.js  # POST — подписка на уведомления
│   ├── page.js                      # Главная страница (SSR)
│   ├── layout.js                    # Root layout
│   └── globals.css                  # Глобальные стили
├── components/
│   ├── Header.js                    # Шапка
│   ├── StatsBar.js                  # Полоса статистики
│   ├── Sidebar.js                   # Фильтры
│   ├── ProjectsFeed.js              # Лента проектов (realtime polling)
│   ├── ProjectCard.js               # Карточка проекта
│   └── SearchBar.js                 # Поиск
├── lib/
│   ├── supabase.js                  # Клиенты Supabase
│   ├── telegram.js                  # Отправка уведомлений
│   └── parsers/
│       ├── index.js                 # Оркестратор парсеров
│       ├── upwork.js                # Upwork RSS
│       ├── freelancer.js            # Freelancer.com API
│       ├── fl.js                    # FL.ru RSS
│       ├── habr.js                  # Habr Freelance RSS
│       └── kwork.js                 # Kwork HTML scraping
├── supabase/
│   └── schema.sql                   # SQL схема БД
├── vercel.json                      # Cron config (каждую минуту)
└── .env.example                     # Пример переменных окружения
```

---

## 🔧 Как добавить новую биржу

1. Создай файл `lib/parsers/new_source.js`
2. Экспортируй функцию `export async function parseNewSource() { return [...] }`
3. Верни массив объектов с полями: `external_id, source, title, description, budget_min, budget_max, currency, category, tags, url, referral_url, published_at`
4. Добавь импорт и вызов в `lib/parsers/index.js`
5. Добавь meta в `SOURCES` объект

---

## ⚡ Как работает realtime

- **Vercel Cron** запускает `/api/cron/parse` каждую минуту
- Парсеры работают параллельно (`Promise.allSettled`)
- Новые проекты добавляются через `upsert` (дубликаты игнорируются)
- Фронтенд делает **polling каждые 30 секунд** к `/api/projects?since=...`
- При появлении новых проектов показывается кнопка «N новых проектов»
- Telegram-уведомления отправляются сразу после добавления в БД

---

## 🛡️ Защита cron-эндпоинта

Vercel автоматически добавляет заголовок `Authorization: Bearer <CRON_SECRET>` при вызове cron. Эндпоинт проверяет этот заголовок и отклоняет неавторизованные запросы.

Для ручного запуска:
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<ДОМЕН>/api/cron/parse
```
