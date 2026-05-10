"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "../context/LanguageContext";
import { MapPin, ChevronDown, Sun, Moon, User } from "lucide-react";
import { useToken } from "@/context/TokenContext";
import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import { usePathname } from "next/navigation";
type Language = "English" | "العربية";
export default function TopNav() {
  const { setTheme, resolvedTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const pathname = usePathname();
  const toggleLanguage = (lang: Language) => {
    changeLanguage(lang);
    setIsLangMenuOpen(false);
  };
  const hideAuthSection = pathname.startsWith("/home/restaurants/");
  const { token } = useToken();

  return (
    <header className="w-full font-sans transition-all duration-500 shadow-sm dark:shadow-md dark:shadow-yellow-400/5 dark:border-b dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-2 bg-[#FCFDF2] dark:bg-gray-900 transition-colors duration-500 text-sm">
        {/* قسم الموقع */}
        <div className="flex items-center gap-1 cursor-pointer group">
          <MapPin className="w-4 h-4 text-yellow-400 fill-yellow-400" />

          <ReactCountryFlag
            countryCode="EG"
            svg
            style={{
              width: "1.5rem",
              height: "1.5rem",
            }}
          />
        </div>

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

          {!hideAuthSection &&
            (token ? (
              <Link href="/profile" className="transition hover:scale-110">
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href={`/auth/sign-in`}
                className="transition hover:text-yellow-500"
              >
                {t("signIn")}
              </Link>
            ))}
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
