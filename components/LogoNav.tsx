"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useLanguage } from "../context/LanguageContext";
import {
  Sun,
  Moon,
  Search,
  Bell,
  ShoppingCart,
  User,
} from "lucide-react";
import Image from "next/image";
import { useToken } from "@/context/TokenContext";

export default function LogoNav({ logo }) {
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const { token } = useToken();

  return (
    <header className="w-full font-sans shadow-sm dark:shadow-md dark:shadow-yellow-400/5 dark:border-b dark:border-gray-800">
      
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-950">
        
        {/* logo + links */}
        <div className="flex items-center gap-12">
          <Link href="/">
            <Image
              src={logo}
              alt="Logo"
              className="w-16 h-auto dark:drop-shadow-[0_0_6px_rgba(253,224,71,0.8)]"
            />
          </Link>

          {/* links (always visible) */}
          <nav className="flex gap-8 text-base font-medium text-gray-600 dark:text-gray-300">
            <Link href="/home" className="hover:text-yellow-500">
              {t("home")}
            </Link>
          </nav>
        </div>

       
      </div>
    </header>
  );
}