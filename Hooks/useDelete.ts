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

  const deleteData = async (customUrl: string | null = null): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.delete<T>(customUrl || defaultUrl);
      const response = res.data as DeleteResponse;

      if (response?.success) {
        toast.success("Deleted successfully!");
      } else if (response?.error?.message) {
        toast.error(response.error.message);
      }

      return res.data;
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorObj = axiosError.response?.data?.error;

      let errorMessage = "Delete request failed";

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

  return { deleteData, loading, error };
}