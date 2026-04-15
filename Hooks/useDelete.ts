"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../api/api";
import { AxiosError } from "axios";

type DeleteResponse = {
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
  };
};

type UseDeleteReturn<T> = {
  deleteData: (customUrl?: string | null) => Promise<T>;
  loading: boolean;
  error: string | null;
};

export default function useDelete<T = DeleteResponse>(
  defaultUrl: string
): UseDeleteReturn<T> {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteData = async (
    customUrl: string | null = null
  ): Promise<T> => {
    try {
      setLoading(true);

      const res = await api.delete<T>(customUrl || defaultUrl);

      const response = res.data as DeleteResponse;

      if (response?.success) {
        toast.success("Deleted successfully!");
      } else {
        toast.error(response?.error?.message || "Delete failed!");
      }

      return res.data;
    } catch (err) {
      const axiosError = err as AxiosError<any>;

      const errorMsg =
        axiosError.response?.data?.error?.message ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Delete request failed";

      setError(errorMsg);
      toast.error(errorMsg);

      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return { deleteData, loading, error };
}