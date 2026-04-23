"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../../context/LanguageContext";
import usePost from "@/app/hooks/usePost";
import { useRouter } from "next/navigation";
import { useToken } from "@/context/TokenContext";

export default function SignIn() {
  const { t } = useLanguage();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
const { setToken } = useToken();

  // 1. Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // 2. Initialize Hook
  const { postData, loading } = usePost("/api/user/auth/login");

  // 3. Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 4. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await postData(formData, null, t("loginSuccess"));
      setToken(response.data.data.token);

      router.push("/"); 
    } catch  {
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      
      {/* Background Orbs */}
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
                <Mail size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
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
              <button type="button" className="text-xs font-bold tracking-wider text-yellow-600 uppercase transition-colors hover:text-yellow-500 dark:text-yellow-500/80">
                {t("forgotPassword")}
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <Lock size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
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

          {/* Sign In Button */}
          <motion.button
            disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            className={`relative flex items-center justify-center w-full py-4.5 mt-4 overflow-hidden font-black text-gray-900 transition-all bg-yellow-400 rounded-2xl shadow-xl shadow-yellow-400/20 group ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-yellow-500'}`}
          >
            <span className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {t("SignInbtn")}
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
          </motion.button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
            {t("noAccount")}{" "}
            <Link href="/auth/sign-up" className="inline-block text-yellow-600 transition-all dark:text-yellow-400 hover:underline underline-offset-4">
              {t("createAccount")}
            </Link>
          </p>
        </div>
        <div className="mt-10 text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
            {t("ForgotPassword")}{" "}
            <Link href="/auth/forgot-password" className="inline-block text-yellow-600 transition-all dark:text-yellow-400 hover:underline underline-offset-4">
              {t("resetPassword")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}