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

  // Tracks the URL we last fetched (or are currently fetching), NOT just
  // whether we've ever fetched anything. A plain "hasFetched once" boolean
  // permanently locks the hook after its first successful call, so if `url`
  // later changes (e.g. a query param resolves after mount, like
  // restaurantId going from a slug fallback to the real id) it would never
  // fetch again until the component fully remounts (hard refresh).
  const lastFetchedUrl = useRef<string | null>(null);
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

      const isNoToken =
        errorMsg.toLowerCase().includes("no token provided") ||
        errorMsg.toLowerCase().includes("no token");

      if (isNoToken) {
        setError(null);
      } else {
        setError(errorMsg);
        if (errorMsg) {
          toast.error(errorMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!isReady || !url) return; // 3. Don't run if context isn't ready or url is null

    // Only skip if this exact URL was already the last one we fetched —
    // this still prevents duplicate calls (e.g. StrictMode's double-invoke
    // in dev) while allowing a genuinely new URL to trigger a fresh fetch.
    if (lastFetchedUrl.current === url) return;
    lastFetchedUrl.current = url;

    fetchData();
  }, [fetchData, isReady, url]);

  // Manual refetch() should always hit the network regardless of the
  // last-fetched-url guard above (e.g. "refresh my orders" button).
  const refetch = useCallback(async () => {
    lastFetchedUrl.current = url;
    await fetchData();
  }, [fetchData, url]);

  return { data, loading, error, refetch };
}