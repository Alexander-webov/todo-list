import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text   = message.text || '';
    const firstName = message.from?.first_name || 'Фрилансер';

    if (text === '/start' || text.startsWith('/start')) {
      await sendTelegramMessage(
        chatId,
        `👋 Привет, <b>${firstName}</b>!\n\n` +
        `Я бот <b>FreelanceHub</b> — агрегатора фриланс-проектов.\n\n` +
        `🔑 Твой <b>Chat ID</b>: <code>${chatId}</code>\n\n` +
        `Скопируй этот ID и вставь в настройках профиля на сайте, ` +
        `чтобы получать уведомления о новых проектах.`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[TG webhook]', err);
    return NextResponse.json({ ok: true });
  }
}
