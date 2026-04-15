"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import en from "../locales/en.json";
import ar from "../locales/ar.json";

// 1. تحديد أنواع اللغات المتاحة بصرامة
type Language = "English" | "العربية";

// 2. استخراج المفاتيح المتاحة من ملف الترجمة
type TranslationKey = keyof typeof en;

// 3. تعريف الـ Type الخاص بالبيانات
interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // اللغة الافتراضية هي الإنجليزية
  const [language, setLanguage] = useState<Language>("English");
  
  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language | null;
    
    if (savedLang && (savedLang === "English" || savedLang === "العربية")) {
      // ✅ التعديل هنا: مش هنعمل setState إلا لو اللغة المحفوظة مختلفة عن الافتراضية
      if (savedLang !== "English") {
        setLanguage(savedLang);
      }
      
      // تحديث اتجاه لغة المتصفح فوراً عند التحميل
      document.documentElement.dir = savedLang === "العربية" ? "rtl" : "ltr";
      document.documentElement.lang = savedLang === "العربية" ? "ar" : "en";
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    
    document.documentElement.dir = lang === "العربية" ? "rtl" : "ltr";
    document.documentElement.lang = lang === "العربية" ? "ar" : "en";
  };

  const t = (key: TranslationKey | string): string => {
    const dictionary: Record<string, string> = language === "English" ? en : ar;
    return dictionary[key as string] || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};