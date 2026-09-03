"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import usePost from "@/app/hooks/usePost";
import { useToken } from "@/context/TokenContext";
import { useLanguage } from "../../../../context/LanguageContext";

// Parses Facebook's redirect, which returns the token in the URL *hash*
// (e.g. #access_token=...&state=...), not as a query string.
function parseHashParams(hash: string) {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(clean);
}

export default function FacebookCallback() {
  const router = useRouter();
  const { t } = useLanguage();
  const { setToken } = useToken();
  const { postData: loginWithFacebook } = usePost("/api/user/auth/facebook");
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      try {
        const hashParams = parseHashParams(window.location.hash);
        const searchParams = new URLSearchParams(window.location.search);

        // Facebook can return errors either in the query string (user
        // cancelled) or leave the hash empty.
        const errorDescription =
          searchParams.get("error_description") ||
          hashParams.get("error_description");
        const accessToken = hashParams.get("access_token");

        if (errorDescription) {
          setError(errorDescription);
          return;
        }

        if (!accessToken) {
          setError("Facebook did not return an access token.");
          return;
        }

        const rawState = hashParams.get("state") || searchParams.get("state");
        let restaurantId: string | null = null;
        let callbackSlug: string | null = null;

        if (rawState) {
          try {
            const parsed = JSON.parse(decodeURIComponent(rawState));
            restaurantId = parsed?.restaurantId ?? null;
            callbackSlug = parsed?.callbackSlug ?? null;
          } catch {
            // ignore malformed state
          }
        }

        const response = await loginWithFacebook(
          { accessToken, restaurantId },
          null,
          t("loginSuccess"),
        );

        const token =
          response?.token ||
          response?.data?.token ||
          response?.data?.data?.token;

        if (!token) {
          setError("Login failed. Please try again.");
          return;
        }

        setToken(token, callbackSlug || undefined);
        const redirectPath = callbackSlug
          ? `/home/restaurants/${callbackSlug}/restaurant`
          : "/";
        router.replace(redirectPath);
      } catch (err) {
        console.error("Facebook callback error", err);
        setError("Something went wrong signing you in with Facebook.");
      }
    };

    run();
  }, [loginWithFacebook, router, setToken, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 bg-gray-50 dark:bg-zinc-950">
      {error ? (
        <>
          <p className="text-base font-bold text-center text-gray-900 dark:text-white">
            {error}
          </p>
          <button
            type="button"
            onClick={() => router.push("/auth/sign-in")}
            className="px-6 py-3 font-bold text-gray-900 bg-yellow-400 rounded-2xl hover:bg-yellow-500"
          >
            {t("back") || "Back to sign in"}
          </button>
        </>
      ) : (
        <>
          <Loader2 className="animate-spin text-yellow-500" size={32} />
          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
            {t("loginSuccess") || "Signing you in..."}
          </p>
        </>
      )}
    </div>
  );
}
