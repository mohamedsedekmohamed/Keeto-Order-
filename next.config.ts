// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "keetobcknd.keeto.org",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "keetobcknd.keeto.org",
        pathname: "/uploads/**",
      },
      { protocol: "https", hostname: "example.com", pathname: "/images/**" },
    ],
    dangerouslyAllowSVG: true,
  },
  async rewrites() {
    return [
      // تعديل الـ sign-up لتمرير السلوج كـ query parameter تلقائياً
      {
        source: "/home/restaurants/:slug/auth/sign-up",
        destination: "/auth/sign-up?callbackSlug=:slug",
      },
      // إضافة نفس الـ rewrite لصفحة تسجيل الدخول (Sign In) عشان تحل نفس المشكلة هناك
      {
        source: "/home/restaurants/:slug/auth/sign-in",
        destination: "/auth/sign-in?callbackSlug=:slug",
      },
    ];
  },
};

export default nextConfig;
