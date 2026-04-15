import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // يسمح بعرض الصور من أي رابط خارجي (أفضل خيار لو الروابط متغيرة)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // علامة النجمتين تعني السماح لجميع المواقع
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // إذا كنت تستخدم صور Base64 يفضل تفعيل هذا الخيار في بعض النسخ
    dangerouslyAllowSVG: true, 
  },
  /* باقي الخيارات هنا */
};

export default nextConfig;