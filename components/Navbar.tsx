"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "../context/LanguageContext";
import {
  Sun,
  Moon,
  Search,
  Bell,
  ShoppingCart,
  Lock,
  Menu,User
} from "lucide-react";
import NewKeetaLogo from "@/public/NewKeetaLogo.jpeg";
import Image from "next/image";

import { useToken } from "@/context/TokenContext";
export default function Navbar() {
const {  setTheme, resolvedTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useLanguage();
const { token } = useToken();


  
  return (
    <header className="w-full font-sans transition-all duration-500 shadow-sm dark:shadow-md dark:shadow-yellow-400/5 dark:border-b dark:border-gray-800">
      
  
      {/* الشريط الرئيسي - Main Navbar */}
      <div className="flex items-center justify-between px-6 py-4 transition-colors duration-500 bg-white dark:bg-gray-950">
        
        {/* اللوجو وروابط التنقل */}
        <div className="flex items-center gap-12">
          {/* اللوجو بتأثير توهج (Neon Glow) في الدارك مود */}
          <Link href="/">
          <Image
  src={NewKeetaLogo}
  alt="Keeto Logo"
  className="w-16 h-auto transition-all duration-500 dark:drop-shadow-[0_0_6px_rgba(253,224,71,0.8)]"
/> 
          </Link>

          {/* روابط الصفحات */}
          <nav className="hidden gap-8 text-base font-medium text-gray-600 md:flex dark:text-gray-300">
            <Link href="/home" className="transition-colors duration-300 hover:text-yellow-500 dark:hover:text-yellow-400">{t("home")}</Link>
            {/* <Link href="/cuisines" className="transition-colors duration-300 hover:text-yellow-500 dark:hover:text-yellow-400">{t("cuisines")}</Link>
            <Link href="/categories" className="transition-colors duration-300 hover:text-yellow-500 dark:hover:text-yellow-400">{t("categories")}</Link>
            <Link href="/restaurants" className="transition-colors duration-300 hover:text-yellow-500 dark:hover:text-yellow-400">{t("restaurants")}</Link> */}
          </nav>
        </div>

        {/* الأيقونات وزر تسجيل الدخول */}
        <div className="flex items-center gap-6">
          <button className="text-gray-600 transition-all duration-300 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:scale-110 active:scale-95">
            <Search className="w-5 h-5" />
          </button>
          <Link href="/notification" className="relative text-gray-600 transition-all duration-300 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:scale-110 active:scale-95">
            <Bell className="w-5 h-5 fill-current" />
            {/* نقطة الإشعارات كمثال */}
            <span className="absolute w-2 h-2 bg-red-500 border border-white rounded-full -top-1 -right-1 dark:border-gray-950"></span>
          </Link>
          <Link href="/order" className="text-gray-600 transition-all duration-300 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:scale-110 active:scale-95">
            <ShoppingCart className="w-5 h-5" />
          </Link>
          {token ? (
            <Link href="/profile" className="text-gray-600 transition-all duration-300 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:scale-110 active:scale-95">
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <Link href="/auth/sign-in" className="flex gap-1 text-gray-600 transition-all duration-300 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:scale-110 active:scale-95">
              <span className="">{t("signIn")}</span>
            </Link>
          )}

          {/* القائمة الجانبية للشاشات الصغيرة */}
        <button
  onClick={() => setIsMobileOpen(true)}
  className="ml-2 text-gray-600 transition-colors duration-300 md:hidden dark:text-gray-400 hover:text-yellow-500"
>
  <Menu className="w-6 h-6" />
</button>
        </div>
      </div>
      {/* Mobile Menu Overlay */}
{isMobileOpen && (
  <div className="fixed inset-0 z-50 md:hidden">
    
    {/* backdrop */}
    <div
      onClick={() => setIsMobileOpen(false)}
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
    />

    {/* drawer */}
    <div
      className={`absolute top-0 h-full w-72 bg-white dark:bg-gray-950 shadow-xl transition-transform duration-300 ${
        document.dir === "rtl"
          ? "right-0 animate-slide-in-right"
          : "left-0 animate-slide-in-left"
      }`}
    >
      
      {/* header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <span className="font-bold text-yellow-500">Menu</span>
        <button onClick={() => setIsMobileOpen(false)}>
          ✕
        </button>
      </div>

      {/* links */}
      <div className="flex flex-col p-4 space-y-4 text-gray-700 dark:text-gray-300">
        <Link onClick={() => setIsMobileOpen(false)} href="/home">Home</Link>
      
      </div>

      {/* bottom actions */}
      <div className="absolute bottom-0 w-full p-4 space-y-3 border-t dark:border-gray-800">

        {/* sign in */}
        <Link
          href="/auth/sign-in"
          onClick={() => setIsMobileOpen(false)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
        >
          <Lock className="w-4 h-4" />
          Sign In
        </Link>

        {/* dark mode */}
        <button
          onClick={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
          className="flex items-center gap-2 text-yellow-500"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          Theme
        </button>

        {/* language */}
   
      </div>
    </div>
  </div>
)}
    </header>
  );
}