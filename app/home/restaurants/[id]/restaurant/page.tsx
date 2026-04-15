"use client";

import RestaurantCard from "@/components/UI/RestaurantCard"; 
import RestaurantHeader from "@/components/UI/RestaurantHeader"; 
import RestaurantItms from "@/components/UI/RestaurantItms"; 
import Link from "next/link";
import { ShoppingBasket } from "lucide-react"; // أو ShoppingCart
import { useAppSelector } from "@/redux/hooks";

export default function Restaurant() {
  // جلب إجمالي عدد المنتجات في السلة لإظهار Badge
  const cartItems = useAppSelector((state) => state.cart.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="relative w-full min-h-screen pb-24 font-sans bg-white dark:bg-black">
      <RestaurantHeader/>
      <RestaurantCard/>
      <RestaurantItms/>

      {/* زر الانتقال إلى الطلبات (Order Navigation) */}
      <Link 
        href="/order" 
        className="fixed bottom-8 left-8 z-[90] flex items-center gap-3 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 px-6 py-4 rounded-2xl shadow-2xl shadow-yellow-400/40 transition-all hover:scale-105 active:scale-95 group"
      >
        <div className="relative">
          <ShoppingBasket size={24} className="group-hover:animate-bounce" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-zinc-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-yellow-400">
              {totalItems}
            </span>
          )}
        </div>
        <span className="text-lg font-bold">عرض السلة</span>
      </Link>
    </div>
  );
}