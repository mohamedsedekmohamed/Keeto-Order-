"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "../context/LanguageContext";
import {
  MapPin,
  ChevronDown,
  Sun,
  Moon,

} from "lucide-react";

type Language = "English" | "العربية";
export default function TopNav() {
const {  setTheme, resolvedTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const toggleLanguage = (lang: Language) => {
    changeLanguage(lang);
    setIsLangMenuOpen(false);
  };

  
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
          
          {/* القائمة المنسدلة للغة */}
          <div className="relative">
            <div 
              className="flex items-center gap-2 transition-opacity cursor-pointer hover:opacity-80"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            >
              <span className="text-base">{language === "English" ? "🇺🇸" : "🇪🇬"}</span>
              <span className="font-medium text-gray-800 select-none dark:text-gray-200">
                {language}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-800 dark:text-gray-200 transition-transform duration-300 ${isLangMenuOpen ? "rotate-180 text-yellow-500" : ""}`} />
            </div>

            {/* عناصر قائمة اللغة مع تأثير ظهور ناعم */}
            {isLangMenuOpen && (
              <div className="absolute z-50 w-32 py-1 mt-3 duration-200 bg-white border border-gray-100 rounded-md shadow-xl top-full ltr:right-0 rtl:left-0 dark:bg-gray-900 dark:border-gray-800 animate-in fade-in zoom-in">
                <button 
                  onClick={() => toggleLanguage("English")}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 transition-colors dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-gray-800 hover:text-yellow-500 dark:hover:text-yellow-400"
                >
                  🇺🇸 English
                </button>
                <button 
                  onClick={() => toggleLanguage("العربية")}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 transition-colors dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-gray-800 hover:text-yellow-500 dark:hover:text-yellow-400"
                >
                  🇪🇬 العربية
                </button>
              </div>
            )}
          </div>

          {/* زر الوضع الليلي/النهاري مع تأثير دوران وتوهج */}
          <button 
onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-full border border-yellow-400 text-yellow-500 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-gray-800 transition-all duration-500 hover:rotate-[30deg] flex items-center justify-center dark:hover:shadow-[0_0_12px_rgba(253,224,71,0.4)]"
            title="Toggle Dark Mode"
          >
{resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}          </button>
        </div>
      </div>

   
    </header>
  );
}