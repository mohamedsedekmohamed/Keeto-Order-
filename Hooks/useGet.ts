"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import api from "../api/api";
import { AxiosError } from "axios";
import { useToken } from "@/context/TokenContext";

type UseGetReturn<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export default function useGet<T = any>(url: string): UseGetReturn<T> {
  const [data, setData] = useState<T | null>(null);
  // نجعل التحميل true في البداية حتى ينتهي من فحص التوكن
  const [loading, setLoading] = useState<boolean>(true); 
  const [error, setError] = useState<string | null>(null);
  
  const hasFetched = useRef(false);
  const { isReady } = useToken(); // نستورد isReady للتأكد من حالة التطبيق

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      // لم نعد بحاجة لإضافة التوكن هنا، الـ Axios Interceptor سيقوم بذلك!
      const res = await api.get<T>(url);

      setData(res.data);
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError<any>;

      const errorMsg =
        axiosError.response?.data?.error?.message ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Request failed";

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    // 👈 لا تقم بأي طلب حتى يتأكد الـ Context من وجود أو عدم وجود توكن
    if (!isReady) return; 

    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchData();
  }, [fetchData, isReady]); // أضفنا isReady هنا

  return { data, loading, error, refetch: fetchData };
}