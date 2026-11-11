"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  UtensilsCrossed,
  ShoppingCart,
  Star,
  X,
  Lock,
  Phone,
  LocateFixed,
  Loader2,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../../../../context/LanguageContext";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import Loading from "@/components/Loading";
import { useRestaurant } from "@/context/RestaurantContext";
import {
  useRestaurantSettings,
  type OrderNowSetting,
} from "@/context/RestaurantSettingsContext";
import usePost from "@/app/hooks/usePost";
import useGet from "@/app/hooks/useGet";

const API_BASE = "https://keetobcknd.keeto.org";

type Branch = {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  lat?: string | number | null;
  lng?: string | number | null;
  status?: string;
};

type BranchWithDistance = Branch & { distanceKm: number | null };
type UserLocation = { lat: number; lng: number };

type BranchesResponse = {
  success?: boolean;
  data?: { data?: Branch[] };
};

const parseCoordinate = (coordinate: string | number | null | undefined) => {
  if (coordinate === null || coordinate === undefined || coordinate === "") {
    return null;
  }

  const normalized =
    typeof coordinate === "number"
      ? coordinate
      : coordinate.replace(/,/g, "").trim();
  if (normalized === "") return null;

  const parsed =
    typeof normalized === "number" ? normalized : Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

type SocialLink = {
  id: string;
  restaurantid: string;
  link: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

function SocialLinks({ restaurantId }: { restaurantId: string }) {
  const { data: socialResponse, loading } = useGet<{
    success: boolean;
    data: { data: SocialLink[] };
  }>(`/api/user/socialmedia/${restaurantId}`);

  const socialLinks = socialResponse?.data?.data ?? [];

  if (loading || socialLinks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md px-6 mt-5"
    >
      <p className="text-xs text-center text-gray-400 dark:text-zinc-500 mb-3 font-medium uppercase tracking-widest">
        Follow Us
      </p>
      <div className="flex items-center justify-center flex-wrap gap-3">
        {socialLinks.map((link) => (
          <motion.a
            key={link.id}
            href={link.link}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            aria-label={link.link}
          >
            <img
              src={link.icon}
              alt="social icon"
              className="w-6 h-6 object-contain"
            />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { t, language } = useLanguage();
  const params = useParams();
  const isRTL = language === "العربية";
  const router = useRouter();

  const restaurantName = params?.slug as string;
  const basePath = `/home/restaurants/${restaurantName}`;
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(`token_${restaurantName}`)
      : null;

  const { restaurant, isLoading, isError } = useRestaurant();
  const { settings, instantOrder, firstColor, textFirstColor } =
    useRestaurantSettings();
  const isSectionEnabled = (section: keyof OrderNowSetting) =>
    settings?.orderNowSetting?.[section] !== false;

  const handleOrderNowClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!instantOrder) return;
    router.push(`${basePath}/restaurant`);
  };

  const [showBranches, setShowBranches] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesRestaurantId, setBranchesRestaurantId] = useState<
    string | null
  >(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const sortedBranches = useMemo<BranchWithDistance[]>(() => {
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

    return withDistance.sort((first, second) => {
      if (first.distanceKm === null) {
        return second.distanceKm === null ? 0 : 1;
      }
      if (second.distanceKm === null) return -1;
      return first.distanceKm - second.distanceKm;
    });
  }, [branches, userLocation]);

  useEffect(() => {
    if (!showBranches || !restaurant?.id) return;

    const restaurantId = restaurant.id;
    let cancelled = false;

    const fetchBranches = async () => {
      setBranches([]);
      setBranchesRestaurantId(restaurantId);
      setBranchesError(false);
      setBranchesLoading(true);

      try {
        const response = await fetch(
          `${API_BASE}/api/user/restaurants/${restaurantId}/branches`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as BranchesResponse;

        if (
          !response.ok ||
          !result.success ||
          !Array.isArray(result.data?.data)
        ) {
          throw new Error("Branch request failed");
        }

        if (!cancelled) {
          setBranches(
            result.data.data.filter(
              (branch) => !branch.status || branch.status === "active",
            ),
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching restaurant branches:", error);
          setBranchesError(true);
        }
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    };

    fetchBranches();
    return () => {
      cancelled = true;
    };
  }, [showBranches, restaurant?.id]);

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(t("locationUnsupported"));
      return;
    }

    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? t("locationPermissionDenied")
            : t("locationFailed"),
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleShowBranches = () => {
    setShowBranches(true);
    setUserLocation(null);
    handleUseCurrentLocation();
  };

  /* ---------------- RATING LOGIC ---------------- */
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  // Only fetch history when user is logged in AND restaurant is loaded
  const { data: historyRes } = useGet<any>(
    token && restaurant?.id
      ? `/api/user/order/history?restaurantId=${restaurant.id}`
      : null,
  );

  const historyOrders: any[] = historyRes?.data?.data || [];
  //const orderId = historyOrders.length > 0 ? historyOrders[0].orderId : null;

  // Find the most recent delivered order
  const deliveredOrder = historyOrders.find(
    (order) => order.status?.toLowerCase() === "delivered",
  );

  useEffect(() => {
    if (!token || !restaurant?.id || !deliveredOrder) return;

    const sessionKey = `rating_modal_seen_order_${deliveredOrder.orderId}`;
    const hasSeen = sessionStorage.getItem(sessionKey);
    if (hasSeen) return;

    const timer = setTimeout(() => {
      setShowRating(true);
      sessionStorage.setItem(sessionKey, "true");
    }, 1500);

    return () => clearTimeout(timer);
  }, [restaurant?.id, token, deliveredOrder?.orderId]);
  const { postData, loading: isSubmitting } = usePost(
    `/api/user/order/${deliveredOrder?.orderId}/rate`,
  );

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
    } catch (err) {
      console.error("Rating submission failed:", err);
    }
  };

  /* ---------------- UI CONFIG ---------------- */
  const cards = [
    {
      title: t("eMenu"),
      desc: t("eMenuDesc"),
      icon: FileText,
      nameToAdd: "/e-menu",
      setting: "eMenu" as const,
    },
    {
      title: t("menu"),
      desc: t("menuDesc"),
      icon: UtensilsCrossed,
      nameToAdd: "/menu",
      setting: "menuPdf" as const,
    },
  ].filter((item) => isSectionEnabled(item.setting));

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Error loading restaurant data.
      </div>
    );

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-hidden bg-white dark:bg-zinc-950">
      {/* COVER */}
      {restaurant?.cover && (
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
          <img
            src={restaurant.cover}
            alt="cover"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Restaurant Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center px-6"
      >
        {restaurant?.logo && (
          <div className="relative -mt-20 mb-4 overflow-hidden border-4 border-white shadow-xl w-24 h-24 rounded-3xl dark:border-zinc-800 bg-gray-50 z-10">
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="object-contain w-full h-full"
            />
          </div>
        )}
        {isSectionEnabled("name") && (
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white line-clamp-1">
            {isRTL ? restaurant?.nameAr : restaurant?.name}
          </h1>
        )}
      </motion.div>

      {/* CARDS */}
      {cards.length > 0 && (
        <div
          className={`grid w-full max-w-md ${cards.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-5 mt-10 px-6`}
        >
          {cards.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.setting}
                href={`${basePath}${item.nameToAdd}`}
                className={cards.length === 1 ? "w-1/2 justify-self-center" : ""}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.03, y: -3 }}
                  className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm dark:bg-zinc-900 dark:border-zinc-800"
                >
                  <div className="p-3 rounded-2xl bg-yellow-50 dark:bg-yellow-400/10 w-fit">
                    <Icon className="text-yellow-500" />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {item.desc}
                  </p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      {isSectionEnabled("hotline") && restaurant?.callcenterphone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 w-full max-w-md px-6 text-center"
        >
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
            <Phone size={16} style={{ color: firstColor }} />
            <span>{t("hotline")}:</span>
            <span dir="ltr">{restaurant.callcenterphone}</span>
          </p>
        </motion.div>
      )}

      {/* ORDER BUTTON */}
      {isSectionEnabled("orderNow") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md px-6"
        >
          <button
            type="button"
            onClick={handleOrderNowClick}
            disabled={!instantOrder}
            className={`flex w-full items-center justify-center gap-2 py-3 mt-6 text-base font-bold rounded-xl transition-colors ${
              !instantOrder
                ? "bg-gray-300 text-gray-500 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
                : "text-gray-900 bg-yellow-400 hover:bg-yellow-500"
            }`}
          >
            <ShoppingCart size={18} />
            {t("orderNow")}
          </button>
        </motion.div>
      )}

      {isSectionEnabled("branches") && restaurant?.id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md px-6"
        >
          <button
            type="button"
            onClick={handleShowBranches}
            className="flex w-full items-center justify-center gap-2 py-3 mt-3 text-base font-bold rounded-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: firstColor, color: textFirstColor }}
          >
            <MapPin size={18} />
            {t("viewBranches")}
          </button>
        </motion.div>
      )}

      {/* SOCIAL LINKS */}
      {isSectionEnabled("socialMedia") && restaurant?.id && (
        <SocialLinks restaurantId={restaurant.id} />
      )}

      {/* APP BUTTONS */}
      {(isSectionEnabled("iosIcon") || isSectionEnabled("androidIcon")) && (
        <div
          className={`grid ${isSectionEnabled("iosIcon") && isSectionEnabled("androidIcon") ? "grid-cols-2" : "grid-cols-1"} gap-4 mt-6 w-full max-w-md px-6 mb-10`}
        >
          {/* iOS App Store Button */}
          {isSectionEnabled("iosIcon") &&
            (restaurant?.iosApp ? (
              <a
                href={restaurant.iosApp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 text-white bg-black rounded-2xl shadow-lg cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                <FaApple className="w-6 h-6" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] opacity-70">
                    {t("downloadOn")}
                  </span>
                  <span className="text-sm font-bold">{t("appStore")}</span>
                </div>
              </a>
            ) : (
              <div className="relative flex items-center justify-center gap-2 py-4 text-gray-400 bg-gray-100 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800/50 rounded-2xl opacity-60 cursor-not-allowed select-none">
                <FaApple className="w-6 h-6 opacity-40" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] opacity-70">
                    {t("downloadOn")}
                  </span>
                  <span className="text-sm font-bold">{t("appStore")}</span>
                </div>
                <Lock className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            ))}

          {/* Android Google Play Button */}
          {isSectionEnabled("androidIcon") &&
            (restaurant?.androidApp ? (
              <a
                href={restaurant.androidApp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <FaGooglePlay className="w-5 h-5 text-green-500" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] text-gray-500">
                    {t("getItOn")}
                  </span>
                  <span className="text-sm font-bold dark:text-zinc-300">
                    {t("googlePlay")}
                  </span>
                </div>
              </a>
            ) : (
              <div className="relative flex items-center justify-center gap-2 py-4 bg-gray-100 border border-gray-200 dark:bg-zinc-800/40 dark:border-zinc-800/50 rounded-2xl opacity-60 cursor-not-allowed select-none text-gray-400 dark:text-zinc-500">
                <FaGooglePlay className="w-5 h-5 grayscale opacity-40" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] opacity-70">
                    {t("getItOn")}
                  </span>
                  <span className="text-sm font-bold">{t("googlePlay")}</span>
                </div>
                <Lock className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            ))}
        </div>
      )}
      <Link href={`${basePath}/policy`} className="w-full max-w-md px-6 mt-6">
        <h3 className="font-bold text-gray-900 text-center mb-2.5 dark:text-white">
          {t("privacyandsupport")}
        </h3>
      </Link>
      <div className="flex justify-center mt-5 mb-3">
        <Link
          href={`${basePath}/refund`}
          className="px-5 py-2 text-sm font-semibold text-gray-700 transition-all bg-gray-50 rounded-full shadow-sm dark:bg-zinc-900 dark:text-zinc-300 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/20"
        >
          {t("refundPolicy") || "Refund Policy"}
        </Link>
      </div>

      {/* BRANCHES MODAL */}
      <AnimatePresence>
        {showBranches && isSectionEnabled("branches") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowBranches(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="restaurant-branches-title"
              dir={isRTL ? "rtl" : "ltr"}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2
                  id="restaurant-branches-title"
                  className="text-lg font-bold text-gray-900 dark:text-white"
                >
                  {t("restaurantBranches")}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowBranches(false)}
                  aria-label={t("close")}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X size={20} className="text-gray-700 dark:text-white" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-2 mb-5">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="flex items-center justify-center min-h-11 gap-2 px-4 py-2 text-sm font-semibold transition border rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ borderColor: firstColor, color: firstColor }}
                >
                  {locating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LocateFixed size={16} />
                  )}
                  {locating
                    ? t("locating")
                    : userLocation
                      ? t("updateMyLocation")
                      : t("useMyLocation")}
                </button>
                {locationError && (
                  <p className="text-xs text-center text-red-500">
                    {locationError}
                  </p>
                )}
              </div>

              {branchesLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500 dark:text-zinc-400">
                  <Loader2
                    size={18}
                    className="animate-spin"
                    style={{ color: firstColor }}
                  />
                  {t("loading")}
                </div>
              ) : branchesRestaurantId !== restaurant?.id ? null : branchesError ? (
                <p className="py-8 text-sm text-center text-red-500">
                  {t("branchesLoadFailed")}
                </p>
              ) : sortedBranches.length === 0 ? (
                <p className="py-8 text-sm text-center text-gray-500 dark:text-zinc-400">
                  {t("noBranches")}
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedBranches.map((branch, index) => (
                    <div
                      key={branch.id}
                      className="flex items-start gap-3 p-4 border border-gray-200 dark:border-zinc-800 rounded-2xl"
                    >
                      <span
                        className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: `${firstColor}33` }}
                      >
                        <MapPin
                          className="w-5 h-5"
                          style={{ color: firstColor }}
                        />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 break-words dark:text-white">
                            {isRTL ? branch.nameAr || branch.name : branch.name}
                          </h3>
                          {branch.distanceKm !== null && (
                            <span
                              className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap"
                              style={{
                                backgroundColor: `${firstColor}33`,
                                color: firstColor,
                              }}
                            >
                              {branch.distanceKm < 1
                                ? `${Math.round(branch.distanceKm * 1000)} ${isRTL ? "م" : "m"}`
                                : `${branch.distanceKm.toFixed(1)} ${isRTL ? "كم" : "km"}`}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                          {isRTL
                            ? branch.addressAr || branch.address
                            : branch.address}
                        </p>
                        {userLocation &&
                          branch.distanceKm !== null &&
                          index === 0 && (
                            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {t("nearest")}
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RATING MODAL */}
      <AnimatePresence>
        {showRating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between mb-4 items-center">
                <h2 className="font-bold text-lg dark:text-white">
                  {t("Enjoying your visit?")}
                </h2>
                <button
                  onClick={() => setShowRating(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X size={20} className="dark:text-white" />
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
                {t("Kindly rate your last order")}
              </p>

              {/* STARS */}
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} onClick={() => setRating(num)}>
                    <Star
                      className={`w-10 h-10 transition-all ${
                        num <= rating
                          ? "fill-yellow-400 text-yellow-400 scale-110"
                          : "text-gray-300 dark:text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* COMMENT FIELD */}
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
                className={`w-full py-3 text-white font-bold rounded-2xl transition-colors ${
                  isSubmitting || rating === 0
                    ? "bg-gray-300 dark:bg-zinc-800 cursor-not-allowed"
                    : "bg-yellow-400 hover:bg-yellow-500 shadow-lg shadow-yellow-400/20"
                }`}
              >
                {isSubmitting ? t("Submitting...") : t("Submit Rating")}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
