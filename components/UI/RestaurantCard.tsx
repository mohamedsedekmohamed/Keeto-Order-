"use client";

import Image from "next/image";
import { Clock, MapPin, Star, Share2, Heart } from "lucide-react";
import logo from "../../public/logo.jpeg";

export default function RestaurantCard() {
  const restaurantData = {
    name: "Maltut",
    location: "64 Port Said St, Camp Cesar, Alexandria",
    startFrom: "15 E£",
    deliveryTime: "30-55-min",
    rating: "0.0",
    numRatings: "0 + Ratings",
  };

  return (
    <div className="relative z-10 w-[92%] md:w-full max-w-4xl mx-auto -mt-16 md:-mt-24 transition-colors duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg dark:shadow-black/20 p-4 md:p-6 border border-transparent dark:border-zinc-800">
        
        {/* الجزء العلوي من الكارت */}
        <div className="flex relative">
          
          {/* اللوجو */}
          <div className="absolute -top-12 md:-top-16 left-0 w-24 h-24 md:w-36 md:h-36 rounded-full border-4 border-white dark:border-zinc-800 overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
            <Image 
              src={logo} 
              alt={`${restaurantData.name} Logo`} 
              fill 
              className="object-cover" 
            />
          </div>

          {/* النصوص */}
          <div className="ml-28 md:ml-40 flex-1 flex justify-between items-start min-h-[4rem]">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-zinc-100">
                {restaurantData.name}
              </h1>
              <p className="text-gray-400 dark:text-zinc-500 text-sm md:text-base mt-1 truncate max-w-[150px] md:max-w-md">
                {restaurantData.location}
              </p>
              <p className="text-sm md:text-base text-gray-400 dark:text-zinc-500 mt-1">
                Start From <span className="text-yellow-400 font-bold">{restaurantData.startFrom}</span>
              </p>
            </div>

            {/* الأزرار */}
            <div className="flex flex-col items-center gap-3">
              <button className="text-orange-100 hover:text-orange-200 transition dark:opacity-90">
                <Heart className="h-7 w-7 md:h-8 md:w-8 fill-orange-100 text-orange-100" />
              </button>
              <button className="text-gray-800 dark:text-zinc-400 hover:text-black dark:hover:text-white transition">
                <Share2 className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* الجزء السفلي */}
        <div className="flex justify-around items-center mt-8 md:mt-10 border-t dark:border-zinc-800 pt-6">
          
          {/* الوقت */}
          <div className="flex flex-col items-center">
            <Clock className="h-6 w-6 text-yellow-400 mb-1" />
            <span className="text-gray-800 dark:text-zinc-200 font-medium text-sm md:text-base">
              {restaurantData.deliveryTime}
            </span>
          </div>
          
          {/* الموقع */}
          <div className="flex flex-col items-center">
            <MapPin className="h-6 w-6 text-yellow-400 mb-1" />
            <span className="text-gray-800 dark:text-zinc-200 font-medium text-sm md:text-base">
              Location
            </span>
          </div>

          {/* التقييم */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              <span className="text-gray-900 dark:text-zinc-100 font-bold text-sm md:text-base">
                {restaurantData.rating}
              </span>
            </div>
            <span className="text-yellow-400 text-xs md:text-sm font-medium">
              {restaurantData.numRatings}
            </span>
          </div>
          
        </div>

      </div>
    </div>
  );
}