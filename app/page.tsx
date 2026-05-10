// app/page.tsx
"use client";

import { motion } from "framer-motion";
import { UtensilsCrossed, Home } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { FaApple, FaGooglePlay } from "react-icons/fa";

export default function Landing() {
  const { t } = useLanguage();

  return (
    <div className="relative flex flex-col items-center min-h-screen px-6 py-10 overflow-hidden bg-white dark:bg-zinc-950">
      {/* Background */}
      <div className="absolute w-72 h-72 bg-yellow-400/10 blur-3xl rounded-full top-[-80px] left-[-80px]" />
      <div className="absolute w-96 h-96 bg-yellow-400/10 blur-3xl rounded-full bottom-[-120px] right-[-120px]" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mt-10 text-center"
      >
        <h1 className="text-6xl font-black tracking-tight">
          <span className="text-gray-900 dark:text-white">K</span>
          <span className="text-yellow-500">eeto</span>
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Main CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md mt-12"
      >
        <Link
          href="/home"
          className="flex items-center justify-center gap-3 py-4 text-lg font-bold text-gray-900 bg-yellow-400 rounded-2xl hover:bg-yellow-500"
        >
          <Home />
          {t("goHome")}
        </Link>
      </motion.div>

      {/* Features */}

      {/* App Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-4 mt-4 w-full max-w-md" // نفس العرض ونظام الشبكة
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 py-4 text-white bg-black rounded-2xl cursor-pointer shadow-lg"
        >
          <FaApple className="w-6 h-6" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] opacity-70">Download on</span>
            <span className="text-sm font-bold">{t("appStore")}</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 cursor-pointer shadow-sm"
        >
          <FaGooglePlay className="w-5 h-5 text-green-500" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-gray-500">Get it on</span>
            <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">
              {t("googlePlay")}
            </span>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid w-full max-w-md grid-cols-1 gap-4 mt-10">
        <div className="p-5 bg-white border border-gray-100 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800">
          <UtensilsCrossed className="text-yellow-500" />
          <h3 className="mt-3 font-bold text-gray-900 dark:text-white">
            {t("feature1")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t("feature1Desc")}
          </p>
        </div>
      </div>
      {/* Footer */}
      <p className="mt-10 text-sm text-gray-400">{t("poweredBy")} Keeto</p>
    </div>
  );
}
