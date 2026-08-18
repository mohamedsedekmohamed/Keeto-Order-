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
// Import the utility to get the correct restaurant ID
import { getRestaurantId } from "@/context/Restaurantid";

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

interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  phoneNumber: string;
  lat: string;
  lng: string;
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

  useEffect(() => {
    if (images.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 3000);

    return () => clearInterval(intervalId);
  }, [images.length]);

  if (loading || images.length === 0) return null;

  const prev = () => setCurrent((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="relative w-[92%] md:w-full max-w-4xl mx-auto mt-4 rounded-2xl overflow-hidden shadow-md">
      <div className="relative w-full h-48 bg-gray-100 md:h-64 dark:bg-zinc-800">
        <img
          src={images[current].img}
          alt={`slide-${current}`}
          className="object-cover w-full h-full transition-all duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {images.length > 1 && (
          <div className="absolute flex gap-1.5 z-10 bottom-3 left-1/2 -translate-x-1/2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current
                    ? "bg-white w-4"
                    : "bg-white/50 hover:bg-white/80 w-2"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute z-10 flex items-center justify-center w-8 h-8 text-white transition -translate-y-1/2 rounded-full left-2 top-1/2 bg-black/40 hover:bg-black/60"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute z-10 flex items-center justify-center w-8 h-8 text-white transition -translate-y-1/2 rounded-full right-2 top-1/2 bg-black/40 hover:bg-black/60"
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
  const [showBranchesModal, setShowBranchesModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const router = useRouter();
  const params = useParams();
  const restaurantSlug = params?.slug as string;
  const { t } = useLanguage();

  const isRTL =
    typeof window !== "undefined" && document.documentElement.dir === "rtl";

  /* ---------------- FETCH BRANCHES ---------------- */
  // Retrieve the correct ID based on the slug[cite: 2]
  const currentRestaurantId = getRestaurantId(restaurantSlug) || restaurant?.id;

  const { data: branchesResponse, loading: branchesLoading } = useGet<{
    success: boolean;
    data: { data: Branch[] };
  }>(
    currentRestaurantId
      ? `/api/user/restaurants/${currentRestaurantId}/branches`
      : "",
  );

  const branches = branchesResponse?.data?.data || [];

  /* ---------------- MAP HANDLING ---------------- */
  const handleOpenMap = () => {
    setShowBranchesModal(true);
    // Auto-select the first branch if available
    if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0]);
    }
  };

  const cleanCoordinate = (coord: string) => coord?.replace(/,/g, "").trim();

  // Builds a real (non-embed) Google Maps URL so it can be opened directly in a new tab
  const getBranchMapsUrl = (branch: Branch | null) => {
    if (branch?.lat && branch?.lng) {
      const lat = cleanCoordinate(branch.lat);
      const lng = cleanCoordinate(branch.lng);
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    const fallbackLat = restaurant?.latitude || restaurant?.lat;
    const fallbackLng = restaurant?.longitude || restaurant?.lng;
    if (fallbackLat && fallbackLng) {
      return `https://www.google.com/maps/search/?api=1&query=${fallbackLat},${fallbackLng}`;
    }

    const mapQuery = encodeURIComponent(
      branch?.address ||
        branch?.addressAr ||
        restaurant?.address ||
        restaurant?.name ||
        "Restaurant Location",
    );
    return `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  };

  const handleBranchClick = (branch: Branch) => {
    setSelectedBranch(branch);
    const url = getBranchMapsUrl(branch);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const getMapIframeSrc = () => {
    if (selectedBranch?.lat && selectedBranch?.lng) {
      // Clean trailing commas from API lat/lng[cite: 1]
      const lat = cleanCoordinate(selectedBranch.lat);
      const lng = cleanCoordinate(selectedBranch.lng);
      return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    }

    // Fallback to main restaurant coordinates or address
    const fallbackLat = restaurant?.latitude || restaurant?.lat;
    const fallbackLng = restaurant?.longitude || restaurant?.lng;
    if (fallbackLat && fallbackLng) {
      return `https://maps.google.com/maps?q=${fallbackLat},${fallbackLng}&z=15&output=embed`;
    }

    const mapQuery = encodeURIComponent(
      selectedBranch?.address ||
        selectedBranch?.addressAr ||
        restaurant?.address ||
        restaurant?.name ||
        "Restaurant Location",
    );
    return `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;
  };

  /* ---------------- RATINGS API ---------------- */
  const { postData, loading: isSubmitting } = usePost("/api/user/rating");

  const { data, refetch } = useGet<RatingResponse>(
    `api/user/rating/restaurant/${currentRestaurantId}`,
  );

  const ratingItem = data?.data?.data;

  const handleSubmitRating = async () => {
    if (rating === 0) return;

    try {
      await postData({
        restaurantId: currentRestaurantId,
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
        <div className="p-4 bg-white border shadow-lg border-emerald-500 dark:bg-zinc-900 rounded-2xl md:p-6">
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
              onClick={handleOpenMap}
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
      {currentRestaurantId && (
        <RestaurantSlider restaurantId={currentRestaurantId} />
      )}

      {/* ---------------- BRANCHES & MAP MODAL ---------------- */}
      {showBranchesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="flex flex-col w-full max-w-5xl overflow-hidden bg-white md:flex-row h-[85vh] md:h-[70vh] dark:bg-zinc-900 rounded-2xl">
            {/* BRANCH LIST SIDEBAR */}
            <div
              dir={isRTL ? "rtl" : "ltr"}
              className="flex flex-col w-full border-b md:w-1/3 md:border-b-0 md:border-x border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                <h2 className="text-lg font-bold dark:text-white">
                  {t("Branches")}
                </h2>
                <button
                  onClick={() => setShowBranchesModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-white md:hidden"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto">
                {branchesLoading ? (
                  <p className="text-center text-gray-500 dark:text-zinc-400 mt-4">
                    {t("Loading branches...")}
                  </p>
                ) : branches.length > 0 ? (
                  <div className="space-y-2">
                    {branches.map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => handleBranchClick(branch)}
                        className={`w-full text-start p-3 rounded-xl border transition-all ${
                          selectedBranch?.id === branch.id
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {isRTL ? branch.nameAr || branch.name : branch.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 dark:text-zinc-400 mt-1">
                          {isRTL
                            ? branch.addressAr || branch.address
                            : branch.address}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-zinc-400 mt-4">
                    {t("No branches found.")}
                  </p>
                )}
              </div>
            </div>

            {/* MAP VIEW */}
            <div className="relative w-full h-full md:w-2/3 min-h-[300px]">
              <button
                onClick={() => setShowBranchesModal(false)}
                className="absolute z-10 hidden p-2 bg-white rounded-full shadow-md top-4 right-4 dark:bg-zinc-800 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700 md:block"
              >
                <X size={20} />
              </button>

              <iframe
                className="w-full h-full border-0"
                src={getMapIframeSrc()}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
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
