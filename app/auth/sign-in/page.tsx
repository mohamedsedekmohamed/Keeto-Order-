"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../../context/LanguageContext";
import usePost from "@/app/hooks/usePost";
import { useRouter, useSearchParams } from "next/navigation";
import { useToken } from "@/context/TokenContext";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Script from "next/script";
import { useEffect } from "react";

const AppleIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 384 512"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 0 184.8 0 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

declare global {
  interface Window {
    AppleID: any;
  }
}

export default function SignIn() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const { setToken } = useToken();
  const isRtl = typeof document !== "undefined" && document.dir === "rtl";
  const callbackSlug = searchParams.get("callbackSlug");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).AppleID) {
        (window as any).AppleID.auth.init({
          clientId: "org.keeto.orderfood.web",
          scope: "name email",
          usePopup: true,
          redirectURI: `https://orderfood.keeto.org/auth/apple/callback`,
        });

        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const { postData, loading } = usePost("/api/user/auth/login");
  const { postData: loginWithGoogle, loading: isGoogleLoading } = usePost(
    "/api/user/auth/google",
  );
  const { postData: loginWithApple, loading: isAppleLoading } = usePost(
    "/api/user/auth/apple",
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSuccessAuth = (token: string) => {
    setToken(token, callbackSlug);
   const redirectPath = callbackSlug ? `/home/restaurants/${callbackSlug}` : "/";
    router.push(redirectPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await postData(formData, null, t("loginSuccess"));
      const token =
        response?.token || response?.data?.token || response?.data?.data?.token;
      if (token) {
        handleSuccessAuth(token);
      }
    } catch {}
  };

  return (
    <GoogleOAuthProvider clientId="798541723323-gt1bh29472nra4ujivcsnnc9f662gr08.apps.googleusercontent.com">
      <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-yellow-400/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          strategy="afterInteractive"
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg p-8 sm:p-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[3rem] z-10"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-yellow-400 rounded-b-full shadow-[0_2px_10px_rgba(250,204,21,0.4)]"></div>

          <div className="mb-10 text-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute flex items-center gap-2 text-sm font-bold text-gray-600 transition-all left-6 top-6 dark:text-zinc-300 hover:text-yellow-500"
            >
              <ArrowRight
                size={18}
                className={`${isRtl ? "" : "rotate-180"}`}
              />
              {t("back") || "Back"}
            </button>
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 mb-6 text-yellow-600 transition-colors bg-yellow-400/20 rounded-3xl dark:text-yellow-400 dark:bg-yellow-400/10"
            >
              <LogIn size={32} strokeWidth={2.5} />
            </motion.div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              {t("signIn")}
            </h2>
            <p className="mt-3 text-base font-medium text-gray-500 dark:text-zinc-400">
              {t("welcomeBack")}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-2 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
                {t("email")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                  <Mail
                    size={20}
                    className="text-gray-400 transition-colors group-focus-within:text-yellow-500"
                  />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("enterEmail")}
                  className="w-full py-4.5 text-gray-900 transition-all bg-gray-100/50 border-2 border-transparent outline-none rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ms-1">
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300">
                  {t("password")}
                </label>
                <Link
                  href={
                    callbackSlug
                      ? `/auth/forgot-password?callbackSlug=${callbackSlug}`
                      : "/auth/forgot-password"
                  }
                  className="text-xs font-bold text-yellow-600 transition-colors dark:text-yellow-400 hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                  <Lock
                    size={20}
                    className="text-gray-400 transition-colors group-focus-within:text-yellow-500"
                  />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("enterPassword")}
                  className="w-full py-4.5 text-gray-900 dark:text-white bg-gray-100/50 dark:bg-zinc-800/40 border-2 border-transparent outline-none rounded-2xl ps-12 pe-12 placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all block"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 flex items-center px-4 text-gray-400 end-0 hover:text-yellow-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading || isGoogleLoading || isAppleLoading}
              className={`relative flex items-center justify-center w-full py-4.5 mt-4 overflow-hidden font-black text-gray-900 transition-all bg-yellow-400 rounded-2xl shadow-xl shadow-yellow-400/20 group ${
                loading || isGoogleLoading || isAppleLoading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-yellow-500"
              }`}
            >
              <span className="flex items-center gap-2">
                {loading || isGoogleLoading || isAppleLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {t("SignInbtn")}
                    <ArrowRight
                      size={20}
                      className={`transition-transform ${isRtl ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"}`}
                    />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
              {isRtl ? "أو سجل دخول عبر" : "Or Sign In Via"}
            </span>
            <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Google Button (Customized) */}
            <div className="relative h-10 w-full">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    if (credentialResponse.credential) {
                      const response = await loginWithGoogle(
                        { token: credentialResponse.credential },
                        null,
                        t("loginSuccess"),
                      );
                      const token =
                        response?.token ||
                        response?.data?.token ||
                        response?.data?.data?.token;
                      if (token) handleSuccessAuth(token);
                    }
                  } catch {}
                }}
                containerProps={{
                  style: {
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    position: "absolute",
                    zIndex: 10,
                    cursor: "pointer",
                  },
                }}
              />
              {/* الزر الوهمي المطابق لزر أبل */}
              <div className="w-full h-full flex items-center justify-center gap-2 border border-gray-300 dark:border-zinc-700 rounded-full bg-white dark:bg-black text-gray-700 dark:text-white font-medium pointer-events-none">
                {/* أيقونة جوجل */}
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.3-4.74 3.3-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.19 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </div>
            </div>

            {/* Apple Button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  const appleResponse = await window.AppleID.auth.signIn();
                  const idToken = appleResponse?.authorization?.id_token;
                  if (!idToken) return;
                  const response = await loginWithApple(
                    { token: idToken },
                    null,
                    t("loginSuccess"),
                  );
                  const token =
                    response?.token ||
                    response?.data?.token ||
                    response?.data?.data?.token;
                  if (token) handleSuccessAuth(token);
                } catch (error) {
                  console.error("Apple Login Error", error);
                }
              }}
              className="h-10 w-full flex items-center justify-center gap-2 rounded-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <AppleIcon className="w-4 h-4 dark:fill-white" />
              <span className="text-sm font-medium text-gray-700 dark:text-white">
                Apple
              </span>
            </button>
          </div>

          <div className="mt-12 text-center space-y-3">
            <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
              {t("noAccount")}{" "}
              <Link
                href={
                  callbackSlug
                    ? `/auth/sign-up?callbackSlug=${callbackSlug}`
                    : "/auth/sign-up"
                }
                className="inline-block text-yellow-600 transition-all dark:text-yellow-400 hover:underline underline-offset-4"
              >
                {t("createAccount")}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </GoogleOAuthProvider>
  );
}
