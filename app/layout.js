import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'FreelanceHub — все фриланс-проекты в одном месте',
  description: 'Агрегатор проектов с FL.ru, Kwork, Freelancer.com, Workzilla и Freelance.ru. Обновляется каждые 5 минут. Уведомления в Telegram.',
  keywords: 'фриланс, фриланс проекты, удалённая работа, FL.ru, Kwork, Freelancer',
  openGraph: {
    title: 'FreelanceHub — все фриланс-проекты в одном месте',
    description: 'Агрегатор проектов с 5 бирж. Обновляется каждые 5 минут.',
    url: 'https://allfreelancershere.ru',
    siteName: 'FreelanceHub',
    locale: 'ru_RU',
    type: 'website',
  },
};

const YANDEX_METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
const YANDEX_VERIFICATION = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION;

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* Подтверждение Яндекс Вебмастер */}
        {YANDEX_VERIFICATION && (
          <meta name="yandex-verification" content={YANDEX_VERIFICATION} />
        )}

        {/* Яндекс Метрика */}
        {YANDEX_METRIKA_ID && (
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym(${YANDEX_METRIKA_ID}, "init", {
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                webvisor: true
              });
            `}
          </Script>
        )}
      </head>
      <body>
        {YANDEX_METRIKA_ID && (
          <noscript>
            <div>
              <img src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
                style={{ position: 'absolute', left: '-9999px' }} alt="" />
            </div>
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}
