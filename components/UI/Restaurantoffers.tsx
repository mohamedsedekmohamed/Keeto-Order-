"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BadgePercent,
  X,
  Plus,
  Minus,
  Loader2,
  FileText,
  MapPin,
  Store,
  Truck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useToken } from "@/context/TokenContext";
import useGet from "@/app/hooks/useGet";
import api from "@/api/api";
import { useAppDispatch } from "@/redux/hooks";
import { clearCartLocal } from "@/redux/cartSlice";
import { normalizeLang, localizedField, toImageSrc } from "@/lib/Localization";

// ─────────────────────────────────────────────
// Restaurant Offers section
// GET /api/user/offers/restaurant/{restaurantId}/offers
//
// - 0 offers  → renders nothing
// - 1 offer   → shown inline as a single featured card, under the slider
// - 2+ offers → shown as a horizontally-scrollable strip of cards
// Clicking any card (single or from the strip) opens a detail popup with
// the localized name/description, price + discount, any required
// variations/addons, a quantity stepper, and an Add to cart button.
//
// Colors (firstColor/textFirstColor) are passed in from
// useRestaurantSettings() by the parent page, same as the rest of the app.
// ─────────────────────────────────────────────

interface VariationOption {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  price?: number;
}

interface Variation {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  isRequired?: boolean;
  multiple?: boolean;
  options: VariationOption[];
}

interface AddonOption {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  price?: number;
}

interface OfferItem {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  price: number;
  discountType: "amount" | "percentage";
  discountValue: number;
  discountPrice: number;
  discountNote?: string;
  image: string;
  isOutOfStock?: boolean;
  unavailableBranches?: string[];
  category?: { id: string; name: string; nameAr: string; nameFr: string };
  subcategory?: { id: string; name: string; nameAr: string; nameFr: string };
  // The sample payload sends `{}` when there are none — normalized below.
  variations?: Variation[] | Record<string, any>;
  addons?: AddonOption[] | Record<string, any>;
}

interface OffersApiResponse {
  success: boolean;
  message: string;
  data: OfferItem[];
}

// The API sends `{}` (no entries) instead of `[]` for variations/addons on
// items that don't have any — normalize both shapes into a plain array.
// NOTE: the *shape* of a populated variation/addon (fields, required flag,
// options list) is inferred from context elsewhere in the app; if the real
// payload differs, adjust this function rather than the rendering below.
function normalizeList<T>(raw: T[] | Record<string, any> | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const values = Object.values(raw);
  if (values.length === 0) return [];
  return values as T[];
}

interface RestaurantOffersProps {
  restaurantId: string;
  firstColor?: string;
  textFirstColor?: string;
  onCartUpdated?: () => void;
}

export default function RestaurantOffers({
  restaurantId,
  firstColor,
  textFirstColor,
  onCartUpdated,
}: RestaurantOffersProps) {
  const params = useParams();
  const router = useRouter();
  const restaurantSlug = params.slug as string;
  const { t, language } = useLanguage();
  const lang = normalizeLang(language);
  const { getToken } = useToken();
  const token = getToken(restaurantSlug);
  const dispatch = useAppDispatch();

  const { data } = useGet(
    restaurantId ? `/api/user/offers/restaurant/${restaurantId}/offers` : null,
  ) as { data: OffersApiResponse | null };

  const offers: OfferItem[] = data?.data ?? [];

  const getOrderSource = () => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem(`login_source_${restaurantSlug}`) ||
        "online_order_web"
      );
    }
    return "online_order_web";
  };

  const fulfillmentStorageKey = `fulfillment_choice_${restaurantSlug}`;

  const getStoredFulfillment = (): {
    mode: "delivery" | "takeaway";
    id: string;
  } | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(fulfillmentStorageKey);
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

  const setStoredFulfillment = (mode: "delivery" | "takeaway", id: string) => {
    if (typeof window === "undefined" || !id) return;
    localStorage.setItem(fulfillmentStorageKey, JSON.stringify({ mode, id }));
  };

  const clearStoredFulfillment = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(fulfillmentStorageKey);
  };

  const { data: checkoutData } = useGet<any>(
    restaurantId
      ? `/api/user/order/select?restaurantId=${restaurantId}&orderSource=${getOrderSource()}`
      : null,
  );

  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);

  const selectData = checkoutData?.data?.data;
  const allAddresses = useMemo(() => selectData?.addresses || [], [selectData]);
  const deliverableAddresses = useMemo(
    () => allAddresses.filter((addr: any) => addr.isDeliverable),
    [allAddresses],
  );

  const availableBranches = useMemo(() => {
    const unavailableIds: string[] = selectedOffer?.unavailableBranches || [];
    return (selectData?.branches || []).filter(
      (branch: any) =>
        branch.status === "active" && !unavailableIds.includes(branch.id),
    );
  }, [selectData, selectedOffer]);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariationOptions, setSelectedVariationOptions] = useState<
    Record<string, string[]>
  >({});
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingCartPayload, setPendingCartPayload] = useState<any | null>(
    null,
  );
  const [showFulfillmentDialog, setShowFulfillmentDialog] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<
    "delivery" | "takeaway" | null
  >(null);
  const [selectedFulfillmentId, setSelectedFulfillmentId] =
    useState<string>("");

  const accent = firstColor || "#facc15";
  const accentText = textFirstColor || "#111827";

  if (offers.length === 0) return null;

  const openOfferDetail = (offer: OfferItem) => {
    if ((offer as any).isOutOfStock) {
      toast.error(
        lang === "ar"
          ? "هذا المنتج غير متوفر حاليًا"
          : "This item is out of stock",
      );
      return;
    }

    setSelectedOffer(offer);
    setQuantity(1);
    setSelectedVariationOptions({});
    setSelectedAddonIds([]);
    setNote("");
    setFormError(null);
  };

  const closeOfferDetail = () => setSelectedOffer(null);

  const variations = normalizeList<Variation>(selectedOffer?.variations);
  const addons = normalizeList<AddonOption>(selectedOffer?.addons);

  const toggleVariationOption = (variation: Variation, optionId: string) => {
    setSelectedVariationOptions((prev) => {
      const current = prev[variation.id] || [];
      if (variation.multiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [variation.id]: next };
      }
      // single-select behaves like a radio group
      return { ...prev, [variation.id]: [optionId] };
    });
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId],
    );
  };

  const handleClearCart = async () => {
    try {
      await api.delete("/api/user/cart");
      dispatch(clearCartLocal());
      localStorage.removeItem("cart-expiry");
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleClearCartAndAdd = async () => {
    if (!pendingCartPayload) return;

    try {
      setSubmitting(true);
      await handleClearCart();
      await api.post("/api/user/cart", pendingCartPayload);
      const newExpiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("cart-expiry", newExpiry.toString());

      setShowConflictDialog(false);
      setPendingCartPayload(null);
      onCartUpdated?.();
      setSelectedOffer(null);
      setShowFulfillmentDialog(false);
      setFulfillmentMode(null);
      setSelectedFulfillmentId("");

      if (pendingCartPayload.addressId) {
        setStoredFulfillment("delivery", pendingCartPayload.addressId);
      } else if (pendingCartPayload.branchId) {
        setStoredFulfillment("takeaway", pendingCartPayload.branchId);
      }
    } catch (error) {
      console.error(error);
      setFormError(
        lang === "ar" ? "حدث خطأ أثناء تحديث السلة" : "Error updating cart",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const executeAddToCart = async (
    fulfillmentData: { addressId?: string; branchId?: string } = {},
  ) => {
    if (!selectedOffer) return;

    if (selectedOffer.isOutOfStock) {
      setFormError(
        lang === "ar"
          ? "هذا المنتج غير متوفر حاليًا"
          : "This item is out of stock",
      );
      return;
    }

    const variations = Object.entries(selectedVariationOptions).flatMap(
      ([vId, optIds]) =>
        optIds.map((oId) => ({ variationId: vId, optionId: oId })),
    );

    const addons = (selectedOffer.addons || [])
      .filter((addon: AddonOption) => selectedAddonIds.includes(addon.id))
      .map((addon: AddonOption) => ({
        addonId: addon.id,
        name: addon.name,
        price: addon.price ?? 0,
      }));

    const payload = {
      restaurantId,
      foodId: selectedOffer.id,
      quantity,
      note,
      variations,
      addons,
      isOffer: true,
      discountPrice: selectedOffer.discountPrice,
      ...fulfillmentData,
    };

    try {
      setSubmitting(true);
      await api.post("/api/user/cart", payload);
      const newExpiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("cart-expiry", newExpiry.toString());

      setSelectedOffer(null);
      setShowFulfillmentDialog(false);
      setFulfillmentMode(null);
      setSelectedFulfillmentId("");
      setFormError(null);
      onCartUpdated?.();

      if (fulfillmentData.addressId) {
        setStoredFulfillment("delivery", fulfillmentData.addressId);
      } else if (fulfillmentData.branchId) {
        setStoredFulfillment("takeaway", fulfillmentData.branchId);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409) {
        setPendingCartPayload(payload);
        setShowConflictDialog(true);
      } else if (status === 400) {
        const rawMsg = error?.response?.data?.error?.message || "";
        const errorMsg =
          lang === "ar"
            ? rawMsg?.toLowerCase().includes("unavailable")
              ? "هذا المنتج غير متوفر حاليًا في الفرع المحدد."
              : "حدث خطأ ما، حاول مرة أخرى"
            : rawMsg || "Something went wrong";
        setFormError(errorMsg);
      } else if (status === 401) {
        setFormError(t("loginFirst") || "Please login first");
      } else if (error?.response) {
        setFormError(
          lang === "ar" ? "حدث خطأ ما، حاول مرة أخرى" : "Something went wrong",
        );
      } else {
        setFormError(
          lang === "ar"
            ? "تحقق من الاتصال بالإنترنت"
            : "Check your internet connection",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      router.push(`/auth/sign-in/?callbackSlug=${restaurantSlug}`);
      return;
    }
    if (!selectedOffer) return;

    if (selectedOffer.isOutOfStock) {
      setFormError(
        lang === "ar"
          ? "هذا المنتج غير متوفر حاليًا"
          : "This item is out of stock",
      );
      return;
    }

    const missingRequiredVariation = variations.some(
      (variation) =>
        variation.isRequired &&
        (selectedVariationOptions[variation.id] || []).length === 0,
    );
    if (missingRequiredVariation) {
      setFormError(
        lang === "ar"
          ? "يرجى اختيار جميع الخيارات المطلوبة"
          : "Please select all required options",
      );
      return;
    }

    if (
      selectedOffer.unavailableBranches &&
      selectedOffer.unavailableBranches.length > 0
    ) {
      const stored = getStoredFulfillment();
      if (stored) {
        if (
          stored.mode === "delivery" &&
          deliverableAddresses.some((a: any) => a.id === stored.id)
        ) {
          await executeAddToCart({ addressId: stored.id });
          return;
        }
        if (
          stored.mode === "takeaway" &&
          availableBranches.some((b: any) => b.id === stored.id)
        ) {
          await executeAddToCart({ branchId: stored.id });
          return;
        }
        clearStoredFulfillment();
      }

      setShowFulfillmentDialog(true);
      return;
    }

    await executeAddToCart();
  };

  return (
    <section className="px-4 pt-5 pb-1">
      <div className="flex items-center gap-2 mb-3">
        <BadgePercent size={20} style={{ color: accent }} />
        <h2 className="text-lg font-black text-zinc-900 dark:text-white">
          {t("offers") || "Offers"}
        </h2>
      </div>

      {offers.length === 1 ? (
        <OfferCard
          offer={offers[0]}
          lang={lang}
          accent={accent}
          accentText={accentText}
          featured
          onClick={() => openOfferDetail(offers[0])}
        />
      ) : (
        <div className="flex gap-3 pb-2 overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {offers.map((offer) => (
            <div key={offer.id} className="shrink-0 w-32 snap-start">
              <OfferCard
                offer={offer}
                lang={lang}
                accent={accent}
                accentText={accentText}
                onClick={() => openOfferDetail(offer)}
              />
            </div>
          ))}
        </div>
      )}

      {showConflictDialog && (
        <div className="fixed inset-0 z-[1110] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900/30">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {lang === "ar"
                  ? "هل أنت متأكد من رغبتك في إضافة هذا المنتج إلى السلة؟"
                  : "Are you sure you want to add this item to the cart ?"}
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
                ) : lang === "ar" ? (
                  "نعم، متأكد"
                ) : (
                  "Yes, Sure"
                )}
              </button>
              <button
                onClick={() => {
                  setShowConflictDialog(false);
                  setPendingCartPayload(null);
                }}
                disabled={submitting}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 font-bold py-3 rounded-xl transition-all active:scale-[0.98] border border-zinc-200/40 dark:border-zinc-700/30"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFulfillmentDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 overflow-y-auto overscroll-contain max-h-[90vh] [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.300)_transparent] dark:[scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {lang === "ar" ? "طريقة الاستلام" : "Fulfillment Method"}
              </h3>
              <p className="text-sm text-zinc-500">
                {lang === "ar"
                  ? "يرجى تحديد طريقة استلام هذا الطلب."
                  : "Please select how you want to receive this item."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: "delivery" as const,
                  label: lang === "ar" ? "توصيل" : "Delivery",
                  icon: Truck,
                },
                {
                  id: "takeaway" as const,
                  label: lang === "ar" ? "استلام من الفرع" : "Takeaway",
                  icon: Store,
                },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setFulfillmentMode(mode.id);
                    setSelectedFulfillmentId("");
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    fulfillmentMode === mode.id
                      ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      : "border-zinc-100 dark:border-zinc-800 text-zinc-500"
                  }`}
                >
                  <mode.icon size={24} />
                  <span className="text-xs font-bold">{mode.label}</span>
                </button>
              ))}
            </div>

            {fulfillmentMode === "delivery" && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {lang === "ar" ? "اختر العنوان" : "Select Address"}
                  </label>
                </div>
                <div className="space-y-3 max-h-[45vh] overflow-y-auto overscroll-contain pr-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.300)_transparent] dark:[scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {allAddresses.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
                      <p className="text-xs font-semibold text-zinc-500">
                        {lang === "ar"
                          ? "لا يوجد عناوين محفوظة"
                          : "No saved addresses yet"}
                      </p>
                    </div>
                  ) : (
                    allAddresses.map((addr: any) => (
                      <div
                        key={addr.id}
                        onClick={() =>
                          addr.isDeliverable &&
                          setSelectedFulfillmentId(addr.id)
                        }
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                          addr.isDeliverable
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-80"
                        } ${
                          selectedFulfillmentId === addr.id
                            ? addr.isDeliverable
                              ? "border-yellow-400 bg-white dark:bg-zinc-900"
                              : "border-red-400 bg-red-50 dark:bg-red-950/20"
                            : "border-zinc-100 dark:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl mt-1">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {addr.title}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {addr.street}
                              {addr.number ? `, ${addr.number}` : ""}
                            </p>
                            {!addr.isDeliverable && (
                              <div className="flex items-center gap-1 mt-2 text-red-500">
                                <AlertCircle size={14} />
                                <p className="text-xs font-bold">
                                  {lang === "ar"
                                    ? "المطعم لا يوصل لهذا العنوان"
                                    : "Delivery unavailable for this address"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedFulfillmentId === addr.id &&
                          addr.isDeliverable && (
                            <CheckCircle2
                              size={20}
                              className="text-yellow-500 shrink-0"
                            />
                          )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {fulfillmentMode === "takeaway" && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-3">
                  {lang === "ar" ? "اختر الفرع" : "Select Branch"}
                </label>
                <div className="space-y-3 max-h-[45vh] overflow-y-auto overscroll-contain pr-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.300)_transparent] dark:[scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {availableBranches.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
                      <p className="text-xs font-semibold text-red-500">
                        {lang === "ar"
                          ? "هذا المنتج غير متاح فى أى فرع حالياً"
                          : "This item isn't available for pickup at any branch right now"}
                      </p>
                    </div>
                  ) : (
                    availableBranches.map((branch: any) => (
                      <div
                        key={branch.id}
                        onClick={() => setSelectedFulfillmentId(branch.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          selectedFulfillmentId === branch.id
                            ? "border-yellow-400 bg-white dark:bg-zinc-900"
                            : "border-zinc-100 dark:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl mt-1">
                            <Store size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {lang === "ar" && branch.nameAr
                                ? branch.nameAr
                                : branch.name}
                            </p>
                            {branch.address && (
                              <p className="text-xs text-zinc-500">
                                {branch.address}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedFulfillmentId === branch.id && (
                          <CheckCircle2
                            size={20}
                            className="text-yellow-500 shrink-0"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  const fulfillmentData =
                    fulfillmentMode === "delivery"
                      ? { addressId: selectedFulfillmentId }
                      : { branchId: selectedFulfillmentId };

                  executeAddToCart(fulfillmentData);
                }}
                disabled={submitting || !selectedFulfillmentId}
                className="flex-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin inline-block" />
                ) : lang === "ar" ? (
                  "تأكيد"
                ) : (
                  "Confirm"
                )}
              </button>
              <button
                onClick={() => {
                  setShowFulfillmentDialog(false);
                  setFulfillmentMode(null);
                  setSelectedFulfillmentId("");
                }}
                disabled={submitting}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 font-bold py-3 rounded-xl transition-all border border-zinc-200/40 dark:border-zinc-700/30"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOffer && (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/70 backdrop-blur-md transition-all duration-500 animate-in fade-in"
          onClick={closeOfferDetail}
        >
          <div
            className="relative w-full max-w-xl overflow-hidden bg-white dark:bg-zinc-900 border-t sm:border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-500 ease-out overscroll-behavior-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none">
              <button
                onClick={closeOfferDetail}
                className="pointer-events-auto p-2.5 rounded-full shadow-lg bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700 backdrop-blur-md text-zinc-800 dark:text-zinc-100 transition-all active:scale-90 hover:scale-105"
                aria-label={t("close") || "Close"}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="relative w-full h-56 sm:h-72 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              {selectedOffer.image ? (
                <img
                  src={toImageSrc(selectedOffer.image)}
                  alt={localizedField(selectedOffer, "name", lang)}
                  className="object-cover w-full h-full transform transition-transform duration-[1000ms] ease-out hover:scale-105 will-change-transform"
                  style={{
                    imageRendering: "-webkit-optimize-contrast",
                    transform: "translate3d(0,0,0)",
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900 via-zinc-950/10 to-black/20 pointer-events-none" />
            </div>

            <div
              className="flex-1 px-6 pb-8 overflow-y-auto space-y-6 scroll-smooth overscroll-contain"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)",
              }}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `div::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }`,
                }}
              />

              <div className="pt-4 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {localizedField(selectedOffer, "name", lang)}
                  </h2>
                  <div className="text-left shrink-0 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/40">
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-yellow-500">
                          {selectedOffer.discountPrice}
                        </span>
                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                          E£
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-zinc-400 line-through dark:text-zinc-500">
                          {selectedOffer.price} E£
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-black text-white bg-red-500 rounded-md">
                          {selectedOffer.discountValue}
                          {selectedOffer.discountType === "percentage"
                            ? "%"
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {localizedField(selectedOffer, "description", lang) && (
                  <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50/40 dark:bg-zinc-800/10 p-3.5 rounded-2xl border border-zinc-100/50 dark:border-zinc-800/20">
                    {localizedField(selectedOffer, "description", lang)}
                  </p>
                )}
              </div>

              {variations.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
                  {variations.map((variation) => (
                    <div
                      key={`variation-${variation.id}`}
                      className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                            {localizedField(variation, "name", lang)}
                          </h4>
                          {variation.isRequired && (
                            <span className="px-2 py-0.5 text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100/40 dark:border-red-900/30">
                              {lang === "ar" ? "مطلوب" : "Required"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/10">
                          {variation.multiple
                            ? lang === "ar"
                              ? "اختياري"
                              : "Optional"
                            : lang === "ar"
                              ? "اختر واحد"
                              : "Select One"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {variation.options.map((option) => {
                          const isSelected = (
                            selectedVariationOptions[variation.id] || []
                          ).includes(option.id);

                          return (
                            <div
                              key={`option-${option.id}`}
                              onClick={() =>
                                toggleVariationOption(variation, option.id)
                              }
                              className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-300 ease-out select-none active:scale-[0.99] group ${
                                isSelected
                                  ? "border-yellow-400 bg-yellow-50/20 dark:bg-yellow-400/5 shadow-md shadow-yellow-400/5 ring-1 ring-yellow-400"
                                  : "border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                              }`}
                            >
                              <div className="flex items-center gap-3.5">
                                <input
                                  type={
                                    variation.multiple ? "checkbox" : "radio"
                                  }
                                  name={variation.id}
                                  checked={isSelected}
                                  readOnly
                                  className="w-5 h-5 accent-yellow-400 rounded-full border-zinc-300 dark:border-zinc-700 transition-transform duration-200 group-hover:scale-105"
                                />
                                <span
                                  className={`text-sm transition-all duration-200 ${
                                    isSelected
                                      ? "font-black text-zinc-950 dark:text-zinc-50"
                                      : "font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                                  }`}
                                >
                                  {localizedField(option, "name", lang)}
                                </span>
                              </div>
                              {!!option.price && (
                                <span
                                  className={`text-xs font-black px-2.5 py-1 rounded-xl transition-all duration-300 ${
                                    isSelected
                                      ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100/40 dark:bg-yellow-400/10 scale-105"
                                      : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-850"
                                  }`}
                                >
                                  + {option.price} E£
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {addons.length > 0 && (
                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                      {lang === "ar" ? "الإضافات" : "Add-ons"}
                    </h4>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {lang === "ar" ? "اختياري" : "Optional"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {addons.map((addon) => (
                      <label
                        key={addon.id}
                        className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-300 ease-out select-none active:scale-[0.99] group ${
                          selectedAddonIds.includes(addon.id)
                            ? "border-yellow-400 bg-yellow-50/20 dark:bg-yellow-400/5 shadow-md shadow-yellow-400/5 ring-1 ring-yellow-400"
                            : "border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <input
                            type="checkbox"
                            checked={selectedAddonIds.includes(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                            className="w-5 h-5 accent-yellow-400 rounded-lg border-zinc-300 dark:border-zinc-700 transition-transform duration-200 group-hover:scale-105"
                          />
                          <span
                            className={`text-sm transition-all duration-200 ${
                              selectedAddonIds.includes(addon.id)
                                ? "font-black text-zinc-950 dark:text-zinc-50"
                                : "font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                            }`}
                          >
                            {localizedField(addon, "name", lang)}
                          </span>
                        </div>
                        {!!addon.price && (
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-xl transition-all duration-300 ${
                              selectedAddonIds.includes(addon.id)
                                ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100/40 dark:bg-yellow-400/10 scale-105"
                                : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-850"
                            }`}
                          >
                            + {addon.price} E£
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                <div className="flex items-center gap-2 mb-3">
                  <FileText
                    size={18}
                    className="text-zinc-400 dark:text-zinc-500"
                  />
                  <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                    {lang === "ar" ? "ملاحظات الطلب" : "Order Notes"}
                  </h4>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    lang === "ar"
                      ? "مثال: بدون بصل، زيادة صوص..."
                      : "E.g. No onions, extra sauce..."
                  }
                  rows={3}
                  className="w-full p-4 text-sm text-zinc-800 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl outline-none resize-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200"
                />
              </div>

              {formError && (
                <p className="mb-3 text-sm font-medium text-red-500">
                  {formError}
                </p>
              )}
            </div>

            <div className="p-6 bg-white border-t border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 shadow-[0_-12px_30px_rgba(0,0,0,0.03)] shrink-0 space-y-4 z-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                    {lang === "ar" ? "الإجمالي النهائي" : "Total Price"}
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight transition-all duration-300 transform">
                      {(selectedOffer.discountPrice * quantity).toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-bold text-yellow-500 ${lang === "ar" ? "mr-1" : "ml-1"}`}
                    >
                      E£
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/10 rounded-2xl shadow-inner">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex items-center justify-center w-9 h-9 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-700 hover:bg-zinc-50 rounded-xl transition-all shadow-sm active:scale-90"
                  >
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <span className="w-6 text-base font-black text-center text-zinc-800 dark:text-zinc-100 tabular-nums animate-in fade-in zoom-in-75 duration-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex items-center justify-center w-9 h-9 text-zinc-900 dark:text-zinc-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-all shadow-md active:scale-90"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={submitting}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:hover:bg-yellow-400 text-zinc-950 disabled:text-zinc-400 font-black text-base py-4 rounded-2xl shadow-xl shadow-yellow-400/10 hover:shadow-yellow-400/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{ backgroundColor: accent, color: accentText }}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {t("addToCart") || "Add to cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// Single offer card, used both as the lone "featured" card (1 offer) and
// as an item in the horizontally-scrolling strip (2+ offers).
// ─────────────────────────────────────────────
function OfferCard({
  offer,
  lang,
  accent,
  accentText,
  featured,
  onClick,
}: {
  offer: OfferItem;
  lang: "ar" | "fr" | "en";
  accent: string;
  accentText: string;
  featured?: boolean;
  onClick: () => void;
}) {
  const name = localizedField(offer, "name", lang);
  const offerName = offer.subcategory
    ? localizedField(offer.subcategory, "name", lang)
    : name;

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden text-left transition-transform bg-white border shadow-sm dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-2xl active:scale-[0.98] aspect-square ${
        featured ? "w-40" : "w-full"
      }`}
    >
      {offer.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={toImageSrc(offer.image)}
          alt={name}
          className="absolute inset-0 object-cover w-full h-full"
        />
      )}

      {/* Bottom gradient so the badge/price stay readable over any photo */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
        <span className="inline-flex items-center gap-1 px-2 py-1 mb-1 text-[10px] font-bold rounded-lg bg-green-50 text-green-600">
          <BadgePercent size={12} />
          {offer.discountValue}
          {offer.discountType === "percentage" ? "%" : ""}
        </span>
        {offerName && (
          <h3 className="text-xs font-bold text-white truncate">{offerName}</h3>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs line-through text-zinc-300">
            {offer.price}
          </span>
          <span className="text-sm font-black text-white">
            {offer.discountPrice}
          </span>
        </div>
      </div>
    </button>
  );
}
