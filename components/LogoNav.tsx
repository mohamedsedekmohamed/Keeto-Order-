"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";

import {
  Search,
  Bell,
  ShoppingCart,
  User,
} from "lucide-react";
import { StaticImageData } from "next/image";
import { useRestaurant } from "@/context/RestaurantContext";
import { useToken } from "@/context/TokenContext";
import { useParams } from "next/navigation";
import { FaLocationCrosshairs } from "react-icons/fa6";

 // استيراد useParams لجلب الـ id من الرابط

export default function LogoNav({
  logo,
}: {
  logo: string | StaticImageData;
}) {
  const { t } = useLanguage();
  const { restaurant } = useRestaurant();
  const { token } = useToken();
  const params = useParams();

  const restaurantId = (params?.id as string) || restaurant?.id;
  const restaurantName =params.slug as string;

  const basePath = `/home/restaurants/${restaurantName}/${restaurantId}`;

  return (
    <header className="w-full font-sans shadow-sm dark:shadow-md dark:shadow-yellow-400/5 dark:border-b dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-950">

        {/* Logo */}
        <div className="flex items-center gap-12">
          {/* العودة للرئيسية الخاصة بالمطعم */}
          <Link href={`${basePath}`}>
           
            <img
  src={restaurant?.logo || "/placeholder.jpg"}
  alt={restaurant?.name || "image"}
  className="object-cover w-10 h-10 rounded-full"
/>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">

         
          {/* Notification */}
          {token && (
          <Link
            href={`${basePath}/address`}
            className="relative text-gray-600 transition hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
          >
            <FaLocationCrosshairs className="w-5 h-5" />
          </Link>
          )}
          <Link
            href={`${basePath}/notification`}
            className="relative text-gray-600 transition hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute w-2 h-2 bg-red-500 border border-white rounded-full -top-1 -right-1 dark:border-gray-950" />
          </Link>

          {/* Order */}
          <Link
            href={`${basePath}/order`}
            className="text-gray-600 transition hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>

          {/* Profile / Login */}
          {token ? (
            <Link
              href={`${basePath}/profile`}
              className="text-gray-600 transition hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
            >
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href={`${basePath}/auth/sign-in`}
              className="text-gray-600 transition hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
            >
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}