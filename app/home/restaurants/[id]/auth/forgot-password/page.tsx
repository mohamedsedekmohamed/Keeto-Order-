"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { useLanguage } from "../../../../../../context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import usePost from "@/hooks/usePost";
import { useAuth } from "@/context/AuthContext";
export default function EmailOnlyForm() {
  const { t } = useLanguage();
  const [email, setEmaill] = useState("");
  const router = useRouter();
  const { postData, loading: isSubmitting } = usePost('/api/user/auth/forgot-password');
const { setEmail } = useAuth();
  const isRtl = typeof document !== 'undefined' && document.dir === 'rtl';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
     await postData({ email }, null, t("signupSuccess"));

setEmail(email); // 🔥 هنا المهم
router.push("/auth/verify-reset-code");
    } catch (error) {
      console.error("Signup failed", error);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      
      {/* Background glow */}
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-yellow-400/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg p-8 sm:p-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[3rem] z-10"
      >
        {/* Top decorative line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-yellow-400 rounded-b-full shadow-[0_2px_10px_rgba(250,204,21,0.4)]"></div>

        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div 
            initial={{ rotate: -10, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-6 text-yellow-600 transition-colors bg-yellow-400/20 rounded-3xl dark:text-yellow-400 dark:bg-yellow-400/10"
          >
            <Mail size={32} strokeWidth={2.5} />
          </motion.div>

          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t("joinUs")}
          </h2>

          <p className="mt-3 text-base font-medium text-gray-500 dark:text-zinc-400">
            {t("enterEmailSubtitle")}
          </p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Email Input */}
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
              {t("email")}
            </label>

            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <Mail size={20} className="text-gray-400 transition-colors group-focus-within:text-yellow-500" />
              </div>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmaill(e.target.value)}
                placeholder={t("enterEmail") || "example@mail.com"}
                className="w-full py-4 text-gray-900 transition-all border-2 border-transparent outline-none bg-gray-100/50 rounded-2xl ps-12 pe-4 dark:bg-zinc-800/40 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="relative flex items-center justify-center w-full py-4.5 overflow-hidden font-black text-gray-900 transition-all bg-yellow-400 rounded-2xl hover:bg-yellow-500 shadow-xl shadow-yellow-400/20 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              {isSubmitting ? t("loading") : t("continue")}
              <ArrowRight
                size={20}
                className={`transition-transform ${
                  isRtl
                    ? "group-hover:-translate-x-1 rotate-180"
                    : "group-hover:translate-x-1"
                }`}
              />
            </span>
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
            <Link
              href="/"
              className="inline-block text-gray-400 transition-all hover:text-yellow-600 dark:hover:text-yellow-400 hover:underline underline-offset-4"
            >
              {t("backToHome")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}