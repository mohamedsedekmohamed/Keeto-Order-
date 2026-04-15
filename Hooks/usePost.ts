"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../api/api";
import { AxiosError } from "axios";

type UsePostReturn<T> = {
  postData: (
    body?: any,
    customUrl?: string | null,
    toastMessage?: string
  ) => Promise<T>;
  loading: boolean;
  error: string | null;
};

export default function usePost<T = any>(
  defaultUrl: string = ""
): UsePostReturn<T> {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const postData = async (
    body: any = {},
    customUrl: string | null = null,
    toastMessage: string = "Success"
  ): Promise<T> => {
    try {
      setLoading(true);

      const url = String(customUrl || defaultUrl);

      const res = await api.post<T>(url, body);

      toast.success(toastMessage);

      return res.data;
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      // الوصول المباشر لبيانات الرد من السيرفر
      const responseData = axiosError.response?.data;

      let errorMessage = "حدث خطأ غير متوقع"; // رسالة افتراضية بالعربي

      // 1. التحقق من الهيكل الذي أرسلته: error.message
      if (responseData?.error?.message) {
        errorMessage = responseData.error.message;
      } 
      // 2. التحقق من وجود مصفوفة تفاصيل (إذا كان هناك Validation)
      else if (responseData?.error?.details && Array.isArray(responseData.error.details)) {
        errorMessage = responseData.error.details.map((e: any) => e.message).join("\n");
      }
      // 3. التحقق من رسالة Axios العامة
      else if (axiosError.message) {
        errorMessage = axiosError.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);

      // نلقي الخطأ ليتوقف الـ handleSubmit في الصفحة عن إكمال التوجيه (Router.push)
throw errorMessage;
    }  finally {
      setLoading(false);
    }
  };

  return { postData, loading, error };
}