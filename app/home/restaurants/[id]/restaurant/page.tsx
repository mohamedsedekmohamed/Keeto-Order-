"use client";

import RestaurantCard from "@/components/UI/RestaurantCard"; 
import RestaurantHeader from "@/components/UI/RestaurantHeader"; 
import RestaurantItms from "@/components/UI/RestaurantItms"; 
import Link from "next/link";
import { ShoppingBasket } from "lucide-react"; 
import { useAppSelector } from "@/redux/hooks";
import { useRestaurant, useMenu } from "@/context/RestaurantContext";
import { useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function Restaurant() {
  const cartItems = useAppSelector((state) => state.cart.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const params = useParams();
      const { t } = useLanguage();
    

 

  const { restaurant, isLoading: restaurantLoading } = useRestaurant();
  const { menu, isLoading: menuLoading } = useMenu();
   const restaurantId = (params?.id as string) || restaurant?.id;
    const basePath = `/home/restaurants/${restaurantId}`;

  // عرض شاشة تحميل بسيطة أثناء جلب البيانات
  if (restaurantLoading || menuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-yellow-500 bg-white dark:bg-black">
       {t("loading")}
      </div>
    );
  }

  // في حالة عدم وجود مطعم
  if (!restaurant) {
    return <div className="p-8 text-center">{t("no-restaurant")}</div>;
  }

  return (
    <div className="relative w-full min-h-screen pb-24 font-sans bg-white dark:bg-black">
      {/* تمرير صورة الغلاف للـ Header */}
      <RestaurantHeader cover={restaurant.cover} />
      
      {/* تمرير بيانات المطعم للـ Card */}
      <RestaurantCard restaurant={restaurant} />
      
      {/* تمرير المنيو للـ Items */}
<RestaurantItms menu={menu || {}} restaurantId={restaurant?.id || ""} />
      {/* زر الانتقال إلى الطلبات */}
      <Link 
        href={`${basePath}/order`} 
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
        <span className="text-lg font-bold"> {t("view-cart")}</span>
      </Link>
    </div>
  );
}