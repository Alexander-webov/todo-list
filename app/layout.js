import './globals.css';
import Script from 'next/script';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://allfreelancershere.ru';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'FreelanceHub — все фриланс-заказы в одном месте',
    template: '%s | FreelanceHub',
  },
  description: 'Агрегатор фриланс-проектов с FL.ru, Kwork, Freelancer.com, Workzilla и Freelance.ru. Обновляется каждые 5 минут. Уведомления в Telegram. Первые 7 дней бесплатно.',
  keywords: [
    'фриланс заказы', 'агрегатор фриланс', 'найти заказы фриланс',
    'FL.ru заказы', 'Kwork заказы', 'удалённая работа', 'фриланс биржа',
    'заказы для фрилансеров', 'фриланс проекты', 'найти клиентов фриланс',
  ],
  authors: [{ name: 'FreelanceHub' }],
  creator: 'FreelanceHub',
  publisher: 'FreelanceHub',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: SITE_URL,
    siteName: 'FreelanceHub',
    title: 'FreelanceHub — все фриланс-заказы в одном месте',
    description: 'FL.ru + Kwork + Freelancer.com + Workzilla в одной ленте. Обновляется каждые 5 минут.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'FreelanceHub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreelanceHub — все фриланс-заказы в одном месте',
    description: 'FL.ru + Kwork + Freelancer.com + Workzilla в одной ленте.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

const YANDEX_METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

// Schema.org разметка для сайта
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FreelanceHub',
  url: SITE_URL,
  description: 'Агрегатор фриланс-проектов с FL.ru, Kwork, Freelancer.com, Workzilla и Freelance.ru',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FreelanceHub',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* Яндекс верификация */}
        {process.env.NEXT_PUBLIC_YANDEX_VERIFICATION && (
          <meta name="yandex-verification" content={process.env.NEXT_PUBLIC_YANDEX_VERIFICATION} />
        )}

        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {/* Яндекс Метрика */}
        {YANDEX_METRIKA_ID && (
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym(${YANDEX_METRIKA_ID}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });`}
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
