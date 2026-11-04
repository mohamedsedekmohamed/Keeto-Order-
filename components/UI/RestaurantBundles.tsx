"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Boxes,
  X,
  Plus,
  Minus,
  Loader2,
  FileText,
  AlertTriangle,
  Utensils,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useToken } from "@/context/TokenContext";
import useGet from "@/app/hooks/useGet";
import api from "@/api/api";
import { useAppDispatch } from "@/redux/hooks";
import { clearCartLocal } from "@/redux/cartSlice";
import { normalizeLang, localizedField, toImageSrc } from "@/lib/Localization";
import { AnimatePresence, motion } from "framer-motion";

// ─────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────

export interface BundleFoodItem {
  foodId: string;
  quantity: number;
  variations?: string | any[];
  name: string;
  nameAr?: string;
  nameFr?: string;
  image: string;
  price: number;
}

export interface BundleRestaurant {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
}

export interface BundleItem {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  description?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  image: string;
  price: number;
  startDate?: string;
  endDate?: string;
  restaurant?: BundleRestaurant;
  foods: BundleFoodItem[];
}

interface BundlesApiResponse {
  success: boolean;
  message?: string;
  data: BundleItem[];
}

interface RestaurantBundlesProps {
  restaurantId: string;
  firstColor?: string;
  textFirstColor?: string;
  onCartUpdated?: () => void;
}

export default function RestaurantBundles({
  restaurantId,
  firstColor,
  textFirstColor,
  onCartUpdated,
}: RestaurantBundlesProps) {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = (params?.slug as string) || "";
  const { t, language } = useLanguage();
  const lang = normalizeLang(language);
  const isRTL = lang === "ar";
  const { getToken } = useToken();
  const token = getToken(restaurantSlug);
  const dispatch = useAppDispatch();

  const accent = firstColor || "#facc15";
  const accentText = textFirstColor || "#111827";

  // 1. Fetch All Bundles for this restaurant: GET /api/user/bundles?restaurantId=${restaurantId}
  const { data: apiResponse, loading: fetchingBundles } = useGet(
    restaurantId ? `/api/user/bundles?restaurantId=${restaurantId}` : null,
  ) as { data: BundlesApiResponse | null; loading: boolean };

  // Defensively extract bundles array
  const rawData: any = apiResponse?.data;
  const bundles: BundleItem[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

  // Modal & Selection State
  const [selectedBundle, setSelectedBundle] = useState<BundleItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cart conflict state
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  const fulfillmentStorageKey = `fulfillment_choice_${restaurantSlug}`;
  const getStoredFulfillment = (): {
    mode: "delivery" | "takeaway";
    id: string;
  } | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(fulfillmentStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        (parsed.mode === "delivery" || parsed.mode === "takeaway") &&
        typeof parsed.id === "string" &&
        parsed.id
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Open modal and fetch bundle by ID: GET /api/user/bundles/{bundleId}?restaurantId=${restaurantId}
  const handleOpenBundle = async (bundle: BundleItem) => {
    setSelectedBundle(bundle);
    setQuantity(1);
    setNote("");
    setFormError(null);
    setLoadingDetail(true);

    try {
      const res = await api.get(
        `/api/user/bundles/${bundle.id}?restaurantId=${restaurantId}`,
      );
      const detail = res?.data?.data?.data || res?.data?.data || res?.data;
      if (detail && detail.id) {
        setSelectedBundle(detail);
      }
    } catch (err) {
      console.error("Error fetching bundle detail by ID:", err);
      // fallback to initial bundle item already set in state
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedBundle(null);
    setFormError(null);
    setLoadingDetail(false);
  };

  // Clear cart helper on conflict
  const handleClearCart = async () => {
    try {
      await api.delete("/api/user/cart");
      dispatch(clearCartLocal());
      localStorage.removeItem("cart-expiry");
    } catch (err) {
      console.error("Error clearing cart:", err);
      throw err;
    }
  };

  // Clear cart and retry adding the bundle
  const handleClearCartAndAdd = async () => {
    if (!pendingPayload || !selectedBundle) return;
    try {
      setSubmitting(true);
      await handleClearCart();
      await api.post(
        `/api/user/cart?offerId=${encodeURIComponent(selectedBundle.id)}`,
        pendingPayload,
      );
      const newExpiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("cart-expiry", newExpiry.toString());

      setShowConflictDialog(false);
      setPendingPayload(null);
      toast.success(t("addedToCart") || "Item added to cart successfully!");
      onCartUpdated?.();
      handleCloseModal();
    } catch (error) {
      console.error("Error updating cart after clear:", error);
      setFormError(
        isRTL ? "حدث خطأ أثناء تحديث السلة" : "Error updating cart",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Add to Cart
  const handleAddToCart = async () => {
    if (!token) {
      router.push(`/auth/sign-in/?callbackSlug=${restaurantSlug}`);
      return;
    }
    if (!selectedBundle) return;

    // Check stored fulfillment (delivery address or branch)
    const stored = getStoredFulfillment();
    const fulfillmentData: { addressId?: string; branchId?: string } = {};
    if (stored) {
      if (stored.mode === "delivery") fulfillmentData.addressId = stored.id;
      if (stored.mode === "takeaway") fulfillmentData.branchId = stored.id;
    }

    // Send bundleId in query param AND payload (omitting foodId as requested)
    const payload = {
      offerId: selectedBundle.id,
      restaurantId: restaurantId || selectedBundle.restaurant?.id,
      quantity,
      note: note.trim() || undefined,
      ...fulfillmentData,
    };

    try {
      setSubmitting(true);
      setFormError(null);

      await api.post(
        `/api/user/cart?offerId=${encodeURIComponent(selectedBundle.id)}`,
        payload,
      );

      const newExpiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("cart-expiry", newExpiry.toString());

      toast.success(t("addedToCart") || "Item added to cart successfully!");
      onCartUpdated?.();
      handleCloseModal();
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409) {
        setPendingPayload(payload);
        setShowConflictDialog(true);
      } else if (status === 401) {
        setFormError(t("loginFirst") || "Please login first");
        toast.error(t("loginFirst") || "Please login first");
      } else if (status === 400) {
        const rawMsg = error?.response?.data?.error?.message || "";
        setFormError(rawMsg || (isRTL ? "حدث خطأ ما، حاول مرة أخرى" : "Something went wrong"));
      } else {
        setFormError(isRTL ? "حدث خطأ ما، حاول مرة أخرى" : "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // If there are no bundles for this restaurant, render nothing
  if (!fetchingBundles && bundles.length === 0) {
    return null;
  }

  // Calculate pricing breakdown for current selected bundle
  const selectedOriginalTotal = (selectedBundle?.foods || []).reduce(
    (sum, f) => sum + (Number(f.price) || 0) * (Number(f.quantity) || 1),
    0,
  );
  const selectedBundlePrice = Number(selectedBundle?.price) || 0;
  const selectedSavings =
    selectedOriginalTotal > selectedBundlePrice
      ? selectedOriginalTotal - selectedBundlePrice
      : 0;

  return (
    <section className="px-4 pt-6 pb-2 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-2xl shadow-sm transition-transform hover:scale-105"
            style={{ backgroundColor: `${accent}20` }}
          >
            <Boxes size={22} style={{ color: accent }} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <span>{t("bundleOffers") || (isRTL ? "عروض الباقات" : "Bundle Offers")}</span>
              <span
                className="px-2 py-0.5 text-xs font-black rounded-full"
                style={{ backgroundColor: `${accent}25`, color: accent }}
              >
                {bundles.length}
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isRTL
                ? "وجبات متكاملة مجمعة بأسعار توفيرية حصرية"
                : "Curated combo meals with exclusive savings"}
            </p>
          </div>
        </div>
      </div>

      {/* Horizontally Scrollable Bundles Strip */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="mx-auto w-full max-w-[83rem] overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x snap-x snap-mandatory scroll-smooth pb-3 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-zinc-100 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 dark:[&::-webkit-scrollbar-track]:bg-zinc-800"
      >
        <div className="flex w-max min-w-full items-stretch justify-start gap-4 pb-1">
          {bundles.map((bundle) => {
            const name = localizedField(bundle, "name", lang) || bundle.name;
            const originalTotal = (bundle.foods || []).reduce(
              (sum, f) => sum + (Number(f.price) || 0) * (Number(f.quantity) || 1),
              0,
            );
            const bundlePrice = Number(bundle.price) || 0;
            const savings =
              originalTotal > bundlePrice ? originalTotal - bundlePrice : 0;

            return (
              <div
                key={bundle.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenBundle(bundle)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenBundle(bundle);
                  }
                }}
                className="shrink-0 snap-start w-[260px] sm:w-[290px] md:w-[310px] flex flex-col justify-between p-4 text-start transition-all duration-300 bg-white border shadow-sm hover:shadow-lg cursor-pointer dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-3xl active:scale-[0.99] group"
              >
                {/* Image & Badges */}
                <div className="relative w-full h-36 sm:h-40 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  {bundle.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={toImageSrc(bundle.image)}
                      alt={name}
                      className="absolute inset-0 object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Boxes size={42} style={{ color: accent }} />
                    </div>
                  )}

                  {/* Gradient shadow for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Bundle Badge */}
                  <div className="absolute top-2.5 start-2.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold shadow-md">
                    <Sparkles size={13} className="text-yellow-400" />
                    <span>{t("bundles") || (isRTL ? "باقة" : "Bundle")}</span>
                  </div>

                  {/* Savings Tag */}
                  {savings > 0 && (
                    <div className="absolute top-2.5 end-2.5 px-2.5 py-1 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1">
                      <span>{t("bundleSavings") || (isRTL ? "وفر" : "Save")}</span>
                      <span>{savings} E£</span>
                    </div>
                  )}

                  {/* Item count tag */}
                  <div className="absolute bottom-2.5 start-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold">
                    <Utensils size={12} className="text-zinc-300" />
                    <span>
                      {(bundle.foods || []).length}{" "}
                      {isRTL ? "أصناف" : "items"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black truncate text-zinc-900 dark:text-white group-hover:text-yellow-500 transition-colors">
                      {name}
                    </h3>

                    {/* Preview of included food names */}
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {(bundle.foods || [])
                        .map((f) => {
                          const fName = localizedField(f, "name", lang) || f.name;
                          return `${f.quantity}x ${fName}`;
                        })
                        .join(" • ")}
                    </p>
                  </div>

                  {/* Pricing & Add Button */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black" style={{ color: accent }}>
                          {bundlePrice} E£
                        </span>
                        {originalTotal > bundlePrice && (
                          <span className="text-xs line-through text-zinc-400 dark:text-zinc-500">
                            {originalTotal} E£
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBundle(bundle);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all duration-200 active:scale-95 hover:opacity-90"
                      style={{ backgroundColor: accent, color: accentText }}
                    >
                      <Plus size={15} strokeWidth={3} />
                      <span>{isRTL ? "إضافة" : "Add"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          Bundle Details Modal
      ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBundle && (
          <div
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                aria-label={t("close") || "Close"}
                className="absolute z-20 flex items-center justify-center w-9 h-9 text-white transition-all rounded-full top-3.5 end-3.5 bg-black/50 hover:bg-black/75 backdrop-blur-md active:scale-90"
              >
                <X size={19} />
              </button>

              {/* Header Image */}
              <div className="relative w-full h-52 sm:h-60 shrink-0 bg-zinc-100 dark:bg-zinc-800">
                {selectedBundle.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={toImageSrc(selectedBundle.image)}
                    alt={selectedBundle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Boxes size={56} style={{ color: accent }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Bundle Title and Savings over image */}
                <div className="absolute bottom-4 inset-x-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-yellow-400 text-zinc-950">
                      {t("bundles") || (isRTL ? "باقة خاصة" : "Special Bundle")}
                    </span>
                    {selectedSavings > 0 && (
                      <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-emerald-500 text-white">
                        {isRTL ? `وفر ${selectedSavings} E£` : `Save ${selectedSavings} E£`}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">
                    {localizedField(selectedBundle, "name", lang) || selectedBundle.name}
                  </h3>
                </div>
              </div>

              {/* Scrollable Body Content */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 [scrollbar-width:thin] flex-1">
                {/* Description if present */}
                {(selectedBundle.description || selectedBundle.descriptionAr) && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {localizedField(selectedBundle, "description", lang) ||
                      selectedBundle.description}
                  </p>
                )}

                {/* Validity Note */}
                {selectedBundle.endDate && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>
                      {isRTL ? "العرض سارٍ حتى: " : "Offer valid until: "}
                      {new Date(selectedBundle.endDate).toLocaleDateString(
                        lang === "ar" ? "ar-EG" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                )}

                {/* Included Foods Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Utensils size={18} style={{ color: accent }} />
                      <span>
                        {t("bundleIncludedItems") ||
                          (isRTL ? "الوجبات المشمولة في الباقة" : "Items included in this bundle")}
                      </span>
                    </h4>
                    <span className="text-xs font-bold text-zinc-400">
                      {(selectedBundle.foods || []).length} {isRTL ? "أصناف" : "items"}
                    </span>
                  </div>

                  {loadingDetail ? (
                    <div className="py-6 flex items-center justify-center text-zinc-400 gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-xs">{t("loading") || "Loading..."}</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(selectedBundle.foods || []).map((food, idx) => {
                        const foodName = localizedField(food, "name", lang) || food.name;
                        return (
                          <div
                            key={food.foodId || idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0">
                                {food.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={toImageSrc(food.image)}
                                    alt={foodName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                    <Utensils size={18} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                  {foodName}
                                </h5>
                                <span className="inline-block px-2 py-0.5 mt-0.5 text-[10px] font-black rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                  {isRTL ? `الكمية: ${food.quantity}` : `Qty: ${food.quantity}`}
                                </span>
                              </div>
                            </div>

                            <div className="text-end">
                              <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">
                                {food.price} E£
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Order Notes */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-zinc-400" />
                    <h5 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      {isRTL ? "ملاحظات على الباقة" : "Order Notes"}
                    </h5>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      isRTL
                        ? "مثال: بدون بصل، زيادة صوص..."
                        : "E.g. No onions, extra sauce..."
                    }
                    rows={2}
                    className="w-full p-3 text-sm text-zinc-800 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none resize-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  />
                </div>

                {/* Error Banner */}
                {formError && (
                  <p className="p-3 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40">
                    {formError}
                  </p>
                )}
              </div>

              {/* Modal Footer (Sticky) */}
              <div className="p-5 bg-white border-t border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 shadow-[0_-12px_30px_rgba(0,0,0,0.03)] shrink-0 space-y-3 z-10">
                <div className="flex items-center justify-between gap-4">
                  {/* Total Price Display */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                      {isRTL ? "السعر الإجمالي" : "Total Price"}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                        {(selectedBundlePrice * quantity).toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-yellow-500">E£</span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-3 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl shadow-inner">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex items-center justify-center w-8 h-8 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-700 rounded-xl transition-all shadow-sm active:scale-90"
                    >
                      <Minus size={15} strokeWidth={2.5} />
                    </button>
                    <span className="w-6 text-sm font-black text-center text-zinc-800 dark:text-zinc-100 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex items-center justify-center w-8 h-8 text-zinc-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-all shadow-md active:scale-90"
                    >
                      <Plus size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: accent, color: accentText }}
                >
                  {submitting ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={17} />
                  )}
                  <span>{t("addToCart") || (isRTL ? "إضافة إلى السلة" : "Add to Cart")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────
          Cart Conflict Confirmation Dialog
      ───────────────────────────────────────────── */}
      {showConflictDialog && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900/30">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {isRTL
                  ? "لديك منتجات من مطعم آخر في السلة. هل تريد تفريغ السلة وإضافة هذه الباقة؟"
                  : "You have items from another restaurant in your cart. Clear cart and add this bundle?"}
              </h3>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClearCartAndAdd}
                disabled={submitting}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin inline-block" />
                ) : isRTL ? (
                  "نعم، تفريغ وإضافة"
                ) : (
                  "Yes, Clear & Add"
                )}
              </button>
              <button
                onClick={() => {
                  setShowConflictDialog(false);
                  setPendingPayload(null);
                }}
                disabled={submitting}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

