"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  MapPin,
  Star,
  Heart,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  Loader2,
} from "lucide-react";
import ShareButton from "../ShareButton";
import usePost from "@/app/hooks/usePost";
import useGet from "@/app/hooks/useGet";
import { useRouter, useParams } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
// Import the utility to get the correct restaurant ID
import { getRestaurantId } from "@/context/Restaurantid";

/* ---------------- LINK ACTION (shared with the page's promo popup) ---------------- */
export interface LinkSource {
  // "link" | "subcategory" | "product" | "discount" (or null)
  linkType: string | null;
  link: string | null;
  linkData: { id: string } | null;
}

export type LinkAction =
  | { kind: "link"; href: string }
  | { kind: "focus"; type: "subcategory" | "product" | "discount"; id: string };

// What should happen when an image with a link is clicked?
// 1) `link` present → open it in the same tab
// 2) otherwise      → scroll to the subcategory / product / discount whose
//                     id is in `linkData.id`
// Returns null when there is no destination (then the image isn't clickable).
export function getLinkAction(source: LinkSource): LinkAction | null {
  const rawLink = source.link?.trim();
  if (rawLink) {
    const href = /^(https?:\/\/|\/)/i.test(rawLink)
      ? rawLink
      : `https://${rawLink}`;
    return { kind: "link", href };
  }

  const id = source.linkData?.id;
  const type = source.linkType;
  if (
    id &&
    (type === "subcategory" || type === "product" || type === "discount")
  ) {
    return { kind: "focus", type, id };
  }
  return null;
}

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
  // "link" | "subcategory" | "product" | "discount" (or null)
  linkType: string | null;
  link: string | null;
  linkData: { id: string } | null;
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

interface UserLocation {
  lat: number;
  lng: number;
}

type BranchWithDistance = Branch & { distanceKm: number | null };

/* ---------------- DISTANCE HELPERS ---------------- */
// The API sometimes returns coordinates with stray spaces/commas (e.g. " 31.344094")
const parseCoordinate = (coord: string | undefined | null): number | null => {
  if (!coord) return null;
  const n = parseFloat(coord.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
};

// Haversine formula: straight-line distance between two points, in km
const getDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// < 1 km → metres, otherwise km with one decimal
const formatDistance = (km: number, isRTL: boolean) => {
  if (km < 1) return `${Math.round(km * 1000)} ${isRTL ? "م" : "m"}`;
  return `${km.toFixed(1)} ${isRTL ? "كم" : "km"}`;
};

/* ---------------- SLIDER COMPONENT ---------------- */
function RestaurantSlider({
  restaurantId,
  onLinkAction,
}: {
  restaurantId: string;
  onLinkAction?: (action: LinkAction) => void;
}) {
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

  // Where does the current slide lead (if anywhere)?
  const action = getLinkAction(images[current]);

  return (
    <div className="relative w-[96%] sm:w-[97%] md:w-full max-w-4xl mx-auto mt-4 rounded-2xl overflow-hidden shadow-md">
      <div className="relative w-full aspect-[3/2] sm:aspect-[16/9] md:aspect-[21/9] bg-gray-100 dark:bg-zinc-800">
        {action && onLinkAction ? (
          <button
            type="button"
            onClick={() => onLinkAction(action)}
            className="absolute inset-0 w-full h-full cursor-pointer"
          >
            <img
              src={images[current].img}
              alt={`slide-${current}`}
              className="object-cover w-full h-full transition-all duration-500"
            />
          </button>
        ) : (
          <img
            src={images[current].img}
            alt={`slide-${current}`}
            className="absolute inset-0 object-cover w-full h-full transition-all duration-500"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

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
export default function RestaurantCard({
  restaurant,
  onLinkAction,
}: {
  restaurant: any;
  onLinkAction?: (action: LinkAction) => void;
}) {
  const [showBranchesModal, setShowBranchesModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  /* ---------------- NEAREST BRANCH ---------------- */
  // Adds `distanceKm` to every branch and, once we know where the user is,
  // sorts nearest → farthest. Branches without valid coordinates go last.
  const sortedBranches: BranchWithDistance[] = useMemo(() => {
    const withDistance = branches.map((branch) => {
      const lat = parseCoordinate(branch.lat);
      const lng = parseCoordinate(branch.lng);
      const distanceKm =
        userLocation && lat !== null && lng !== null
          ? getDistanceKm(userLocation.lat, userLocation.lng, lat, lng)
          : null;
      return { ...branch, distanceKm };
    });

    if (!userLocation) return withDistance;

    return withDistance.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [branches, userLocation]);

  const handleUseMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(
        isRTL
          ? "المتصفح لا يدعم تحديد الموقع"
          : "Geolocation is not supported by your browser",
      );
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setLocating(false);

        // Pick the nearest branch so the map jumps to it
        let nearest: Branch | null = null;
        let nearestDistance = Infinity;
        for (const branch of branches) {
          const lat = parseCoordinate(branch.lat);
          const lng = parseCoordinate(branch.lng);
          if (lat === null || lng === null) continue;
          const d = getDistanceKm(loc.lat, loc.lng, lat, lng);
          if (d < nearestDistance) {
            nearestDistance = d;
            nearest = branch;
          }
        }
        if (nearest) setSelectedBranch(nearest);
      },
      (error) => {
        setLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? isRTL
              ? "تم رفض إذن الموقع. فعّله من إعدادات المتصفح."
              : "Location permission denied. Enable it in your browser settings."
            : isRTL
              ? "تعذر تحديد موقعك. حاول مرة أخرى."
              : "Couldn't get your location. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  /* ---------------- MAP HANDLING ---------------- */
  const handleOpenMap = () => {
    setShowBranchesModal(true);
    // Auto-select the nearest branch if we know it, otherwise the first one
    if (sortedBranches.length > 0 && !selectedBranch) {
      setSelectedBranch(sortedBranches[0]);
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

  const handleOpenInMaps = (branch: Branch | null) => {
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
      const message = err instanceof Error ? err.message : "";

      // usePost rewrites the backend's "No token provided" message to
      // "Login please" before throwing, so check for that here.
      if (message === "Login please") {
        if (restaurantSlug) {
          router.push(`/auth/sign-in?callbackSlug=${restaurantSlug}`);
        } else {
          router.push("/auth/sign-in");
        }
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
                {t("Branches")}
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
        <RestaurantSlider
          restaurantId={currentRestaurantId}
          onLinkAction={onLinkAction}
        />
      )}

      {/* ---------------- BRANCHES & MAP MODAL ---------------- */}
      {showBranchesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="flex flex-col w-full max-w-5xl overflow-hidden bg-white md:flex-row h-[85vh] md:h-[70vh] dark:bg-zinc-900 rounded-2xl">
            {/* BRANCH LIST SIDEBAR */}
            <div
              dir={isRTL ? "rtl" : "ltr"}
              className="flex flex-col w-full max-h-[45vh] md:max-h-none md:h-full md:w-1/3 border-b md:border-b-0 md:border-x border-gray-100 dark:border-zinc-800"
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

              {/* USE CURRENT LOCATION */}
              <div className="px-3 pt-3">
                <button
                  onClick={handleUseMyLocation}
                  disabled={locating || branchesLoading || branches.length === 0}
                  className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold transition border rounded-xl border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {locating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LocateFixed size={16} />
                  )}
                  {locating
                    ? t("Locating...")
                    : userLocation
                      ? t("Update my location")
                      : t("Use my current location")}
                </button>
                {locationError && (
                  <p className="mt-2 text-xs text-red-500">{locationError}</p>
                )}
              </div>

              <div className="flex-1 min-h-0 p-3 overflow-y-auto">
                {branchesLoading ? (
                  <p className="text-center text-gray-500 dark:text-zinc-400 mt-4">
                    {t("Loading branches...")}
                  </p>
                ) : sortedBranches.length > 0 ? (
                  <div className="space-y-2">
                    {sortedBranches.map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => setSelectedBranch(branch)}
                        className={`w-full text-start p-3 rounded-xl border transition-all ${
                          selectedBranch?.id === branch.id
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {isRTL ? branch.nameAr || branch.name : branch.name}
                          </h3>
                          {branch.distanceKm !== null && (
                            <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40">
                              {formatDistance(branch.distanceKm, isRTL)}
                            </span>
                          )}
                        </div>
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
            <div className="relative w-full flex-1 md:w-2/3 min-h-[300px]">
              <button
                onClick={() => setShowBranchesModal(false)}
                className="absolute z-10 hidden p-2 bg-white rounded-full shadow-md top-4 right-4 dark:bg-zinc-800 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700 md:block"
              >
                <X size={20} />
              </button>

              {/* OPEN IN MAPS — always visible, doesn't wait for a branch/map click */}
              <button
                onClick={() => handleOpenInMaps(selectedBranch)}
                className="absolute z-10 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition rounded-full shadow-md top-4 left-4 bg-emerald-500 hover:bg-emerald-600"
              >
                <ExternalLink size={16} />
                {t("Open in Maps")}
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