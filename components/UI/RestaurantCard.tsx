"use client";

import { useState } from "react";
import { Clock, MapPin, Star, Heart, X, ExternalLink } from "lucide-react";
import ShareButton from "../ShareButton";

export default function RestaurantCard({ restaurant }: { restaurant: any }) {
  const [showMap, setShowMap] = useState(false);

  // حاول يجيب coordinates من الـ API
  const lat = restaurant?.latitude || restaurant?.lat;
  const lng = restaurant?.longitude || restaurant?.lng;

  // fallback لو مفيش coordinates
  const mapQuery = encodeURIComponent(
    restaurant?.address || restaurant?.name || "Restaurant Location",
  );

  return (
    <>
      <div className="relative z-10 w-[92%] md:w-full max-w-4xl mx-auto -mt-16 md:-mt-24 transition-colors duration-300">
        <div className="p-4 bg-white border border-emerald-500 shadow-lg dark:bg-zinc-900 rounded-2xl dark:shadow-black/20 md:p-6 dark:border-emerald-500/40">
          <div className="relative flex">
            {/* اللوجو */}
            <div className="absolute left-0 w-24 h-24 overflow-hidden bg-white border-4 border-white rounded-full shadow-sm -top-12 md:-top-16 md:w-36 md:h-36 dark:border-zinc-800 dark:bg-zinc-900">
              <img
                src={restaurant?.logo || "/placeholder.jpg"}
                alt={restaurant?.name || "image"}
                className="object-cover w-full h-full"
              />
            </div>

            {/* النصوص */}
            <div className="ml-28 md:ml-40 flex-1 flex justify-between items-start min-h-[4rem]">
              <div>
                <h1 className="text-xl font-bold text-gray-900 md:text-3xl dark:text-zinc-100">
                  {restaurant?.name || "اسم المطعم"}
                </h1>

                {/* <p className="text-gray-400 dark:text-zinc-500 text-sm md:text-base mt-1 truncate max-w-[150px] md:max-w-md">
                  {restaurant?.address || "عنوان المطعم"}
                </p> */}

                {/*  <p className="mt-1 text-sm text-gray-400 md:text-base dark:text-zinc-500">
                  Start From{" "}
                  <span className="font-bold text-yellow-400">15 E£</span>
                </p> */}
              </div>

              {/* الأزرار */}
              <div className="flex flex-col items-center gap-3">
                <button className="text-orange-100 transition hover:text-orange-200 dark:opacity-90">
                  <Heart className="text-orange-100 h-7 w-7 md:h-8 md:w-8 fill-orange-100" />
                </button>

                <ShareButton />
              </div>
            </div>
          </div>

          {/* الجزء السفلي */}
          <div className="flex items-center justify-around pt-6 mt-8 border-t md:mt-10 dark:border-zinc-800">
            <div className="flex flex-col items-center">
              <Clock className="w-6 h-6 mb-1 text-yellow-400" />

              <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 md:text-base">
                {restaurant?.minDeliveryTime}-{restaurant?.maxDeliveryTime}{" "}
                {restaurant?.deliveryTimeUnit || "min"}
              </span>
            </div>

            {/* LOCATION */}
            <button
              onClick={() => setShowMap(true)}
              className="flex flex-col items-center transition hover:scale-105"
            >
              <MapPin className="w-6 h-6 mb-1 text-yellow-400" />

              <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 md:text-base">
                Location
              </span>
            </button>

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

      {/* MAP POPUP */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl overflow-hidden bg-white shadow-2xl dark:bg-zinc-900 rounded-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                  {restaurant?.name}
                </h2>

                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  {restaurant?.address}
                </p>
              </div>

              <button
                onClick={() => setShowMap(false)}
                className="p-2 transition rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MAP */}
            <div className="w-full h-[400px]">
              <iframe
                title="Restaurant Location"
                width="100%"
                height="100%"
                loading="lazy"
                allowFullScreen
                className="border-0"
                src={
                  lat && lng
                    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
                    : `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`
                }
              />
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between p-4 border-t dark:border-zinc-800">
              <span className="text-sm text-gray-500 dark:text-zinc-400 truncate max-w-[70%]">
                {restaurant?.address}
              </span>

              <a
                href={
                  lat && lng
                    ? `https://www.google.com/maps?q=${lat},${lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-yellow-400 rounded-xl hover:bg-yellow-500"
              >
                Open Maps
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
