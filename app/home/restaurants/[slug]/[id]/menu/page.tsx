"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRestaurantSettings } from "@/context/RestaurantSettingsContext";
import {
  ChevronLeft,
  Download,
  FileImage,
  Loader2,
  Maximize2,
  MapPin,
  Store,
  X,
  LocateFixed,
  ShoppingCart,
  Lock,
} from "lucide-react";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { jsPDF } from "jspdf";
import { useParams, useRouter } from "next/navigation";

const API_BASE = "https://keetobcknd.keeto.org";

// Special value for selectedBranchId meaning "Main menu" (no branchId sent to the API)
const MAIN_BRANCH_ID = "__main__";

interface MenuImageItem {
  id: string;
  restaurantid: string;
  img: string;
  periorty: number;
  createdAt: string;
  updatedAt: string;
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
const formatDistance = (km: number, isRtl: boolean) => {
  if (km < 1) return `${Math.round(km * 1000)} ${isRtl ? "م" : "m"}`;
  return `${km.toFixed(1)} ${isRtl ? "كم" : "km"}`;
};

/* ---------------- APP STORE ICON BUTTON ---------------- */
// Link exists → real <a>. No link → locked <div> (anchors can't be truly disabled).
function AppIconButton({
  href,
  label,
  variant,
}: {
  href?: string | null;
  label: string;
  variant: "ios" | "android";
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

export default function MenuImageDownload() {
  const { language, t } = useLanguage();
  const isRtl = language === "العربية";
  const router = useRouter();
  const params = useParams();

  const { restaurant, isLoading: restaurantLoading } = useRestaurant();
  const { instantOrder } = useRestaurantSettings();

  // same navigation target as the Order Now button on the home page
  const restaurantSlug = params?.slug as string;
  const basePath = `/home/restaurants/${restaurantSlug}`;

  const handleOrderNowClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (instantOrder) return;
    router.push(`${basePath}/restaurant`);
  };

  const [images, setImages] = useState<MenuImageItem[]>([]);
  const [imagesLoading, setImagesLoading] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // --- branches ---
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoaded, setBranchesLoaded] = useState<boolean>(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // --- user location (for sorting branches nearest-first) ---
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

  // 1) جلب الفروع أولاً
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

  // 2) جلب صور المنيو الخاصة بالفرع المختار (branchId يُرسل في الـ API)
  useEffect(() => {
    if (!restaurant?.id || !branchesLoaded) return;

    // يوجد فروع ولم يتم اختيار فرع بعد → لا نجلب شيئاً
    if (branches.length > 0 && !selectedBranchId) {
      setImages([]);
      return;
    }

    const restaurantId = restaurant.id;
    let cancelled = false;

    async function fetchMenuImages() {
      try {
        setImagesLoading(true);
        setImages([]);

        // Main menu (or no branches at all) → the normal image API without branchId
        const url =
          selectedBranchId && selectedBranchId !== MAIN_BRANCH_ID
            ? `${API_BASE}/api/user/image/${restaurantId}?branchId=${selectedBranchId}`
            : `${API_BASE}/api/user/image/${restaurantId}`;

        const response = await fetch(url, { cache: "no-store" });
        const result = await response.json();
        if (cancelled) return;

        if (result.success && result.data?.data) {
          setImages(result.data.data);
        }
      } catch (error) {
        console.error("Error fetching menu images:", error);
      } finally {
        if (!cancelled) setImagesLoading(false);
      }
    }

    fetchMenuImages();
    return () => {
      cancelled = true;
    };
  }, [restaurant?.id, branchesLoaded, branches.length, selectedBranchId]);

  // Lightbox: lock the page scroll behind it and close on Escape
  useEffect(() => {
    if (!previewImage) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [previewImage]);

  const handleChangeBranch = () => {
    setImages([]);
    setSelectedBranchId(null);
  };

  // ترتيب تصاعدي بناءً على الأولوية لضمان تسلسل الصفحات الصحيح
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => a.periorty - b.periorty);
  }, [images]);

  // دالة ذكية لتحميل وتجميع الصور في PDF بأعلى جودة ممكنة (Pixel-Perfect)
  const downloadAsPdf = async () => {
    if (sortedImages.length === 0) return;

    try {
      setDownloadingPdf(true);
      let pdf: jsPDF | null = null;

      for (let i = 0; i < sortedImages.length; i++) {
        const item = sortedImages[i];

        // 1. جلب الصورة كـ Blob آمن لتفادي مشاكل الـ CORS
        const imgBlob = await fetch(item.img).then((res) => res.blob());
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imgBlob);
        });

        // 2. قراءة الأبعاد الحقيقية والأصلية للصورة للحفاظ على الجودة بنسبة 100%
        const imgDimensions = await new Promise<{
          width: number;
          height: number;
        }>((resolve) => {
          const img = new Image();
          img.onload = () =>
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.src = dataUrl;
        });

        // تحويل الأبعاد من بكسل إلى مليمتر تقريبياً للـ PDF
        const pdfWidth = imgDimensions.width * 0.264583;
        const pdfHeight = imgDimensions.height * 0.264583;

        // 3. إنشاء الـ PDF في أول لفة بأبعاد أول صورة، أو إضافة صفحة جديدة بالأبعاد المناسبة
        if (i === 0) {
          pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? "l" : "p",
            unit: "mm",
            format: [pdfWidth, pdfHeight],
          });
        } else if (pdf) {
          pdf.addPage([pdfWidth, pdfHeight], pdfWidth > pdfHeight ? "l" : "p");
        }

        // 4. إضافة الصورة بدون أي ضغط (Compression: NONE) لمنع البكسلة والغبش تمااماً
        if (pdf) {
          pdf.addImage(
            dataUrl,
            "JPEG",
            0,
            0,
            pdfWidth,
            pdfHeight,
            undefined,
            "NONE",
          );
        }
      }

      if (pdf) {
        const restaurantName = isRtl ? restaurant?.nameAr : restaurant?.name;
        const branchSuffix = selectedBranch
          ? `-${getBranchName(selectedBranch).trim()}`
          : "";
        pdf.save(`${restaurantName || "menu"}${branchSuffix}-high-quality.pdf`);
      }
    } catch (error) {
      console.error("Error generating HD PDF:", error);
      alert(
        isRtl
          ? "حدث خطأ أثناء تحميل ملف الـ PDF عالي الجودة"
          : "Failed to download High-Quality PDF",
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const backButton = (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label={isRtl ? "رجوع" : "Back"}
      className="flex items-center justify-center w-11 h-11 transition-transform bg-yellow-400 rounded-full shadow-md shrink-0 active:scale-95"
    >
      <ChevronLeft
        className={`w-6 h-6 text-white ${isRtl ? "rotate-180" : ""}`}
      />
    </button>
  );

  // تحميل بيانات المطعم أو الفروع
  if (restaurantLoading || (restaurant?.id && !branchesLoaded)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        <p className="text-xs text-zinc-500">
          {isRtl ? "جاري تحميل الفروع..." : "Loading branches..."}
        </p>
      </div>
    );
  }

  // الخطوة الأولى: اختيار الفرع
  if (branches.length > 0 && !selectedBranchId) {
    return (
      <div className="space-y-6 duration-500 animate-in fade-in zoom-in-95">
        <div className="pt-5 sm:pt-8">{backButton}</div>

        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="w-full max-w-3xl mx-auto space-y-6"
        >
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
              className="flex items-center justify-center w-full sm:w-auto min-h-[44px] gap-2 px-5 py-2.5 text-sm font-semibold text-yellow-700 transition border border-yellow-400 dark:text-yellow-400 rounded-2xl hover:bg-yellow-400/10 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
              className="flex items-start gap-3 p-4 min-h-[64px] h-full text-start transition-all bg-white border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl hover:border-yellow-400 hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-yellow-400/20">
                <Store className="w-5 h-5 text-yellow-500" />
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
                className="flex items-start gap-3 p-4 min-h-[64px] h-full text-start transition-all bg-white border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl hover:border-yellow-400 hover:shadow-md active:scale-[0.98]"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-yellow-400/20">
                  <MapPin className="w-5 h-5 text-yellow-500" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-gray-900 break-words dark:text-white">
                      {getBranchName(branch)}
                    </span>
                    {branch.distanceKm !== null && (
                      <span className="flex flex-col items-end gap-1 shrink-0">
                        <span className="px-2 py-0.5 text-xs font-medium text-yellow-700 rounded-full whitespace-nowrap bg-yellow-400/20 dark:text-yellow-300">
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

  const changeBranchButton =
    (selectedBranch || isMainSelected) && branches.length > 0 ? (
      <button
        onClick={handleChangeBranch}
        className="flex items-center justify-between w-full min-h-[44px] gap-3 px-4 py-3 text-start transition border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl hover:border-yellow-400"
      >
        <span className="flex items-center min-w-0 gap-2">
          <Store className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="text-sm font-semibold truncate dark:text-white">
            {selectedBranch
              ? getBranchName(selectedBranch)
              : isRtl
                ? "القائمة الرئيسية"
                : "Main menu"}
          </span>
        </span>
        <span className="text-xs font-semibold text-yellow-600 shrink-0">
          {isRtl ? "تغيير الفرع" : "Change branch"}
        </span>
      </button>
    ) : null;

  // Back button + branch bar share one row so they never overlap
  const topBar = (
    <div className="flex items-center w-full gap-3 pt-5 sm:pt-8">
      {backButton}
      {changeBranchButton && (
        <div className="flex-1 min-w-0">{changeBranchButton}</div>
      )}
    </div>
  );

  // تحميل صور الفرع المختار
  if (imagesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        <p className="text-xs text-zinc-500">
          {isRtl
            ? "جاري جلب صفحات المنيو بأعلى جودة..."
            : "Fetching HD Menu Pages..."}
        </p>
      </div>
    );
  }

  if (sortedImages.length === 0) {
    return (
      <div className="space-y-4">
        {topBar}
        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <FileImage className="w-10 h-10 mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {isRtl
              ? "لا توجد صور منيو متاحة حالياً."
              : "No menu images available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 duration-500 animate-in fade-in zoom-in-95">
      {topBar}

      {/* زر التحميل بتقنية الـ HD */}
      <button
        onClick={downloadAsPdf}
        disabled={downloadingPdf}
        className="w-full px-4 py-4 bg-yellow-400 disabled:bg-yellow-400/50 text-black rounded-2xl font-bold text-sm leading-tight text-center shadow-md flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-yellow-500"
      >
        {downloadingPdf ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Download size={18} />
        )}
        {downloadingPdf
          ? isRtl
            ? "جاري معالجة الصور بجودة فائقة..."
            : "Processing Ultra-HQ PDF..."
          : isRtl
            ? "تحميل المنيو كـ PDF عالي الجودة"
            : "Download High-Quality PDF"}
      </button>

      {/* شبكة عرض الصور المحسنة للمتصفحات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sortedImages.map((item, index) => (
          <div
            key={item.id}
            className="relative bg-zinc-100 dark:bg-zinc-900/60 border border-gray-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-all flex flex-col justify-center items-center p-2"
          >
            {/* رقم الصفحة */}
            <span className="absolute top-4 left-4 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md z-10 select-none">
              {isRtl ? `صفحة ${index + 1}` : `Page ${index + 1}`}
            </span>

            {/* زر تكبير ومعاينة الصورة الفردية بجودتها الكاملة */}
            <button
              onClick={() => setPreviewImage(item.img)}
              className="absolute top-4 right-4 p-2.5 bg-black/70 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 backdrop-blur-md z-10"
              title="Preview Image"
              aria-label="Preview Image"
            >
              <Maximize2 size={16} />
            </button>

            {/* حاوي الصورة المحسن هندسياً */}
            <button
              type="button"
              onClick={() => setPreviewImage(item.img)}
              className="relative block w-full h-auto overflow-hidden cursor-zoom-in rounded-xl"
              aria-label={`Menu page ${index + 1}`}
            >
              <img
                src={item.img}
                alt={`Menu page ${index + 1}`}
                // هنا يكمن سر الجودة في العرض: الحفاظ على أبعاد العرض الاحترافية وعمل رندر عالي الدقة
                className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                style={{ imageRendering: "auto" }}
                loading="lazy"
                decoding="async"
              />
            </button>

            {/* ORDER NOW + APP BUTTONS — same logic as the home page */}
            <div className="grid grid-cols-3 w-full gap-2 mt-2">
              <button
                type="button"
                onClick={handleOrderNowClick}
                disabled={instantOrder}
                className={`flex w-full h-11 min-w-0 items-center justify-center gap-1.5 px-2 text-sm font-bold rounded-xl transition-colors ${
                  instantOrder
                    ? "bg-gray-300 text-gray-500 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
                    : "text-gray-900 bg-yellow-400 hover:bg-yellow-500"
                }`}
              >
                <ShoppingCart size={16} />
                <span className="truncate">{t("orderNow")}</span>
              </button>

              <AppIconButton
                href={restaurant?.iosApp}
                label={t("appStore")}
                variant="ios"
              />
              <AppIconButton
                href={restaurant?.androidApp}
                label={t("googlePlay")}
                variant="android"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Modal لمعاينة الصورة المنفردة بكامل جودتها وعمل زووم */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          {/* CLOSE BUTTON — always reachable, even when the image is scrolled */}
          <button
            onClick={() => setPreviewImage(null)}
            aria-label={isRtl ? "إغلاق" : "Close"}
            className="absolute z-10 flex items-center justify-center w-11 h-11 text-white rounded-full right-3 top-3 sm:right-5 sm:top-5 bg-white/15 hover:bg-white/25 backdrop-blur-md"
            style={{ marginTop: "env(safe-area-inset-top)" }}
          >
            <X size={22} />
          </button>

          {/* Scroll area: tall menu pages scroll inside instead of shrinking to fit */}
          <div
            className="w-full h-full px-2 pt-16 pb-10 overflow-y-auto sm:px-6 overscroll-contain"
            style={{ touchAction: "pan-y pinch-zoom" }}
          >
            <img
              src={previewImage}
              alt="Menu Preview"
              onClick={(e) => e.stopPropagation()}
              className="block w-full h-auto max-w-4xl mx-auto rounded-lg shadow-2xl"
              style={{ imageRendering: "auto" }}
            />
            <p className="w-full mt-4 text-xs text-center text-zinc-500">
              {isRtl
                ? "اضغط خارج الصورة للإغلاق"
                : "Tap outside the image to close"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
