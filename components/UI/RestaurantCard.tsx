"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  Star,
  Heart,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ShareButton from "../ShareButton";
import usePost from "@/app/hooks/usePost";
import useGet from "@/app/hooks/useGet";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

interface RatingResponse {
  success: boolean;
  data: {
    data: {
      avgRating: string;
      totalRatings: number;
    };
  };
}

interface SliderImage {
  id: string;
  restaurantid: string;
  img: string;
  createdAt: string;
  updatedAt: string;
  periorty: number;
}

/* ---------------- SLIDER COMPONENT ---------------- */
function RestaurantSlider({ restaurantId }: { restaurantId: string }) {
  const [current, setCurrent] = useState(0);

  const { data: sliderResponse, loading } = useGet<{
    success: boolean;
    data: { data: SliderImage[] };
  }>(`/api/user/slider/${restaurantId}`);

  const images = [...(sliderResponse?.data?.data ?? [])].sort(
    (a, b) => a.periorty - b.periorty,
  );

  // AUTO-SCROLL LOGIC
  useEffect(() => {
    if (images.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 3000); // Changes slide every 3 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [images.length]);

  if (loading || images.length === 0) return null;

  const prev = () => setCurrent((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="relative w-[92%] md:w-full max-w-4xl mx-auto mt-4 rounded-2xl overflow-hidden shadow-md">
      {/* IMAGE */}
      <div className="relative w-full h-48 md:h-64 bg-gray-100 dark:bg-zinc-800">
        <img
          src={images[current].img}
          alt={`slide-${current}`}
          className="w-full h-full object-cover transition-all duration-500"
        />

        {/* OVERLAY GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* DOTS */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ARROWS */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition z-10"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition z-10"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- MAIN CARD ---------------- */
export default function RestaurantCard({ restaurant }: { restaurant: any }) {
  const [showMap, setShowMap] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const router = useRouter();

  const params = useParams();
  const restaurantSlug = params?.slug as string;

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

  const ratingItem = data?.data?.data;

  /* ---------------- SUBMIT ---------------- */
  const handleSubmitRating = async () => {
    if (rating === 0) return;

    try {
      await postData({
        restaurantId: restaurant?.id,
        rating,
        comment,
      });

      setShowRating(false);
      setRating(0);
      setComment("");
      refetch();
    } catch (err) {
      if (restaurantSlug) {
        router.push(`/auth/sign-in?callbackSlug=${restaurantSlug}`);
      } else {
        router.push("/auth/sign-in");
      }
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
          {/* --- TOP SECTION: LOGO & INFO --- */}
          <div className="relative flex items-center min-h-[4rem] md:min-h-[5rem]">
            {/* LOGO */}
            <div
              className={`absolute ${
                isRTL ? "right-0" : "left-0"
              } w-24 h-24 overflow-hidden bg-white border-4 border-white rounded-full -top-12 md:-top-16 md:w-36 md:h-36 dark:bg-zinc-900`}
            >
              <img
                src={restaurant?.logo || "/placeholder.jpg"}
                className="object-contain w-full h-full"
                alt={restaurant?.name}
              />
            </div>

            {/* INFO */}
            <div
              dir={isRTL ? "rtl" : "ltr"}
              className={`${
                isRTL ? "mr-28 md:mr-40" : "ml-28 md:ml-40"
              } flex-1 flex flex-col items-start`}
            >
              <h1 className="text-xl font-bold md:text-3xl dark:text-white">
                {isRTL ? restaurant?.nameAr : restaurant?.name}
              </h1>
            </div>
          </div>

          {/* --- BOTTOM SECTION: ACTIONS & STATS --- */}
          <div className="flex flex-wrap items-center justify-around gap-4 pt-4 mt-6 border-t border-gray-100 dark:border-zinc-800">
            {/* LOCATION BUTTON */}
            <button
              onClick={() => setShowMap(true)}
              className="flex flex-col items-center gap-1 transition hover:opacity-80"
            >
              <MapPin className="w-6 h-6 text-emerald-500" />
              <span className="text-sm font-medium dark:text-zinc-300">
                {t("Location")}
              </span>
            </button>

            {/* ⭐ AVG RATING */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-bold dark:text-white">
                  {ratingItem?.avgRating
                    ? parseFloat(ratingItem.avgRating).toFixed(1)
                    : "—"}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                {ratingItem?.totalRatings} {t("Ratings")}
              </span>
            </div>

            {/* ACTIONS (SHARE & RATE) */}
            <div
              dir={isRTL ? "rtl" : "ltr"}
              className="flex items-center gap-3"
            >
              <ShareButton />
              <button
                onClick={() => setShowRating(true)}
                className="flex items-center justify-center p-2 text-yellow-500 transition rounded-full hover:bg-yellow-50 dark:hover:bg-zinc-800"
                title={t("Rate")}
              >
                <Star size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SLIDER */}
      {restaurant?.id && <RestaurantSlider restaurantId={restaurant.id} />}

      {/* ---------------- MAP MODAL ---------------- */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden">
            <div className="flex justify-between p-4 border-b dark:border-zinc-800">
              <h2 className="font-bold dark:text-white">{restaurant?.name}</h2>
              <button
                onClick={() => setShowMap(false)}
                className="dark:text-white"
              >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm p-5 bg-white dark:bg-zinc-900 rounded-2xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-bold dark:text-white">
                {t("Enjoying your visit?")}
              </h2>
              <button
                onClick={() => {
                  setShowRating(false);
                  setComment("");
                }}
                className="dark:text-white"
              >
                <X />
              </button>
            </div>
            <p className="mb-6 text-sm text-gray-500 dark:text-zinc-400">
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
                className="w-full h-24 p-4 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:outline-none dark:text-white resize-none"
              />
            </div>

            <button
              onClick={handleSubmitRating}
              disabled={isSubmitting || rating === 0}
              className={`w-full py-2 text-white rounded-xl transition ${
                isSubmitting || rating === 0
                  ? "bg-gray-400"
                  : "bg-yellow-400 hover:bg-yellow-500"
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
