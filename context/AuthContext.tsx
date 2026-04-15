"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  email: string;
  setEmail: (email: string) => void;
  code: string;
  setCode: (code: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [email, setEmailState] = useState("");
  const [code, setCodeState] = useState("");

  // تحميل البيانات عند أول فتح
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("email") || "";
    const savedCode = sessionStorage.getItem("code") || "";

    setEmailState(savedEmail);
    setCodeState(savedCode);
  }, []);

  // تحديث email + تخزينه
  const setEmail = (value: string) => {
    setEmailState(value);
    sessionStorage.setItem("email", value);
  };

  // تحديث code + تخزينه
  const setCode = (value: string) => {
    setCodeState(value);
    sessionStorage.setItem("code", value);
  };

  return (
    <AuthContext.Provider value={{ email, setEmail, code, setCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};