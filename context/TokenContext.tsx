"use client";

import { createContext, useContext, useEffect, useState } from "react";

type TokenContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  isReady: boolean; // 👈 الجديد
};

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false); // 👈 الجديد

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      setTokenState(storedToken);
    }

    setIsReady(true); // 👈 مهم جدًا
  }, []);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
    setTokenState(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setTokenState(null);
  };

  return (
    <TokenContext.Provider value={{ token, setToken, logout, isReady }}>
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