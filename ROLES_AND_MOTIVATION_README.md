# Обновление: роли, отклики и мотивация

Реализует 4 фичи в одном пакете:

1. **Роль при регистрации** — 5 ролей (Дизайнер / Видеомонтажёр / Разработчик / SMM-специалист / Другое)
2. **Укрупнённые категории в UI** — 5 ролей маппятся на 10 существующих категорий БД
3. **Улучшенная детекция категорий** — все парсеры теперь категоризуют по названию **и описанию**
4. **Трекинг откликов + мотиватор** (как hh.ru, но лучше)
5. **Мотивация возврата** — visit streak, XP, welcome banner

## Новые файлы

**SQL:**
- `supabase/schema-v8-roles-and-tracking.sql` — поля в `profiles`, таблица `applications`, RPC `ping_user_visit`, RPC `get_application_stats`

**Логика ролей:**
- `lib/roles.js` — ROLES + маппинг role → категории

**API:**
- `app/api/profile/init/route.js` — сохранение роли после регистрации (POST/PATCH)
- `app/api/applications/track/route.js` — POST: записать отклик
- `app/api/applications/stats/route.js` — GET: статистика для виджета
- `app/api/visit/ping/route.js` — POST: обновить streak при заходе

**UI-компоненты:**
- `components/ApplicationMotivator.js` + `.module.css` — виджет мотивации с кольцом прогресса
- `components/WelcomeBackBanner.js` + `.module.css` — welcome back при новом дне

## Изменённые файлы

- `app/register/page.js` — добавлен выбор роли (5 кнопок)
- `app/api/projects/route.js` — фильтр `?role=developer` + поиск по title + description
- `components/ProjectCard.js` — трекает отклик при клике на AI и "Перейти"
- `components/ProjectsFeed.js` — рендерит `<WelcomeBackBanner />` и `<ApplicationMotivator />`
- `components/Sidebar.js` — блок «По профессии» над категориями
- `lib/parsers/youdo.js` — `detectCategoryYoudo` теперь читает и Description

## Развёртывание

**1. Миграция SQL**  
Supabase → SQL Editor → выполнить `supabase/schema-v8-roles-and-tracking.sql`.

**2. Деплой.** Всё остальное — код, он сам подхватится после деплоя.

## Как работает мотиватор

**Целевая цифра — 15 откликов в день.** Это медианная оценка в 2026 году
для конверсии отклик→ответ (~7%). Значение захардкожено в
`app/api/applications/stats/route.js` как `APPS_PER_PROJECT = 15`.
Поменять можно там в одну строку.

**Хорошие отклики = project_score ≥ 20** (бюджет 5-10к и выше). Порог в
том же файле (`GOOD_SCORE_THRESHOLD`).

**Тексты-алерты** меняются динамически:
- `today=0`: "Начни откликаться прямо сейчас"
- `today=1-2`: "Откликнись ещё X раз"
- `today=3-14` + 3+ хороших: "Ты откликнулся на 3 хороших заказа — шанс получить ответ высокий"
- `today=3-14` иначе: "Отличный темп! Ещё X откликов до цели"
- `today≥15`: "🔥 Дневная цель достигнута"

Тексты в одном месте — `components/ApplicationMotivator.js`, функция по
ifs в середине файла. Подкрутить легко.

## Как работает visit streak

RPC `ping_user_visit` в БД умно считает разрыв:
- `<20 часов`: тот же день, ничего не начисляем (защита от множественных пингов)
- `20-48 часов`: следующий день → +1 к стрику
- `>48 часов`: пропуск → стрик обнуляется в 1

XP начисляется:
- +10 за отклик, +5 бонус если отклик на «жирный» заказ (score ≥ 30)
- +5 за заход в новый день + бонус от streak

## Маппинг ролей → категории

```js
designer   → ['Графический дизайн', 'Web дизайн']
videomaker → ['Видеомонтаж']
developer  → ['FrontEnd', 'BackEnd', 'Вёрстка', 'WordPress / Tilda / CMS', 'Парсинг']
smm        → ['SMM']
other      → ['Другое']
```

В БД категории хранятся детально (10 категорий) — так точнее парсинг и SEO.
Фильтр на фронте `?role=developer` превращается в `WHERE category IN (...)`.

Если нужно поменять маппинг — `lib/roles.js`, одна константа `ROLE_TO_CATEGORIES`.

## Что НЕ сделано

- **Откат роли в настройках профиля** (ProfileSettings.js) — можно добавить через `/api/profile/init` PATCH. Пользователь может поменять роль через существующий селект, если его добавить.
- **Страницы-ленды под роли** (типа `/developer`, `/designer`) — можно сделать позже как SEO-дополнение к существующим категорийным страницам.
