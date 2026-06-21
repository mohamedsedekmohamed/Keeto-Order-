"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
type TokenContextType = {
  getToken: (slug?: string | null) => string | null;
  setToken: (token: string | null, slug?: string | null) => void;
  logout: (slug?: string | null) => void;
  isReady: boolean;
  token: string | null; // 👈 رجعنا الخاصية هنا كـ Fallback لحماية الملفات القديمة من الـ Crash
};

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const [, setTick] = useState(0);
  const params = useParams();
  const searchParams = useSearchParams(); // 👈 هيدر تفعيله هنا

  // جلب الـ slug الحالي سواء من الـ path أو من الـ query parameter
  const currentSlug =
    (params?.slug as string) ||
    (searchParams?.get("callbackSlug") as string) ||
    undefined;

  // جلب الـ slug الحالي تلقائياً من المسار إن وجد

  useEffect(() => {
    setIsReady(true);
  }, []);

  const getToken = (slug?: string | null) => {
    if (typeof window === "undefined") return null;
    const key = slug ? `token_${slug}` : "token";
    return localStorage.getItem(key);
  };

  const setToken = (newToken: string | null, slug?: string | null) => {
    const key = slug ? `token_${slug}` : "token";
    if (newToken) {
      localStorage.setItem(key, newToken);
    } else {
      localStorage.removeItem(key);
    }
    setTick((prev) => prev + 1);
  };

  const logout = (slug?: string | null) => {
    const key = slug ? `token_${slug}` : "token";
    localStorage.removeItem(key);
    setTick((prev) => prev + 1);
  };

  // 👈 هنا السحر: لو ملف قديم طلب الـ token كـ متغيراً عادياً، هنحسبهوله ديناميكياً بناء على المطعم المفتوح حالياً
  const fallbackToken = getToken(currentSlug);

  return (
    <TokenContext.Provider
      value={{
        getToken,
        setToken,
        logout,
        isReady,
        token: fallbackToken, // 👈 تمرير التوكن التلقائي لحماية الـ Destructuring القديم
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useToken must be used inside TokenProvider");
  }
  return context;
};
