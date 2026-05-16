"use client";

import { useState } from "react";
import { Clock, MapPin, Star, Heart, X, ExternalLink } from "lucide-react";
import ShareButton from "../ShareButton";
import usePost from "@/app/hooks/usePost";
import useGet from "@/app/hooks/useGet";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

interface RatingResponse {
  success: boolean;
  data: {
    data: {
      // ✅ matches real response
      avgRating: string;
      totalRatings: number;
    };
  };
}

export default function RestaurantCard({ restaurant }: { restaurant: any }) {
  const [showMap, setShowMap] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const router = useRouter();
  const [comment, setComment] = useState("");
  const lat = restaurant?.latitude || restaurant?.lat;
  const lng = restaurant?.longitude || restaurant?.lng;
  const { t } = useLanguage();
  const isRTL =
    typeof window !== "undefined" && document.documentElement.dir === "rtl";
  const mapQuery = encodeURIComponent(
    restaurant?.address || restaurant?.name || "Restaurant Location",
  );

  /* ---------------- API ---------------- */

  const { postData, loading: isSubmitting } = usePost("/api/user/rating");

  const { data, refetch } = useGet<RatingResponse>(
    `api/user/rating/restaurant/${restaurant?.id}`,
  );

  const ratingItem = data?.data?.data; // ✅ gives you { avgRating, totalRatings }
  /* ---------------- SUBMIT ---------------- */

  const handleSubmitRating = async () => {
    if (rating === 0) return;

    try {
      await postData({
        restaurantId: restaurant?.id,
        rating,
      });

      setShowRating(false);
      setRating(0);
      refetch();
    } catch (err) {
      router.push("/auth/sign-in");
      console.error(err);
    }
  };

  return (
    <>
      {/* CARD */}
      <div
        dir="ltr"
        className="relative z-10 w-[92%] md:w-full max-w-4xl mx-auto -mt-16 md:-mt-24"
      >
        <div className="p-4 bg-white border border-emerald-500 shadow-lg dark:bg-zinc-900 rounded-2xl md:p-6">
          <div className="relative flex">
            {/* LOGO */}
            <div
              className={`absolute ${
                isRTL ? "right-0" : "left-0"
              } w-24 h-24 overflow-hidden bg-white border-4 border-white rounded-full -top-12 md:-top-16 md:w-36 md:h-36 dark:bg-zinc-900`}
            >
              <img
                src={restaurant?.logo || "/placeholder.jpg"}
                className="object-cover w-full h-full"
              />
            </div>

            {/* INFO */}
            <div
              dir={isRTL ? "rtl" : "ltr"}
              className={`${
                isRTL ? "mr-28 md:mr-40" : "ml-28 md:ml-40"
              } flex-1 flex justify-between items-start`}
            >
              <h1 className="text-xl font-bold md:text-3xl">
                {isRTL ? restaurant?.nameAr : restaurant?.name}
              </h1>

              {/* ACTIONS */}
              <div dir="rtl" className="flex flex-col items-center gap-3">
                <button>
                  <Heart className="w-7 h-7 fill-orange-100" />
                </button>

                <ShareButton />

                {/* ⭐ Open Rating */}
                <button
                  onClick={() => setShowRating(true)}
                  className="text-yellow-500"
                >
                  <Star />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="flex items-center justify-around pt-6 mt-8 border-t">
            <div className="flex flex-col items-center">
              <Clock className="w-6 h-6 text-yellow-400" />
              <span>
                {restaurant?.minDeliveryTime}-{restaurant?.maxDeliveryTime}{" "}
                {t("Minutes")}
              </span>
            </div>

            <button onClick={() => setShowMap(true)}>
              <MapPin className="w-6 h-6 ml-4 text-yellow-400" />
              <span>{t("Location")}</span>
            </button>

            {/* ⭐ AVG RATING */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />

                <span className="font-bold">
                  {ratingItem?.avgRating
                    ? parseFloat(ratingItem.avgRating).toFixed(1)
                    : "—"}
                </span>
              </div>

              <span className="text-yellow-400 text-sm">
                {ratingItem?.totalRatings} {t("Ratings")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- MAP MODAL ---------------- */}

      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl">
            <div className="flex justify-between p-4 border-b">
              <h2>{restaurant?.name}</h2>

              <button onClick={() => setShowMap(false)}>
                <X />
              </button>
            </div>

            <iframe
              className="w-full h-[400px]"
              src={
                lat && lng
                  ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
                  : `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`
              }
            />
          </div>
        </div>
      )}

      {/* ---------------- RATING MODAL ---------------- */}

      {showRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg dark:text-white">
                {t("Enjoying your visit?")}
              </h2>
              <button onClick={() => setShowRating(false)}>
                <X />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
              {t("Kindlly Rate Restaurant")}
            </p>

            {/* STARS */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((num) => (
                <button key={num} onClick={() => setRating(num)}>
                  <Star
                    className={`w-8 h-8 ${
                      num <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="mb-6">
              <textarea
                placeholder={t("Leave a comment")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-4 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white resize-none h-24"
              />
            </div>

            <button
              onClick={handleSubmitRating}
              disabled={isSubmitting || rating === 0}
              className={`w-full py-2 text-white rounded-xl ${
                isSubmitting || rating === 0 ? "bg-gray-400" : "bg-yellow-400"
              }`}
            >
              {isSubmitting ? t("Submitting...") : t("Submit Rating")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
