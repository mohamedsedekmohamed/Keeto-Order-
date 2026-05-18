"use client";

import RestaurantCard from "@/components/UI/RestaurantCard";
import RestaurantHeader from "@/components/UI/RestaurantHeader";
import RestaurantItms from "@/components/UI/RestaurantItms";
import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useRestaurant, useMenu } from "@/context/RestaurantContext";
import { useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { setCartItems } from "@/redux/cartSlice";
import api from "@/api/api";
import LogoNav from "@/components/LogoNav";
import NewKeetaLogo from "@/public/PicWhite.jpeg";
export default function Restaurant() {
  const params = useParams();
  const { t } = useLanguage();
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector((state) => state.cart.items);

  // Local state to track dynamic cart animation burst
  const [isAnimate, setIsAnimate] = useState(false);

  // ✅ جلب الكارت فقط لو فيه token
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchCart = async () => {
    try {
      const res = await api.get("/api/user/cart");
      if (res?.data?.data?.data) {
        dispatch(setCartItems(res.data.data.data));
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchCart();
  }, []);

  // ✅ حساب عدد العناصر
  const totalItems = Array.isArray(cartItems)
    ? cartItems.reduce((acc, item) => {
        return acc + (Number(item.quantity) || 0);
      }, 0)
    : 0;

  // Trigger pop & pulse feedback ripple whenever item counter updates upward
  useEffect(() => {
    if (totalItems > 0) {
      setIsAnimate(true);
      const timer = setTimeout(() => setIsAnimate(false), 600); // Animation duration match window
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  const { restaurant, isLoading: restaurantLoading } = useRestaurant();
  const { menu, isLoading: menuLoading } = useMenu();

  //const restaurantId = (params?.id as string) || restaurant?.id;
  const restaurantName = params.slug as string;
  const basePath = `/home/restaurants/${restaurantName}`;

  if (restaurantLoading || menuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-yellow-500 bg-white dark:bg-black">
        {t("loading")}
      </div>
    );
  }

  if (!restaurant) {
    return <div className="p-8 text-center">{t("no-restaurant")}</div>;
  }

  return (
    <div className="relative w-full min-h-screen pb-24 font-sans bg-white dark:bg-black">
      <LogoNav logo={NewKeetaLogo} />
      <RestaurantHeader cover={restaurant.cover} />
      <RestaurantCard restaurant={restaurant} />
      <RestaurantItms
        menu={menu ?? []}
        restaurantId={restaurant?.id ?? ""}
        onCartUpdated={fetchCart}
      />

      {/* زر السلة العائم المطور مع مؤثرات إضافة ذكية */}
      {token && (
        <Link
          href={`${basePath}/order`}
          className={`fixed bottom-8 left-8 z-[90] flex items-center gap-3 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group select-none
            ${
              isAnimate
                ? "scale-110 shadow-yellow-400/60 ring-4 ring-yellow-400/30 animate-none"
                : "shadow-yellow-400/20"
            }`}
        >
          {/* Expanding Flash Pulse Ripple */}
          {isAnimate && (
            <span className="absolute inset-0 rounded-2xl bg-yellow-400/40 animate-ping pointer-events-none" />
          )}

          <div className="relative">
            <ShoppingBasket
              size={24}
              className={`transition-transform duration-300 
                ${isAnimate ? "scale-125 rotate-12 text-zinc-950" : "group-hover:translate-y-[-2px]"}`}
            />

            {totalItems > 0 && (
              <span
                className={`absolute -top-2 -right-2 bg-zinc-900 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-yellow-400 transition-all duration-300 tabular-nums
                  ${isAnimate ? "scale-125 bg-red-500 border-white" : "scale-100"}`}
              >
                {totalItems}
              </span>
            )}
          </div>

          <span className="text-lg font-black tracking-tight">
            {t("view-cart")}
          </span>
        </Link>
      )}
    </div>
  );
}
