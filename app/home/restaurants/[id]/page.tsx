"use client";

import { motion } from "framer-motion";
import {
  FileText,
  UtensilsCrossed,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation"; // استيراد useParams
import { useLanguage } from "../../../../context/LanguageContext"; // تأكد من المسار
import { FaApple } from "react-icons/fa";
import { FaGooglePlay } from "react-icons/fa";
import Image from "next/image"; // استيراد Image
import useGet from "../../../../Hooks/useGet"; // استيراد useGet (تأكد من صحة المسار)
import Loading from "@/components/Loading"; // مكون التحميل (تأكد من مساره)

// --- تعريف هيكل البيانات القادمة من الـ API ---
interface Restaurant {
  id: string;
  name: string;
  logo: string;
  cover: string;
  address: string;
}

interface RestaurantResponse {
  success: boolean;
  data: {
    data: {
      restaurant: Restaurant;
    };
  };
}

export default function Home() {
  const { t } = useLanguage();
  const pathname = usePathname(); 
  
  // 1. جلب ID المطعم من الرابط
  const params = useParams<{ id: string }>(); 
  const restaurantId = params.id;

  // 2. جلب بيانات المطعم من الـ API
  const { data, loading, error } = useGet<RestaurantResponse>(`/api/user/home/restaurants/${restaurantId}`);

  const cards = [
    {
      title: t("eMenu"),
      desc: t("eMenuDesc"),
      icon: FileText,
      nameToAdd: "/e-menu", 
    },
    {
      title: t("menu"),
      desc: t("menuDesc"),
      icon: UtensilsCrossed,
      nameToAdd: "/restaurant",
    },
  ];

  // 3. التعامل مع حالة التحميل والخطأ
  if (loading) return <Loading />;
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        حدث خطأ أثناء تحميل بيانات المطعم: {error}
      </div>
    );
  }

  // استخراج بيانات المطعم من الاستجابة
  const restaurant = data?.data?.data?.restaurant;

  return (
    <div className="relative flex flex-col items-center min-h-screen px-6 py-10 overflow-hidden transition-colors duration-300 bg-white dark:bg-zinc-950">

      {/* Background */}
      <div className="absolute w-72 h-72 bg-yellow-400/10 blur-3xl rounded-full top-[-80px] left-[-80px]" />
      <div className="absolute w-96 h-96 bg-yellow-400/10 blur-3xl rounded-full bottom-[-120px] right-[-120px]" />

      {/* Restaurant Info (Logo & Name) بدلاً من Keeto */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center mt-10 text-center"
      >
        {/* اللوجو الخاص بالمطعم */}
        {restaurant?.logo && (
          <div className="relative mb-4 overflow-hidden border-4 border-white shadow-xl w-28 h-28 rounded-3xl dark:border-zinc-800 bg-gray-50">
            <Image
              fill
              sizes="112px"
              src={restaurant.logo}
              alt={restaurant.name}
              className="object-cover"
            />
          </div>
        )}

        {/* اسم المطعم */}
        <h1 className="px-4 text-4xl font-black tracking-tight text-gray-900 md:text-5xl dark:text-white line-clamp-1">
          {restaurant?.name || "اسم المطعم"}
        </h1>
        
        {/* العنوان أو نص ترحيبي */}
        <p className="mt-3 text-xs tracking-[0.2em] text-gray-500 dark:text-zinc-400 font-medium">
          {restaurant?.address}
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid w-full max-w-md grid-cols-2 gap-5 mt-12">
        {cards.map((item, i) => {
          const Icon = item.icon;
          const finalHref = pathname === "/" ? item.nameToAdd : `${pathname}${item.nameToAdd}`;

          return (
            <Link key={i} href={finalHref}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.97 }}
                className="p-6 transition-all duration-300 bg-white border shadow-sm cursor-pointer border-gray-100/60 rounded-3xl hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800"
              >
                <div className="p-3 rounded-2xl bg-yellow-50 dark:bg-yellow-400/10 w-fit">
                  <Icon className="text-yellow-500" />
                </div>

                <h3 className="mt-4 font-bold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {item.desc}
                </p>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Order Button */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-md"
      >
        <Link
          href={pathname === "/" ? "/order" : `${pathname}/order`}
          className="flex items-center justify-center gap-3 py-4 mt-10 text-lg font-bold text-gray-900 transition-all duration-300 bg-yellow-400 shadow-sm rounded-2xl hover:bg-yellow-500 shadow-yellow-400/10 active:scale-95"
        >
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            <ShoppingCart />
          </motion.div>
          {t("orderNow")}
        </Link>
      </motion.div>

      {/* App Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-4 mt-8"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2 text-white bg-black rounded-xl"
        >
          <FaApple className="w-5 h-5" />
          <span className="text-xs font-semibold">{t("appStore")}</span>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl dark:bg-zinc-900 dark:border-zinc-800"
        >
          <FaGooglePlay className="w-5 h-5 text-green-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
            {t("googlePlay")}
          </span>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.p
        className="mt-10 text-sm text-gray-400 dark:text-zinc-500"
      >
        {t("poweredBy")}{" "}
        <span className="font-bold text-yellow-500">Wego Station</span>
      </motion.p>
    </div>
  );
}