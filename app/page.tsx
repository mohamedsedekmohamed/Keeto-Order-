// app/page.tsx
"use client";

import { motion } from "framer-motion";
import { UtensilsCrossed, ShoppingCart, Home } from "lucide-react";
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

      {/* App Buttons */}
      <div className="flex items-center gap-4 mt-10">
        <div className="flex items-center gap-2 px-4 py-2 text-white bg-black rounded-xl">
          <FaApple />
          <span className="text-xs">{t("appStore")}</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <FaGooglePlay className="text-green-500" />
          <span className="text-xs text-gray-700 dark:text-zinc-300">
            {t("googlePlay")}
          </span>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 text-sm text-gray-400">
        {t("poweredBy")} Keeto
      </p>
    </div>
  );
}


