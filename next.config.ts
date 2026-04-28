import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // يسمح بعرض الصور من أي رابط خارجي (أفضل خيار لو الروابط متغيرة)
  remotePatterns: [
      {
        protocol: 'http',
        hostname: 'keetobcknd.keeto.org',
        port: '',
        pathname: '/uploads/**',
      },
      // يفضل إضافة نفس النطاق ببروتوكول https أيضاً للاحتياط
      {
        protocol: 'https',
        hostname: 'keetobcknd.keeto.org',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com', // أضفته لأن رسالة الخطأ الأخيرة ذكرته
        port: '',
        pathname: '/images/**',
      },
    ],
    // إذا كنت تستخدم صور Base64 يفضل تفعيل هذا الخيار في بعض النسخ
    dangerouslyAllowSVG: true, 
  },
  /* باقي الخيارات هنا */
};

export default nextConfig;