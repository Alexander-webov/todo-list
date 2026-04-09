export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/settings/', '/projects/'],
      },
    ],
    sitemap: 'https://www.allfreelancershere.ru/sitemap.xml',
  };
}
