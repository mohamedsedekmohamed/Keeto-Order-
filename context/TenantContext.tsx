"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  Tenant,
  resolveTenant,
  buildLink as buildTenantLink,
  MAIN_HOSTS,
  getCleanHost,
} from "@/lib/tenant";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { usePathname } from "next/navigation";

interface TenantContextType {
  tenant: Tenant;
  isResolving: boolean;
  error: Error | null;
  retry: () => Promise<void>;
  buildLink: (page?: string, slugOverride?: string) => string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { t, language } = useLanguage();
  const isRtl = language === "العربية" || t("dir") === "rtl";

  const [tenant, setTenant] = useState<Tenant>(() => {
    // Initial quick synchronous check: if localhost or orderfood.keeto.org, we know it's path mode
    if (typeof window !== "undefined") {
      const host = getCleanHost();
      if (!host || MAIN_HOSTS.includes(host)) {
        return { mode: "path", slug: null, name: null, id: null };
      }
    }
    return { mode: "path", slug: null, name: null, id: null };
  });

  const [isResolving, setIsResolving] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const host = getCleanHost();
      return !!host && !MAIN_HOSTS.includes(host);
    }
    return false;
  });

  const [error, setError] = useState<Error | null>(null);

  const initTenant = useCallback(async () => {
    const host = getCleanHost();
    if (!host || MAIN_HOSTS.includes(host)) {
      setTenant({ mode: "path", slug: null, name: null, id: null });
      setIsResolving(false);
      setError(null);
      return;
    }

    setIsResolving(true);
    setError(null);

    try {
      const resolved = await resolveTenant(host);
      setTenant(resolved);

      if (resolved.mode === "custom" && resolved.id && resolved.slug) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("restaurantId", resolved.id);
          localStorage.setItem(`restaurant_id_${resolved.slug}`, resolved.id);
        }
      }
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsResolving(false);
    }
  }, []);

  useEffect(() => {
    initTenant();
  }, [initTenant]);

  // Handle SEO & Canonical URL in custom mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (tenant.mode === "custom") {
      if (tenant.name) {
        document.title = tenant.name;
      }

      // Add canonical link pointing to the custom domain
      let canonicalLink = document.querySelector(
        'link[rel="canonical"]',
      ) as HTMLLinkElement | null;
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.rel = "canonical";
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = window.location.origin + window.location.pathname;
    }
  }, [tenant]);

  const pathname = usePathname();

  const buildLink = useCallback(
    (page: string = "", slugOverride?: string) => {
      let slug = slugOverride || tenant.slug || "";
      if (!slug && pathname) {
        const match = pathname.match(/^\/home\/restaurants\/([^/]+)/);
        if (match && match[1]) {
          slug = match[1];
        }
      }
      return buildTenantLink({ ...tenant, slug }, page, slug);
    },
    [tenant, pathname],
  );

  // 1. Startup Loader: "Run once before the router mounts, and show a loader until it finishes."
  if (isResolving) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-950 p-6">
        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400 animate-pulse">
          {isRtl ? "جاري تحميل المتجر..." : "Loading store..."}
        </p>
      </div>
    );
  }

  // 2. 404: "404: show a 'This site is not available' page."
  if (tenant.mode === "notfound") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-950 p-6 text-center"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mb-6 shadow-sm">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
          {isRtl ? "هذا الموقع غير متاح" : "This site is not available"}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-zinc-400 max-w-md mb-8">
          {isRtl
            ? "النطاق المطلوب غير مرتبط بأي مطعم نشط حالياً. يرجى التحقق من الرابط والمحاولة مرة أخرى."
            : "The requested domain is not linked to any active restaurant. Please check the address and try again."}
        </p>
      </div>
    );
  }

  // 3. Network error: "Network error: show a retry screen, not the 404 page."
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-950 p-6 text-center"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="w-20 h-20 rounded-3xl bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center mb-6 shadow-sm">
          <RefreshCw size={36} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
          {isRtl ? "تعذر الاتصال بالخادم" : "Connection Failed"}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-zinc-400 max-w-md mb-8">
          {isRtl
            ? "حدث خطأ في الاتصال أثناء التحقق من النطاق. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً."
            : "A network error occurred while connecting to the server. Please check your internet connection and try again."}
        </p>
        <button
          onClick={initTenant}
          className="flex items-center gap-2 px-6 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold rounded-2xl shadow-lg shadow-yellow-400/20 active:scale-95 transition-all text-sm"
        >
          <RefreshCw size={18} />
          <span>{isRtl ? "إعادة المحاولة" : "Retry"}</span>
        </button>
      </div>
    );
  }

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isResolving,
        error,
        retry: initTenant,
        buildLink,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
