// app/page.tsx
"use client";

import { motion } from "framer-motion";
import { Home } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { useTenant } from "@/context/TenantContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaApple, FaGooglePlay } from "react-icons/fa";

export default function Landing() {
  const { t } = useLanguage();
  const { tenant } = useTenant();
  const router = useRouter();

  // If a custom domain accesses root, do not show the main project page — go direct to the restaurant page
  useEffect(() => {
    if (tenant.mode === "custom" && tenant.slug) {
      router.replace(`/home/restaurants/${tenant.slug}/restaurant`);
    }
  }, [tenant, router]);

  if (tenant.mode === "custom") {
    return null;
  }

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
        className="grid grid-cols-2 gap-4 mt-4 w-full max-w-md"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="#"
            className="flex items-center justify-center gap-3 px-4 py-3 text-white transition bg-black rounded-2xl hover:bg-zinc-800"
          >
            <FaApple className="text-2xl" />
            <div className="text-left">
              <p className="text-[10px] uppercase text-zinc-400">
                Download on the
              </p>
              <p className="text-xs font-semibold">App Store</p>
            </div>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="#"
            className="flex items-center justify-center gap-3 px-4 py-3 text-white transition bg-black rounded-2xl hover:bg-zinc-800"
          >
            <FaGooglePlay className="text-xl" />
            <div className="text-left">
              <p className="text-[10px] uppercase text-zinc-400">Get it on</p>
              <p className="text-xs font-semibold">Google Play</p>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <p className="mt-auto text-xs text-gray-400 dark:text-zinc-600">
        © {new Date().getFullYear()} Keeto. {t("allRightsReserved")}
      </p>
    </div>
  );
}
