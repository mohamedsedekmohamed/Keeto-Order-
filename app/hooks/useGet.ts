"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import api from "../../api/api";
import { AxiosError } from "axios";
import { useToken } from "@/context/TokenContext";

type UseGetReturn<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

// 1. Changed parameter type to string | null
export default function useGet<T = any>(url: string | null): UseGetReturn<T> {
  const [data, setData] = useState<T | null>(null);
  // Only set loading to true initially if we actually have a URL to fetch
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);

  const hasFetched = useRef(false);
  const { isReady } = useToken();

  const fetchData = useCallback(async (): Promise<void> => {
    if (!url) return; // 2. Guard clause to prevent fetching null URLs

    try {
      setLoading(true);
      const res = await api.get<T>(url);
      setData(res.data);
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError<any>;

      let errorMsg =
        axiosError.response?.data?.error?.message ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Request failed";

      if (errorMsg.toLowerCase().includes("no token provided")) {
        errorMsg = "Login please";
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!isReady || !url) return; // 3. Don't run if context isn't ready or url is null

    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchData();
  }, [fetchData, isReady, url]);

  return { data, loading, error, refetch: fetchData };
}
