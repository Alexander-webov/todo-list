# Telegram Queue — инструкция по внедрению

Очередь постинга в Telegram с админкой. Парсеры больше не шлют в каналы
напрямую — они кладут проекты в таблицу `posting_queue`, а отдельный cron
раз в 12 минут достаёт из очереди top-N по score и публикует.

## Что изменилось

**Новые файлы:**
- `supabase/schema-v7-posting-queue.sql` — миграция (очередь, настройки, лог)
- `app/api/cron/post-telegram-queue/route.js` — cron-воркер постинга
- `app/api/admin/telegram-queue/settings/route.js` — GET/PATCH настроек
- `app/api/admin/telegram-queue/stats/route.js` — GET статистики + очистка очереди
- `app/admin/telegram-queue/page.js` — SSR-обёртка
- `app/admin/telegram-queue/TelegramQueueClient.js` — UI админки
- `app/admin/telegram-queue/queue.module.css` — стили

**Изменённые файлы:**
- `lib/telegram.js` — `sendNewProjectNotifications` теперь кладёт в очередь,
  а не постит в каналы. Платная реклама и личные уведомления работают как раньше.
- `app/admin/AdminClient.js` — добавлена ссылка на `/admin/telegram-queue` в табе Telegram
- `vercel.json` — добавлен cron `*/12 * * * *` для очереди,
  частота парсинга снижена с `* * * * *` до `*/2 * * * *`

## Шаги развёртывания

### 1. Выполни SQL в Supabase
Открой Supabase Dashboard → SQL Editor и выполни содержимое
`supabase/schema-v7-posting-queue.sql`. Создаст таблицы и дефолтные настройки.

### 2. Убедись что в `.env` заданы переменные
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHANNEL_RU` или `TELEGRAM_CHANNEL_INT` (или оба)
- `CRON_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Задеплой код
После деплоя Vercel сам запустит два cron по расписанию
(нужен Pro план для `*/2 * * * *`; на Hobby используй `*/5 * * * *` для парсинга).

### 4. Открой админку
`https://твой-домен/admin/telegram-queue`

**Сразу после деплоя рекомендую:**
- поставить `is_enabled = false` (кнопка СТОП)
- посмотреть сутки как очередь заполняется, какие score у проектов
- подкрутить `min_score` — если в очереди много мусора, подними до 15-20
- включить постинг (`is_enabled = true`), выставить нужный `posts_per_hour`

## Как работает

```
Парсеры (cron /api/cron/parse, раз в 2 мин)
    ↓
projects (upsert новых)
    ↓
sendNewProjectNotifications()
    ↓
    ├── скорит каждый проект (scoreProject из lib/telegram.js)
    ├── отсекает спам и неразрешённые категории (score <= -1000)
    └── кладёт остальные в posting_queue со статусом 'pending'

Отдельно: /api/cron/post-telegram-queue (раз в 12 мин)
    ↓
    ├── читает telegram_settings
    ├── если is_enabled=false → выход
    ├── если активна платная реклама → выход (как и раньше)
    ├── помечает старые pending (> max_queue_age_hours) как 'skipped'
    ├── берёт top-N по score из pending (где score >= min_score)
    ├── N = posts_per_hour / 5  (5 запусков в час)
    └── постит в Telegram, помечает статус posted/failed
```

## Настройки из админки

| Поле | Описание | Дефолт |
|---|---|---|
| `is_enabled` | Вкл/выкл постинг | true |
| `posts_per_hour` | Сколько постов в час (на оба канала суммарно) | 5 |
| `min_score` | Не постим, если score ниже | 10 |
| `max_queue_age_hours` | Протухание в очереди | 6 |

## Что делать, если очередь переполнилась
В админке есть кнопка **«Очистить очередь»** — пометит все pending как skipped.
Парсеры продолжат копить новую очередь.

## Откат к старому поведению
Если что-то пошло не так — откати `lib/telegram.js` и `vercel.json`.
Таблицы `posting_queue`/`telegram_settings`/`telegram_posts_log` в БД можно
оставить — они не мешают.
