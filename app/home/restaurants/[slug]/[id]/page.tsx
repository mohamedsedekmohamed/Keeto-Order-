"use client";

import { motion } from "framer-motion";
import { FileText, UtensilsCrossed, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useLanguage } from "../../../../../context/LanguageContext";
import { FaApple } from "react-icons/fa";
import { FaGooglePlay } from "react-icons/fa";

import Loading from "@/components/Loading";
import { useRestaurant } from "@/context/RestaurantContext";

export default function Home() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const params = useParams();

  const restaurantId = params?.id as string;
  const restaurantName = params?.slug as string;

  const basePath = `/home/restaurants/${restaurantName}`;

  const { restaurant, isLoading, isError } = useRestaurant();

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

  if (isLoading) return <Loading />;
  if (isError) return <div>error</div>;

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-hidden bg-white dark:bg-zinc-950">
      {/* COVER */}
      {restaurant?.cover && (
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
          <img
            src={restaurant.cover}
            alt="cover"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Restaurant Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center px-6"
      >
        {/* LOGO */}
        {restaurant?.logo && (
          <div className="relative -mt-12 mb-4 overflow-hidden border-4 border-white shadow-xl w-24 h-24 rounded-3xl dark:border-zinc-800 bg-gray-50 z-10">
            <img
              src={restaurant.logo}
              alt={restaurant.name || "logo"}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        {/* NAME */}
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white line-clamp-1">
          {restaurant?.name}
        </h1>
      </motion.div>

      {/* CARDS */}
      <div className="grid w-full max-w-md grid-cols-2 gap-5 mt-10 px-6">
        {cards.map((item, i) => {
          const Icon = item.icon;
          const finalHref = `${basePath}/${item.nameToAdd}`;

          return (
            <Link key={i} href={finalHref}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm dark:bg-zinc-900 dark:border-zinc-800"
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

      {/* ORDER BUTTON */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md px-6"
      >
        <Link
          href={`/home/restaurants/${restaurantName}/restaurant`}
          className="flex items-center justify-center gap-2 py-3 mt-6 text-base font-bold text-gray-900 transition-all duration-200 bg-yellow-400 rounded-xl hover:bg-yellow-500 active:scale-95"
        >
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ShoppingCart size={18} />
          </motion.div>

          {t("orderNow")}
        </Link>
      </motion.div>

      {/* APP BUTTONS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-4 mt-4 w-full max-w-md px-6"
      >
        <div className="flex items-center justify-center gap-2 py-4 text-white bg-black rounded-2xl cursor-pointer shadow-lg">
          <FaApple className="w-6 h-6" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] opacity-70">Download on</span>
            <span className="text-sm font-bold">{t("appStore")}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 cursor-pointer shadow-sm">
          <FaGooglePlay className="w-5 h-5 text-green-500" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-gray-500">Get it on</span>
            <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">
              {t("googlePlay")}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
