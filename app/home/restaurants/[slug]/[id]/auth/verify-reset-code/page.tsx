"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "../../../../../../../context/LanguageContext";
import { useRouter } from "next/navigation";
import usePost from "@/app/hooks/usePost";
import { useAuth } from "@/context/AuthContext";

export default function VerifyResetCode() {
  const { t } = useLanguage();
  const router = useRouter();

  const { postData, loading: isSubmitting } = usePost(
    "/api/user/auth/verify-reset-code"
  );

  const { email, code, setCode } = useAuth();

  const isRtl =
    typeof document !== "undefined" && document.dir === "rtl";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await postData(
        { email, code },
        null,
        t("verify-reset-code")
      );

      router.push("/auth/reset-password");
    } catch (error) {
      console.error("Verify code failed", error);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">

      {/* Background effects */}
      <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-yellow-400/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg p-8 sm:p-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[3rem] z-10"
      >

        {/* Top line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-yellow-400 rounded-b-full shadow-[0_2px_10px_rgba(250,204,21,0.4)]"></div>

        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ rotate: -10, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-6 text-yellow-600 bg-yellow-400/20 rounded-3xl dark:text-yellow-400 dark:bg-yellow-400/10"
          >
            <ShieldCheck size={36} strokeWidth={2.5} />
          </motion.div>

          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl dark:text-white">
            {t("verifyCode") }
          </h2>

          <p className="mt-3 text-base font-medium text-gray-500 dark:text-zinc-400">
            {t("enterCodeSubtitle")}
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* Code Input */}
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700 ms-1 dark:text-zinc-300">
              {t("resetCode") }
            </label>

            <div className="relative group">
              <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-4">
                <ShieldCheck
                  size={20}
                  className="text-gray-400 group-focus-within:text-yellow-500"
                />
              </div>

              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="w-full py-4 text-center font-bold tracking-[0.5em] text-gray-900 border-2 border-transparent outline-none bg-gray-100/50 rounded-2xl dark:bg-zinc-800/40 dark:text-white placeholder:text-gray-300 focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10"
              />
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="relative flex items-center justify-center w-full py-4.5 font-black text-gray-900 bg-yellow-400 rounded-2xl hover:bg-yellow-500 shadow-xl shadow-yellow-400/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              {isSubmitting ? t("loading") : t("verify")}
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

      </motion.div>
    </div>
  );
}