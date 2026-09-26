"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  useRestaurant,
  useRestaurantSettings,
} from "@/context/RestaurantContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter, useParams } from "next/navigation";
import {
  Phone,
  MapPin,
  Globe,
  ArrowLeft,
  Info,
  ChevronLeft,
  Share2,
  X,
  Store,
  Loader2,
  LocateFixed,
  ShoppingCart,
  Lock,
} from "lucide-react";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";
import { FaInstagramSquare } from "react-icons/fa";

const API_BASE = "https://keetobcknd.keeto.org";
const MAIN_BRANCH_ID = "__main__";

/* ── Types ─────────────────────────────────────────────────────────── */

interface FoodItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  image: string;
  subcategory?: {
    id: string;
    name: string;
    nameAr: string;
    order_level?: number;
  } | null;
  category?: {
    id: string;
    name: string;
    nameAr: string;
  } | null;
}

interface MenuCategory {
  id?: string;
  name: string;
  nameAr?: string;
  foods: FoodItem[];
}

interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  lat?: string;
  lng?: string;
  status?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
}

type BranchWithDistance = Branch & { distanceKm: number | null };

interface ContactItemProps {
  icon: React.ReactNode;
  title: string;
  value: string | undefined;
  href: string;
  isRtl: boolean;
  firstColor: string;
  textFirstColor: string;
}

/* ── Subcategory derived from menu ──────────────────────────────── */

interface DerivedSubCategory {
  id: string; // unique key for scroll
  rawId: string; // actual subcategory id or "__no_sub__"
  name: string;
  nameAr: string;
  catId: string;
  catName: string;
  catNameAr: string;
  orderLevel: number;
  foods: FoodItem[];
}

/* ── Distance helpers (same as menu page) ───────────────────────── */

const parseCoordinate = (coord: string | undefined | null): number | null => {
  if (!coord) return null;
  const n = parseFloat(coord.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
};

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

const formatDistance = (km: number, isRtl: boolean) => {
  if (km < 1) return `${Math.round(km * 1000)} ${isRtl ? "م" : "m"}`;
  return `${km.toFixed(1)} ${isRtl ? "كم" : "km"}`;
};

/* ── App Store Icon Button (same as menu page) ──────────────────── */

function AppIconButton({
  href,
  label,
  variant,
  firstColor,
}: {
  href?: string | null;
  label: string;
  variant: "ios" | "android";
  firstColor: string;
}) {
  const Icon = variant === "ios" ? FaApple : FaGooglePlay;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className={`flex items-center justify-center w-full h-11 rounded-xl transition-colors ${
          variant === "ios"
            ? "text-white bg-black hover:bg-zinc-800"
            : "bg-white border border-gray-200 dark:bg-zinc-900 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800"
        }`}
      >
        <Icon
          className={`w-5 h-5 ${variant === "android" ? "text-green-500" : ""}`}
        />
      </a>
    );
  }

  return (
    <div
      aria-disabled="true"
      aria-label={label}
      title={label}
      className="relative flex items-center justify-center w-full h-11 text-gray-400 bg-gray-100 border border-gray-200 opacity-60 cursor-not-allowed select-none rounded-xl dark:bg-zinc-800/40 dark:border-zinc-800/50 dark:text-zinc-500"
    >
      <Icon className="w-5 h-5 opacity-40" />
      <Lock className="absolute top-1 right-1 w-3 h-3 text-gray-400 dark:text-zinc-500" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ════════════════════════════════════════════════════════════════════ */

export default function RestaurantLinkPage() {
  const { language } = useLanguage();
  const { restaurant, isLoading: restaurantLoading } = useRestaurant();
  const {
    firstColor,
    secondColor,
    textFirstColor,
    textSecondColor,
    instantOrder,
    themeStyles,
  } = useRestaurantSettings();

  const [view, setView] = useState<"links" | "menu">("menu");
  const [activeSubId, setActiveSubId] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const router = useRouter();
  const params = useParams();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryBarRef = useRef<HTMLDivElement | null>(null);
  const isManualClick = useRef(false);

  const restaurantSlug = params?.slug as string;
  const basePath = `/home/restaurants/${restaurantSlug}`;

  /* ── Branch selection states ──────────────────────────────────── */
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoaded, setBranchesLoaded] = useState<boolean>(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  /* ── Local menu state (fetched with branchId) ────────────────── */
  const [localMenu, setLocalMenu] = useState<MenuCategory[] | null>(null);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );
  const isMainSelected = selectedBranchId === MAIN_BRANCH_ID;

  const getBranchName = (branch: Branch) =>
    isRtl ? branch.nameAr || branch.name : branch.name;

  const getBranchAddress = (branch: Branch) =>
    isRtl ? branch.addressAr || branch.address : branch.address;

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

  /* ── Derive subcategories from menu (same logic as RestaurantItms) ─ */
  const derivedSubCategories = useMemo<DerivedSubCategory[]>(() => {
    if (!Array.isArray(localMenu)) return [];
    const subs: DerivedSubCategory[] = [];
    localMenu.forEach((cat) => {
      const subMap = new Map<string, DerivedSubCategory>();
      (cat.foods || []).forEach((food) => {
        const sub = food.subcategory;
        const key = sub?.id ? sub.id : "__no_sub__";
        const uniqueId =
          key === "__no_sub__" ? `${cat.id || cat.name}__no_sub__` : key;
        if (!subMap.has(uniqueId)) {
          subMap.set(uniqueId, {
            id: uniqueId,
            rawId: key,
            name: sub?.id ? sub.name : cat.name,
            nameAr: sub?.id ? sub.nameAr : (cat.nameAr || cat.name),
            catId: cat.id || cat.name,
            catName: cat.name,
            catNameAr: cat.nameAr || cat.name,
            orderLevel:
              sub?.id && typeof sub.order_level === "number"
                ? sub.order_level
                : 999,
            foods: [],
          });
        }
        subMap.get(uniqueId)!.foods.push(food);
      });
      const sorted = Array.from(subMap.values()).sort(
        (a, b) => a.orderLevel - b.orderLevel,
      );
      subs.push(...sorted);
    });
    return subs;
  }, [localMenu]);

  const isRtl = language === "العربية";

  /* ── Set initial active subcategory ───────────────────────────── */
  useEffect(() => {
    if (derivedSubCategories.length > 0 && !activeSubId) {
      setActiveSubId(derivedSubCategories[0].id);
    }
  }, [derivedSubCategories, activeSubId]);

  /* ── Fetch branches ───────────────────────────────────────────── */
  useEffect(() => {
    if (restaurantLoading || !restaurant?.id) return;

    const restaurantId = restaurant.id;
    let cancelled = false;

    async function fetchBranches() {
      try {
        const response = await fetch(
          `${API_BASE}/api/user/restaurants/${restaurantId}/branches`,
          { cache: "no-store" },
        );
        const result = await response.json();
        if (cancelled) return;

        if (result.success && result.data?.data) {
          const active = (result.data.data as Branch[]).filter(
            (b) => !b.status || b.status === "active",
          );
          setBranches(active);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      } finally {
        if (!cancelled) setBranchesLoaded(true);
      }
    }

    fetchBranches();
    return () => {
      cancelled = true;
    };
  }, [restaurant?.id, restaurantLoading]);

  // If no branches exist, auto-select main
  useEffect(() => {
    if (branchesLoaded && branches.length === 0 && !selectedBranchId) {
      setSelectedBranchId(MAIN_BRANCH_ID);
    }
  }, [branchesLoaded, branches.length, selectedBranchId]);

  /* ── Fetch menu with branchId when branch is selected ─────────── */
  useEffect(() => {
    if (!restaurant?.id || !branchesLoaded) return;

    // Branches exist but none selected yet → don't fetch
    if (branches.length > 0 && !selectedBranchId) {
      setLocalMenu(null);
      return;
    }

    const restaurantId = restaurant.id;
    let cancelled = false;

    async function fetchMenuForBranch() {
      try {
        setMenuLoading(true);
        setLocalMenu(null);
        setActiveSubId("");

        // Main menu (or no branches) → no branchId param
        const branchQuery =
          selectedBranchId && selectedBranchId !== MAIN_BRANCH_ID
            ? `?branchId=${selectedBranchId}`
            : "";

        const response = await fetch(
          `${API_BASE}/api/user/home/restaurants/${restaurantId}${branchQuery}`,
          { cache: "no-store" },
        );
        const result = await response.json();
        if (cancelled) return;

        const menuData = result?.data?.data?.menu || result?.data?.menu || null;
        if (menuData) {
          setLocalMenu(menuData);
        }
      } catch (error) {
        console.error("Error fetching branch menu:", error);
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    }

    fetchMenuForBranch();
    return () => {
      cancelled = true;
    };
  }, [restaurant?.id, branchesLoaded, branches.length, selectedBranchId]);

  /* ── Scroll-spy for subcategory sections ─────────────────────── */
  useEffect(() => {
    if (view !== "menu" || derivedSubCategories.length === 0) return;

    const timer = setTimeout(() => {
      const handleIntersect = (entries: IntersectionObserverEntry[]) => {
        if (isManualClick.current) return;

        const visibleEntry = entries.find((e) => e.isIntersecting);
        if (visibleEntry) {
          const subId = visibleEntry.target.id;
          setActiveSubId(subId);

          const activeTab = document.getElementById(`pill-${subId}`);
          if (activeTab && categoryBarRef.current) {
            categoryBarRef.current.scrollTo({
              left:
                activeTab.offsetLeft -
                categoryBarRef.current.offsetWidth / 2 +
                activeTab.offsetWidth / 2,
              behavior: "smooth",
            });
          }
        }
      };

      const observer = new IntersectionObserver(handleIntersect, {
        root: null,
        rootMargin: "-120px 0px -70% 0px",
        threshold: 0,
      });

      Object.values(sectionRefs.current).forEach((section) => {
        if (section) observer.observe(section);
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [view, derivedSubCategories]);

  /* ── Scroll to subcategory on pill click ─────────────────────── */
  const scrollToSubCategory = (subId: string) => {
    setActiveSubId(subId);
    isManualClick.current = true;

    setTimeout(() => {
      const element = sectionRefs.current[subId];
      if (element) {
        const offset = 120;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const offsetPosition = elementRect - bodyRect - offset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
      setTimeout(() => {
        isManualClick.current = false;
      }, 800);
    }, 120);
  };

  /* ── Location handler ─────────────────────────────────────────── */
  const handleUseMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(
        isRtl
          ? "المتصفح لا يدعم تحديد الموقع"
          : "Geolocation is not supported by your browser",
      );
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
            ? isRtl
              ? "تم رفض إذن الموقع. فعّله من إعدادات المتصفح."
              : "Location permission denied. Enable it in your browser settings."
            : isRtl
              ? "تعذر تحديد موقعك. حاول مرة أخرى."
              : "Couldn't get your location. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleChangeBranch = () => {
    setSelectedBranchId(null);
  };

  /* ── Order Now handler (same as menu page) ───────────────────── */
  const handleOrderNowClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (instantOrder) return;
    router.push(`${basePath}/restaurant`);
  };

  /* ── Loading states ──────────────────────────────────────────── */
  if (restaurantLoading || menuLoading || (restaurant?.id && !branchesLoaded)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#09090b]">
        <Loader2
          className="w-12 h-12 animate-spin"
          style={{ color: firstColor }}
        />
        <p className="mt-3 text-xs text-zinc-500">
          {isRtl ? "جاري التحميل..." : "Loading..."}
        </p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     BRANCH SELECTION SCREEN
     ══════════════════════════════════════════════════════════════════ */
  if (branches.length > 0 && !selectedBranchId) {
    return (
      <div
        className="min-h-screen bg-white dark:bg-[#09090b] text-gray-900 dark:text-white font-sans px-5 py-6"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="space-y-6 duration-500 animate-in fade-in zoom-in-95 max-w-xl mx-auto">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={isRtl ? "رجوع" : "Back"}
            className="flex items-center justify-center w-11 h-11 transition-transform rounded-full shadow-md shrink-0 active:scale-95"
            style={{ backgroundColor: firstColor, color: textFirstColor }}
          >
            <ChevronLeft
              className={`w-6 h-6 ${isRtl ? "rotate-180" : ""}`}
              style={{ color: textFirstColor }}
            />
          </button>

          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold dark:text-white">
              {isRtl ? "اختر الفرع" : "Choose a branch"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isRtl
                ? "اختر الفرع لعرض المنيو الخاص به"
                : "Select a branch to view its menu"}
            </p>
          </div>

          {/* USE CURRENT LOCATION */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleUseMyLocation}
              disabled={locating}
              className="flex items-center justify-center w-full sm:w-auto min-h-[44px] gap-2 px-5 py-2.5 text-sm font-semibold transition border rounded-2xl hover:opacity-80 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                borderColor: firstColor,
                color: firstColor,
              }}
            >
              {locating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LocateFixed size={16} />
              )}
              {locating
                ? isRtl
                  ? "جاري تحديد موقعك..."
                  : "Locating..."
                : userLocation
                  ? isRtl
                    ? "تحديث موقعي"
                    : "Update my location"
                  : isRtl
                    ? "استخدم موقعي الحالي"
                    : "Use my current location"}
            </button>
            {locationError && (
              <p className="text-xs text-center text-red-500">
                {locationError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-3">
            {/* MAIN MENU option */}
            <button
              onClick={() => setSelectedBranchId(MAIN_BRANCH_ID)}
              className="flex items-start gap-3 p-4 min-h-[64px] h-full text-start transition-all bg-white border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl hover:shadow-md active:scale-[0.98]"
              style={
                {
                  ["--hover-border" as string]: firstColor,
                } as React.CSSProperties
              }
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = firstColor)
              }
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
            >
              <span
                className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                style={{ backgroundColor: `${firstColor}33` }}
              >
                <Store className="w-5 h-5" style={{ color: firstColor }} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-gray-900 dark:text-white">
                  {isRtl ? "القائمة الرئيسية" : "Main menu"}
                </span>
                <span className="block mt-1 text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">
                  {isRtl
                    ? "المنيو العام للمطعم"
                    : "The restaurant's general menu"}
                </span>
              </span>
            </button>

            {sortedBranches.map((branch, index) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className="flex items-start gap-3 p-4 min-h-[64px] h-full text-start transition-all bg-white border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl hover:shadow-md active:scale-[0.98]"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = firstColor)
                }
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
              >
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: `${firstColor}33` }}
                >
                  <MapPin className="w-5 h-5" style={{ color: firstColor }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-gray-900 break-words dark:text-white">
                      {getBranchName(branch)}
                    </span>
                    {branch.distanceKm !== null && (
                      <span className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap"
                          style={{
                            backgroundColor: `${firstColor}33`,
                            color: firstColor,
                          }}
                        >
                          {formatDistance(branch.distanceKm, isRtl)}
                        </span>
                        {index === 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {isRtl ? "الأقرب" : "Nearest"}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  <span className="block mt-1 text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">
                    {getBranchAddress(branch)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     MAIN E-MENU VIEW
     ══════════════════════════════════════════════════════════════════ */

  return (
    <div
      style={
        {
          "--primary-color": firstColor,
          "--primary-text": textFirstColor,
        } as React.CSSProperties
      }
      className="min-h-screen bg-white dark:bg-[#09090b] text-gray-900 dark:text-white font-sans selection:bg-[var(--primary-color)]/30 flex flex-col"
    >
      {/* ── Cover image ───────────────────────────────────────────── */}
      <div className="relative w-full h-56 overflow-hidden shrink-0 md:h-72">
        <img
          src={restaurant?.cover || "/default-cover.jpg"}
          className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
          alt="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white dark:to-[#09090b]" />
        <div
          className={`absolute top-6 px-6 w-full flex justify-between items-center ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <button
            onClick={() => router.back()}
            className="absolute z-20 flex items-center justify-center w-10 h-10 transition-transform rounded-full shadow-md mt-6 top-4 left-4 active:scale-95"
            style={{ backgroundColor: firstColor, color: textFirstColor }}
          >
            <ChevronLeft className="w-6 h-6" style={{ color: textFirstColor }} />
          </button>
          <ShareButton />

          {view === "links" && (
            <button
              onClick={() => setView("menu")}
              className="p-2.5 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all"
              style={{ backgroundColor: firstColor, color: textFirstColor }}
            >
              <ArrowLeft size={22} className={isRtl ? "rotate-180" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* ── Restaurant info ─────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center px-6 -mt-16 shrink-0">
        <div className="relative group">
          <div
            className="absolute transition duration-1000 rounded-full -inset-1 blur opacity-20 group-hover:opacity-40"
            style={{ backgroundColor: firstColor }}
          />
          <div className="relative w-32 h-32 rounded-full border-[5px] border-white dark:border-[#09090b] overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-2xl">
            <img
              src={restaurant?.logo || "/default-logo.png"}
              className="object-contain w-full h-full"
              alt="logo"
            />
          </div>
        </div>
        <h1 className="mt-3 text-2xl font-black text-center text-gray-900 dark:text-white">
          {isRtl ? restaurant?.nameAr : restaurant?.name}
        </h1>
        <p className="text-zinc-500 text-sm mt-1 flex items-center gap-1.5">
          <MapPin size={12} style={{ color: firstColor }} />
          {isRtl ? restaurant?.addressAr : restaurant?.address}
        </p>

        {/* Branch change bar */}
        {branches.length > 0 && (selectedBranch || isMainSelected) && (
          <button
            onClick={handleChangeBranch}
            className="flex items-center justify-between w-full max-w-md mt-3 min-h-[40px] gap-3 px-4 py-2.5 text-start transition border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl"
            style={{ borderColor: `${firstColor}40` }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = firstColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = `${firstColor}40`)
            }
          >
            <span className="flex items-center min-w-0 gap-2">
              <Store
                className="w-4 h-4 shrink-0"
                style={{ color: firstColor }}
              />
              <span className="text-sm font-semibold truncate dark:text-white">
                {selectedBranch
                  ? getBranchName(selectedBranch)
                  : isRtl
                    ? "القائمة الرئيسية"
                    : "Main menu"}
              </span>
            </span>
            <span
              className="text-xs font-semibold shrink-0"
              style={{ color: firstColor }}
            >
              {isRtl ? "تغيير الفرع" : "Change branch"}
            </span>
          </button>
        )}
      </div>

      {/* ── Menu content ─────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pb-10 mt-6">
        <div className="max-w-xl mx-auto">
          {view === "menu" ? (
            <div className="duration-500 animate-in slide-in-from-bottom-5">
              {/* ── Subcategory pills (scroll bar) ─────────────────── */}
              <div
                ref={categoryBarRef}
                className="sticky top-0 z-20 flex gap-2 py-3 mb-6 overflow-x-auto no-scrollbar bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md"
              >
                {derivedSubCategories.map((sub) => (
                  <button
                    id={`pill-${sub.id}`}
                    key={sub.id}
                    onClick={() => scrollToSubCategory(sub.id)}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                      activeSubId === sub.id
                        ? "scale-105 shadow-md"
                        : "bg-gray-100 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-500"
                    }`}
                    style={
                      activeSubId === sub.id
                        ? {
                            backgroundColor: firstColor,
                            borderColor: firstColor,
                            color: textFirstColor,
                          }
                        : undefined
                    }
                  >
                    {isRtl ? sub.nameAr : sub.name}
                  </button>
                ))}
              </div>

              {/* ── Food sections grouped by subcategory ──────────── */}
              <div className="space-y-12">
                {derivedSubCategories.map((sub) => {
                  const items = sub.foods;
                  if (items.length === 0) return null;

                  return (
                    <div
                      key={sub.id}
                      id={sub.id}
                      ref={(el) => {
                        sectionRefs.current[sub.id] = el;
                      }}
                      className="scroll-mt-32"
                    >
                      <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">
                          {isRtl ? sub.nameAr : sub.name}
                        </h2>
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                          ({items.length}) {isRtl ? "منتج" : "items"}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800/50 p-3 rounded-[1.8rem] flex items-center gap-4 group hover:shadow-md cursor-pointer transition-all ${isRtl ? "flex-row-reverse" : ""}`}
                          >
                            <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden shrink-0">
                              <img
                                src={item.image}
                                className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-500"
                                alt={item.name}
                              />
                            </div>
                            <div
                              className={`flex-1 ${isRtl ? "text-right" : "text-left"}`}
                              dir={isRtl ? "rtl" : "ltr"}
                            >
                              <h3 className="text-md font-bold text-gray-900 dark:text-white transition-colors group-hover:opacity-80">
                                {isRtl ? item.nameAr : item.name}
                              </h3>
                              <p className="text-[10px] text-gray-400 dark:text-zinc-500 line-clamp-1">
                                {isRtl
                                  ? item.descriptionAr
                                  : item.description}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span
                                  className="text-lg font-black italic"
                                  style={{ color: firstColor }}
                                >
                                  {item.price}{" "}
                                  <small className="text-[9px] not-italic">
                                    EGP
                                  </small>
                                </span>
                                <button
                                  className="p-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-all"
                                  style={
                                    {
                                      "--hover-bg": firstColor,
                                    } as React.CSSProperties
                                  }
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      firstColor;
                                    e.currentTarget.style.color =
                                      textFirstColor;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "";
                                    e.currentTarget.style.color = "";
                                  }}
                                >
                                  <Info size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 duration-500 animate-in fade-in zoom-in-95">
              <div className="space-y-3">
                <ContactItem
                  icon={<Phone size={20} />}
                  title={isRtl ? "اطلب الآن" : "Call Us"}
                  value={restaurant?.ownerPhone}
                  href={`tel:${restaurant?.ownerPhone}`}
                  isRtl={isRtl}
                  firstColor={firstColor}
                  textFirstColor={textFirstColor}
                />
                <ContactItem
                  icon={<FaInstagramSquare size={20} />}
                  title={isRtl ? "تابعنا" : "Instagram"}
                  value={restaurant?.name}
                  href="#"
                  isRtl={isRtl}
                  firstColor={firstColor}
                  textFirstColor={textFirstColor}
                />
                <ContactItem
                  icon={<Globe size={20} />}
                  title={isRtl ? "الموقع" : "Website"}
                  value={
                    restaurant?.email
                      ? restaurant.email.split("@")[0]
                      : "visit"
                  }
                  href="#"
                  isRtl={isRtl}
                  firstColor={firstColor}
                  textFirstColor={textFirstColor}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="shrink-0 py-4 text-center border-t border-gray-100 dark:border-zinc-900 bg-white dark:bg-[#09090b]">
        <p className="text-gray-400 dark:text-zinc-600 text-[9px] uppercase tracking-widest font-bold">
          Powered by{" "}
          <span style={{ color: firstColor }}>Keeto Ecosystem</span>
        </p>
      </footer>

      {/* ══════════════════════════════════════════════════════════════
          ITEM DETAIL DIALOG — with Order Now + iOS/Android buttons
          ══════════════════════════════════════════════════════════════ */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 duration-300 animate-in fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={`w-full sm:max-w-md bg-white dark:bg-[#0c0c0e] border border-gray-100 dark:border-zinc-800/80 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl transform transition-transform duration-300 animate-in slide-in-from-bottom sm:zoom-in-95 ${isRtl ? "text-right" : "text-left"}`}
            dir={isRtl ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header/Image container */}
            <div className="relative h-64 w-full bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-center p-6 border-b border-gray-100 dark:border-zinc-900">
              <button
                onClick={() => setSelectedItem(null)}
                className={`absolute top-4 z-10 bg-black/40 dark:bg-zinc-900/80 backdrop-blur-md text-white p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all ${isRtl ? "left-4" : "right-4"}`}
              >
                <X size={18} />
              </button>
              <img
                src={selectedItem.image}
                alt={isRtl ? selectedItem.nameAr : selectedItem.name}
                className="max-h-full max-w-full object-contain drop-shadow-xl"
              />
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  {isRtl ? selectedItem.nameAr : selectedItem.name}
                </h2>
                <span
                  className="inline-block mt-2 text-xl font-black italic"
                  style={{ color: firstColor }}
                >
                  {selectedItem.price}{" "}
                  <span className="text-xs not-italic font-bold text-gray-400 dark:text-zinc-500">
                    EGP
                  </span>
                </span>
              </div>

              <div className="border-t border-gray-100 dark:border-zinc-900 pt-3">
                <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                  {isRtl ? "الوصف" : "Description"}
                </p>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400 whitespace-pre-line">
                  {(isRtl
                    ? selectedItem.descriptionAr
                    : selectedItem.description) ||
                    (isRtl
                      ? "لا يوجد وصف متاح لهذا المنتج."
                      : "No description available for this item.")}
                </p>
              </div>

              {/* ── Action buttons: Order Now + iOS + Android ─────── */}
              <div className="grid grid-cols-3 w-full gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleOrderNowClick}
                  disabled={instantOrder}
                  className={`flex w-full h-11 min-w-0 items-center justify-center gap-1.5 px-2 text-sm font-bold rounded-xl transition-colors ${
                    instantOrder
                      ? "bg-gray-300 text-gray-500 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
                      : ""
                  }`}
                  style={
                    !instantOrder
                      ? {
                          backgroundColor: firstColor,
                          color: textFirstColor,
                        }
                      : undefined
                  }
                >
                  <ShoppingCart size={16} />
                  <span className="truncate">
                    {isRtl ? "اطلب الآن" : "Order Now"}
                  </span>
                </button>

                <AppIconButton
                  href={restaurant?.iosApp}
                  label={isRtl ? "متجر أبل" : "App Store"}
                  variant="ios"
                  firstColor={firstColor}
                />
                <AppIconButton
                  href={restaurant?.androidApp}
                  label={isRtl ? "جوجل بلاي" : "Google Play"}
                  variant="android"
                  firstColor={firstColor}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CONTACT ITEM (links view)
   ══════════════════════════════════════════════════════════════════════ */

function ContactItem({
  icon,
  title,
  value,
  href,
  isRtl,
  firstColor,
  textFirstColor,
}: ContactItemProps) {
  return (
    <a
      href={href}
      className={`flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-zinc-700 transition-all group ${isRtl ? "flex-row-reverse" : ""}`}
    >
      <div
        className="p-2 rounded-xl transition-all"
        style={{
          backgroundColor: `${firstColor}20`,
          color: firstColor,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 px-4 text-center">
        <p className="text-[9px] text-zinc-600 font-black uppercase mb-0.5">
          {title}
        </p>
        <p className="text-sm font-bold text-zinc-300">{value}</p>
      </div>
      <ChevronLeft
        size={18}
        className={`${isRtl ? "rotate-0" : "rotate-180"} text-zinc-700`}
        style={{ color: firstColor }}
      />
    </a>
  );
}
