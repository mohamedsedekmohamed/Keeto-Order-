"use client";

import Image from "next/image";
import { Clock, MapPin, Star, Share2, Heart } from "lucide-react";
import fallbackLogo from "../../public/logo.jpeg";

export default function RestaurantCard({ restaurant }: { restaurant: any }) {
  return (
    <div className="relative z-10 w-[92%] md:w-full max-w-4xl mx-auto -mt-16 md:-mt-24 transition-colors duration-300">
      <div className="p-4 bg-white border border-transparent shadow-lg dark:bg-zinc-900 rounded-2xl dark:shadow-black/20 md:p-6 dark:border-zinc-800">
        
        <div className="relative flex">
          {/* اللوجو */}
          <div className="absolute left-0 w-24 h-24 overflow-hidden bg-white border-4 border-white rounded-full shadow-sm -top-12 md:-top-16 md:w-36 md:h-36 dark:border-zinc-800 dark:bg-zinc-900">
            <Image 
              src={restaurant?.logo || fallbackLogo} 
              alt={`${restaurant?.name} Logo`} 
              fill 
              className="object-cover" 
              unoptimized
            />
          </div>

          {/* النصوص */}
          <div className="ml-28 md:ml-40 flex-1 flex justify-between items-start min-h-[4rem]">
            <div>
              <h1 className="text-xl font-bold text-gray-900 md:text-3xl dark:text-zinc-100">
                {restaurant?.name || "اسم المطعم"}
              </h1>
              <p className="text-gray-400 dark:text-zinc-500 text-sm md:text-base mt-1 truncate max-w-[150px] md:max-w-md">
                {restaurant?.address || "عنوان المطعم"}
              </p>
              {/* لو مفيش startFrom في الـ API ممكن نخفيها أو نثبتها مؤقتاً */}
              <p className="mt-1 text-sm text-gray-400 md:text-base dark:text-zinc-500">
                Start From <span className="font-bold text-yellow-400">15 E£</span>
              </p>
            </div>

            {/* الأزرار */}
            <div className="flex flex-col items-center gap-3">
              <button className="text-orange-100 transition hover:text-orange-200 dark:opacity-90">
                <Heart className="text-orange-100 h-7 w-7 md:h-8 md:w-8 fill-orange-100" />
              </button>
              <button className="text-gray-800 transition dark:text-zinc-400 hover:text-black dark:hover:text-white">
                <Share2 className="w-5 h-5 md:h-6 md:w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* الجزء السفلي */}
        <div className="flex items-center justify-around pt-6 mt-8 border-t md:mt-10 dark:border-zinc-800">
          
          <div className="flex flex-col items-center">
            <Clock className="w-6 h-6 mb-1 text-yellow-400" />
            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 md:text-base">
              {restaurant?.minDeliveryTime}-{restaurant?.maxDeliveryTime} {restaurant?.deliveryTimeUnit || "min"}
            </span>
          </div>
          
          <div className="flex flex-col items-center">
            <MapPin className="w-6 h-6 mb-1 text-yellow-400" />
            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 md:text-base">
              Location
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-gray-900 dark:text-zinc-100 md:text-base">
                4.5
              </span>
            </div>
            <span className="text-xs font-medium text-yellow-400 md:text-sm">
              +100 Ratings
            </span>
          </div>
          
        </div>

      </div>
    </div>
  );
}