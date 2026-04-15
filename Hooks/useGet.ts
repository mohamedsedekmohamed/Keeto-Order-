"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../api/api";
import { AxiosError } from "axios";

type UseGetReturn<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export default function useGet<T = any>(url: string): UseGetReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
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
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}