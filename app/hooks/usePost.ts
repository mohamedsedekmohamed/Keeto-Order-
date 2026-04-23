"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../api/api";
import { AxiosError } from "axios";

type UsePostReturn<T> = {
  postData: (
    body?: any,
    customUrl?: string | null,
    toastMessage?: string | null
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
    toastMessage: string | null = null
  ): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const url = String(customUrl || defaultUrl);
      const res = await api.post<T>(url, body);

      if (toastMessage) toast.success(toastMessage);

      return res.data;
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorObj = axiosError.response?.data?.error;

      let errorMessage = "Unexpected error occurred"; 

      if (errorObj?.details && Array.isArray(errorObj.details)) {
        errorMessage = errorObj.details.map((e: any) => e.message).join("\n");
      } else if (errorObj?.message) {
        errorMessage = errorObj.message;
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { postData, loading, error };
}