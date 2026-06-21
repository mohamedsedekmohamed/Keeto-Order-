"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "../context/LanguageContext";
import { MapPin, ChevronDown, Sun, Moon, User } from "lucide-react";
import { useToken } from "@/context/TokenContext";
import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
// 👈 استيراد useSearchParams لقط لقطة من الـ Query parameters
import { usePathname, useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

type Language = "English" | "العربية";

export default function TopNav() {
  const { setTheme, resolvedTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams(); // 👈 تهيئة الـ searchParams

  // 👈 تعديل ذكي: جلب الـ slug سواء من الـ Path أو من الـ Query Parameter (callbackSlug)
  const restaurantSlug =
    (params?.slug as string) ||
    (searchParams?.get("callbackSlug") as string) ||
    "";

  // استدعاءgetToken و isReady من الـ Context المحدث
  const { getToken, isReady } = useToken();

  // جلب التوكن الخاص بالمطعم الحالي ديناميكياً
  const currentToken = getToken(restaurantSlug);

  const toggleLanguage = (lang: Language) => {
    changeLanguage(lang);
    setIsLangMenuOpen(false);
  };

  const handleClick = () => {
    if (typeof window !== "undefined" && router) {
      if (!restaurantSlug) {
        // مستخدم جاي من الموقع العام (Aggregator)
        localStorage.setItem("login_source", "food_aggregator");
        router.push(`/auth/sign-in`);
      } else {
        // مستخدم داخل من لينك مباشر للمطعم
        localStorage.setItem("login_source", "online_order");
        router.push(`/auth/sign-in?callbackSlug=${restaurantSlug}`);
      }
    }
  };

  // حماية لمنع حدوث تضارب أثناء الـ Hydration
  if (!isReady) return null;

  return (
    <header className="w-full font-sans transition-all duration-500 shadow-sm dark:shadow-md dark:shadow-yellow-400/5 dark:border-b dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-2 bg-[#FCFDF2] dark:bg-gray-900 transition-colors duration-500 text-sm">
        {/* فحص التوكن الخاص بالمطعم الحالي بدلاً من التوكن العام القديم */}
        {currentToken ? (
          <Link
            href={
              restaurantSlug
                ? `/profile?callbackSlug=${restaurantSlug}`
                : "/profile"
            }
            className="flex items-center gap-2" // ضفتلك تنسيق بسيط عشان الأيقونة والكلام يبقوا جنب بعض مظبوط
          >
            <User className="w-5 h-5" />
            <span className="sm:block text-sm font-medium">{t("welcome")}</span>
          </Link>
        ) : (
          <span className="cursor-pointer font-medium" onClick={handleClick}>
            {t("signIn")}
          </span>
        )}

        {/* قسم اللغة والوضع الليلي */}
        <div className="flex items-center gap-6">
          {/* 🌍 اللغة */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1 transition hover:opacity-80"
            >
              {language === "English" ? (
                <ReactCountryFlag
                  countryCode="US"
                  svg
                  style={{ width: "1.5rem", height: "1.5rem" }}
                />
              ) : (
                <ReactCountryFlag
                  countryCode="EG"
                  svg
                  style={{ width: "1.5rem", height: "1.5rem" }}
                />
              )}

              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isLangMenuOpen ? "rotate-180 text-yellow-500" : ""
                }`}
              />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 z-50 w-20 p-2 mt-2 bg-white rounded-xl shadow-lg dark:bg-gray-900">
                <button
                  onClick={() => toggleLanguage("English")}
                  className="flex items-center justify-center w-full py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ReactCountryFlag
                    countryCode="US"
                    svg
                    style={{ width: "1.7rem", height: "1.7rem" }}
                  />
                </button>

                <button
                  onClick={() => toggleLanguage("العربية")}
                  className="flex items-center justify-center w-full py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ReactCountryFlag
                    countryCode="EG"
                    svg
                    style={{ width: "1.7rem", height: "1.7rem" }}
                  />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="p-1.5 rounded-full border border-yellow-400 hover:rotate-12 transition"
          >
            {resolvedTheme === "dark" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
