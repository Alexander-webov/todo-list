# Премиум-гейтинг ленты + AI + Telegram

Возвращает платную модель: лимит 5 проектов для не-премиум, AI и Telegram-уведомления только для премиума, две кнопки оплаты (YooKassa 149 ₽ / Stripe $5).

## Логика доступа

| Что              | Гость        | Залогинен (free) | Премиум |
|------------------|--------------|------------------|---------|
| Проекты в ленте  | 5            | 5                | все     |
| Register-gate    | ✓            | ✗                | ✗       |
| Premium-gate     | ✗            | ✓ (две кнопки)   | ✗       |
| AI-отклики       | 401          | 402 → /pricing   | ✓       |
| Telegram-уведомления | ✗        | ✗                | ✓       |
| Infinite scroll  | ✗            | ✗                | ✓       |
| Live updates     | ✗            | ✗                | ✓       |
| Welcome-banner и мотиватор | ✗  | ✗                | ✓       |

## Изменённые файлы

- `components/PremiumGate.js` — переписан: убран триал, добавлены **две кнопки оплаты** (YooKassa, Stripe) с прямым вызовом API создания платежа
- `components/PremiumGate.module.css` — стили для двух кнопок оплаты
- `components/ProjectsFeed.js` — теперь рендерит `PremiumGate` для не-премиум залогиненных, `RegisterGate` для гостей. Все «премиум-only» виджеты (mp4, infinite scroll, live updates, welcome banner, мотиватор) гейтятся через `hasFullAccess`
- `components/ProjectCard.js` — кнопка AI теперь у не-премиум выглядит как `🔒 AI Отклик` и сразу ведёт на `/pricing?from=ai`. Если как-то API вернёт 402 — модалка закрывается и редирект тоже на `/pricing`
- `app/api/generate-response/route.js` — добавлена проверка `is_premium`. Не-премиум получает 402 + `premium_required: true`
- `lib/telegram.js` — `sendNewProjectNotifications` теперь шлёт **только премиум-юзерам** с активной подпиской (фильтр на `is_premium=true AND (premium_until IS NULL OR premium_until > now())`)
- `app/pricing/page.js` — переписана: 2 тарифа в карточках с прямыми кнопками оплаты, проверка текущего премиум-статуса, спецзаголовок при заходе из AI-кнопки (`?from=ai`)
- `app/pricing/pricing.module.css` — добавлены `.period`, `.errorMsg`, `.premiumActive`, `.premiumActiveLink`
- `app/api/trial/route.js` — заглушка 410 Gone, триал отключён

## Новые файлы

- `app/api/profile/me/route.js` — `GET` минимальные данные текущего профиля (premium статус, роль) для клиентских компонентов

## Развёртывание

**SQL миграция не нужна** — все поля уже существуют (`profiles.is_premium`, `profiles.premium_until`).

Только деплой кода.

## Конфигурация цен

Цены захардкожены, потому что это разные платежные системы:
- YooKassa: `app/api/payment/yookassa/create/route.js` → `const AMOUNT = '149.00'`
- Stripe: `app/api/payment/stripe/create/route.js` → `unit_amount: 500` ($5.00 в центах)

Если будешь менять — меняй в обоих местах + в pricing-странице и в PremiumGate.

## Что проверить после деплоя

1. **Под гостем (incognito)** — открыть `/`, увидеть 5 проектов и **register-gate** «Зарегистрироваться бесплатно»
2. **Зарегистрироваться** новым акком — увидеть **те же 5 проектов** + **premium-gate** с двумя кнопками оплаты
3. **Кликнуть AI-Отклик** — увидеть замок, по клику попасть на `/pricing?from=ai` со спецзаголовком
4. **Оплатить** через YooKassa/Stripe → после возврата с биржи в `/dashboard?payment=success` должен срабатывать webhook и активировать премиум
5. **Под премиум-юзером** — увидеть **всю ленту**, infinite scroll, AI-отклики работают, Telegram-уведомления приходят
6. **Telegram cron** (`/api/cron/parse`) — после фикса должен слать только премиумам. Проверь что не-премиум перестали получать уведомления (если у кого-то была подписка раньше)

## Откат

Если нужно временно вернуть бесплатность — в `components/ProjectsFeed.js` поменяй:
```js
const hasFullAccess = isPremium;
// → на:
const hasFullAccess = isLoggedIn;
```
И верни старую логику в `lib/telegram.js` (убери фильтр `is_premium`) и `app/api/generate-response/route.js` (убери проверку премиума). Но это делать не рекомендую — теряется монетизация.
