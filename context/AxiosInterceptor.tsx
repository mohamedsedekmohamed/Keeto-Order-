"use client";

import { useEffect } from "react";
import api from "../api/api";
import { useToken } from "./TokenContext"; // تأكد من مسار ملف الـ Context

export const AxiosInterceptor = ({ children }: { children: React.ReactNode }) => {
  const { token } = useToken();

  useEffect(() => {
    // إعداد الـ Interceptor
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // تنظيف (Cleanup) الـ Interceptor عند تغير التوكن أو إغلاق المكون
    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  return <>{children}</>;
};