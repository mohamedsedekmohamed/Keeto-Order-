"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "../context/LanguageContext";
import {
  MapPin,
  ChevronDown,
  Sun,
  Moon,
User
} from "lucide-react";
import { useToken } from "@/context/TokenContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
type Language = "English" | "العربية";
export default function TopNav() {
const {  setTheme, resolvedTheme } = useTheme();
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
        <div className="flex items-center gap-1 group">
          <MapPin className="w-4 h-4 text-yellow-400 fill-yellow-400 group-hover:animate-bounce" />
          <span className="font-bold text-yellow-500 dark:text-yellow-400">{t("location")}</span>
          <div className="flex items-center gap-1 ml-1 text-gray-800 transition-colors duration-300 cursor-pointer dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400">
            {t("egypt")} <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* قسم اللغة والوضع الليلي */}
   <div className="flex items-center gap-6">
  
  {/* 🌍 اللغة */}
  <div className="relative">
    <div 
      className="flex items-center gap-2 cursor-pointer hover:opacity-80"
      onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
    >
      <span>{language === "English" ? "🇺🇸" : "🇪🇬"}</span>
      <span className="font-medium dark:text-gray-200">{language}</span>
      <ChevronDown
        className={`w-4 h-4 transition-transform ${
          isLangMenuOpen ? "rotate-180 text-yellow-500" : ""
        }`}
      />
    </div>

    {isLangMenuOpen && (
      <div className="absolute z-50 w-32 py-1 mt-2 bg-white rounded-md shadow-lg dark:bg-gray-900">
        <button onClick={() => toggleLanguage("English")} className="block w-full px-4 py-2 text-left hover:text-yellow-500">
          🇺🇸 English
        </button>
        <button onClick={() => toggleLanguage("العربية")} className="block w-full px-4 py-2 text-left hover:text-yellow-500">
          🇪🇬 العربية
        </button>
      </div>
    )}
  </div>

 {!hideAuthSection && (
  token ? (
    <Link href="/profile" className="transition hover:scale-110">
      <User className="w-5 h-5" />
    </Link>
  ) : (
    <Link href={`/auth/sign-in`} className="transition hover:text-yellow-500">
      {t("signIn")}
    </Link>
  )
)}
  <button
    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
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