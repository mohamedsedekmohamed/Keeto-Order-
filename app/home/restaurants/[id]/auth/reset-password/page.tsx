"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../../../../../context/LanguageContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import usePost from "@/app/hooks/usePost";
import { toast } from "react-hot-toast";

export default function ResetPassword() {
  const { t } = useLanguage();
  const router = useRouter();
  const { email, code } = useAuth(); // سحب البيانات من الـ Context

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const isRtl = typeof document !== 'undefined' && document.dir === 'rtl';

  // استخدام الهوك الذي قمنا بتعديله
  const { postData, loading: isSubmitting } = usePost("/api/user/auth/reset-password");



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // التحقق من تطابق كلمة المرور
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordsDoNotMatch"));
      return;
    }

    try {
      await postData(
        { email, code, newPassword },
        null,
        t("passwordResetSuccess")
      );

      router.push("/auth/sign-in");
    } catch (error) {

      console.error("Reset password failed", error);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">

      {/* Background Effects */}
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-yellow-400/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg p-8 sm:p-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[3rem] z-10"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-yellow-400 rounded-b-full"></div>

        <div className="mb-8 text-center">
          <motion.div className="inline-flex items-center justify-center w-20 h-20 mb-6 text-yellow-600 bg-yellow-400/20 rounded-3xl dark:text-yellow-400 dark:bg-yellow-400/10">
            <KeyRound size={32} strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl dark:text-white">
            {t("resetPasswordTitle")}
          </h2>
          <p className="mt-3 text-base font-medium text-gray-500 dark:text-zinc-400">
            {t("enterNewPasswordSubtitle")}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* New Password */}
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
              {t("newPassword")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <Lock size={18} className="text-gray-400 group-focus-within:text-yellow-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full py-4 text-gray-900 border-2 border-transparent outline-none bg-gray-100/50 rounded-2xl ps-12 pe-12 dark:bg-zinc-800/40 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                placeholder="••••••••"
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

          {/* Confirm Password */}
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
              {t("confirmNewPassword")}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <CheckCircle2 size={18} className="text-gray-400 group-focus-within:text-yellow-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full py-4 text-gray-900 border-2 border-transparent outline-none bg-gray-100/50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="relative flex items-center justify-center w-full py-4.5 mt-6 font-black text-gray-900 bg-yellow-400 rounded-2xl hover:bg-yellow-500 shadow-xl shadow-yellow-400/20 disabled:opacity-60 group"
          >
            <span className="flex items-center gap-2">
              {isSubmitting ? t("loading") : t("updatePassword")}
              {!isSubmitting && <ArrowRight size={20} className={`transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />}
            </span>
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/auth/sign-in" className="text-sm font-bold text-gray-500 transition-colors dark:text-zinc-400 hover:text-yellow-600 dark:hover:text-yellow-400">
            {t("backToLogin")}
          </Link>
        </div>

      </motion.div>
    </div>
  );
}