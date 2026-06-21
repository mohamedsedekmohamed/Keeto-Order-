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

export default function SignIn() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const { setToken } = useToken();
  const isRtl = typeof document !== "undefined" && document.dir === "rtl";

  // قراءة الـ callbackSlug الحالي مباشرة من الـ URL إن وجد
  const callbackSlug = searchParams.get("callbackSlug");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Hooks للمصادقة
  const { postData, loading } = usePost("/api/user/auth/login");
  const { postData: loginWithGoogle, loading: isGoogleLoading } = usePost(
    "/api/user/auth/google",
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSuccessAuth = (token: string) => {
    // حفظ التوكن مربوطاً بالـ slug الحالي ديناميكياً
    setToken(token, callbackSlug);

    let redirectPath = "/";

    if (callbackSlug) {
      redirectPath = `/home/restaurants/${callbackSlug}`;
    } else {
      redirectPath = "/";
    }

    router.push(redirectPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await postData(formData, null, t("loginSuccess"));
      // تمرير الـ token من نموذج الـ Credentials التقليدي
      const token = response?.token || response?.data?.token || response?.data?.data?.token;
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
            {/* Email Input */}
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

            {/* Password Input */}
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
                  className="w-full py-4.5 text-gray-900 transition-all bg-gray-100/50 border-2 border-transparent outline-none rounded-2xl ps-12 pe-12 dark:bg-zinc-800/40 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
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
              disabled={loading || isGoogleLoading}
              className={`relative flex items-center justify-center w-full py-4.5 mt-4 overflow-hidden font-black text-gray-900 transition-all bg-yellow-400 rounded-2xl shadow-xl shadow-yellow-400/20 group ${loading || isGoogleLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-yellow-500"}`}
            >
              <span className="flex items-center gap-2">
                {loading || isGoogleLoading ? (
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

          {/* Separator */}
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
              {isRtl ? "أو سجل دخول عبر" : "Or Sign In Via"}
            </span>
            <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
          </div>

          {/* Google Sign In Option */}
          <div className="flex justify-center w-full transform scale-105">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  if (credentialResponse.credential) {
                    const response = await loginWithGoogle(
                      { token: credentialResponse.credential },
                      null,
                      t("loginSuccess"),
                    );

                    // 👈 تم تعديل الفحص هنا ليكون شاملاً ويدعم كل مستويات الرد المتوقعة مثل الـ Sign Up بالضبط
                    const token =
                      response?.token ||
                      response?.data?.token ||
                      response?.data?.data?.token;

                    if (token) {
                      handleSuccessAuth(token);
                    }
                  }
                } catch {}
              }}
              onError={() => console.error("Google authentication failed")}
              shape="pill"
              theme={
                typeof window !== "undefined" &&
                document.documentElement.classList.contains("dark")
                  ? "filled_blue"
                  : "outline"
              }
              width="100%"
            />
          </div>

          <div className="mt-10 text-center space-y-3">
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