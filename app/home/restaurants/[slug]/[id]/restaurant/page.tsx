"use client";

import RestaurantCard from "@/components/UI/RestaurantCard";
import RestaurantHeader from "@/components/UI/RestaurantHeader";
import RestaurantItms from "@/components/UI/RestaurantItms";
import Link from "next/link";
import { ShoppingBasket, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  useRestaurant,
  useMenu,
  useRestaurantSettings,
} from "@/context/RestaurantContext";
import { useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useRef, useState } from "react";
import { setCartItems } from "@/redux/cartSlice";
import { useToken } from "@/context/TokenContext";
import { setRestaurantId } from "@/context/Restaurantid";
import useGet from "@/app/hooks/useGet";

import api from "@/api/api";
import LogoNav from "@/components/LogoNav";
import NewKeetaLogo from "@/public/PicWhite.jpeg";

// ─────────────────────────────────────────────
// Restaurant Promo Popup
// GET /api/user/popup/{restaurantId} — shown once per browser session per
// restaurant. Uses sessionStorage (not localStorage) so it reappears on a
// fresh visit/tab but never twice within the same session once dismissed.
// ─────────────────────────────────────────────

interface RestaurantPopup {
  id: string;
  Title: string;
  TitleAr: string;
  TitleFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  image: string;
  imageAr: string;
  imageFr: string;
  type: string;
  startDate: string;
  endDate: string;
}

interface PopupApiResponse {
  success: boolean;
  data: {
    message: string;
    data: RestaurantPopup[];
  };
}

function getLocalizedPopupField(
  popup: RestaurantPopup,
  field: "Title" | "description" | "image",
  lang: "ar" | "fr" | "en",
) {
  if (lang === "ar")
    return popup[`${field}Ar` as keyof RestaurantPopup] || popup[field];
  if (lang === "fr")
    return popup[`${field}Fr` as keyof RestaurantPopup] || popup[field];
  return popup[field];
}

// useLanguage()'s `language` isn't an ISO code here — elsewhere in the app
// it's compared as `language === "العربية"` (a display name, not "ar").
// Normalize whatever it gives us (display name or code) into "ar" | "fr" | "en"
// so the popup picks the right localized fields instead of always falling
// back to English.
function normalizeLang(rawLang: string | undefined | null): "ar" | "fr" | "en" {
  const value = (rawLang || "").trim().toLowerCase();
  if (rawLang === "العربية" || value === "ar" || value === "arabic")
    return "ar";
  if (
    value === "fr" ||
    value === "french" ||
    value === "français" ||
    value === "francais"
  )
    return "fr";
  return "en";
}

// Popup images may come back as raw base64 or as a ready-to-use URL/data
// URI — normalize so <img src> always gets something renderable.
function toImageSrc(value?: string) {
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("http")) return value;
  return `data:image/png;base64,${value}`;
}

export default function Restaurant() {
  const params = useParams();
  const { t, language } = useLanguage();
  const dispatch = useAppDispatch();
  const restaurantName = params.slug as string;
  const basePath = `/home/restaurants/${restaurantName}`;
  const { getToken, isReady } = useToken();
  const token = getToken(restaurantName);
  const cartItems = useAppSelector((state: any) => state.cart.items);

  // Local state to track dynamic cart animation burst
  const [isAnimate, setIsAnimate] = useState(false);

  // Tracks which restaurant is *currently* being viewed, read at the
  // moment a cart response comes back — not at the moment the request
  // was fired. Without this, switching restaurants quickly can let a
  // slow response for the restaurant you already left resolve *after*
  // the new restaurant's (faster) response, silently overwriting the
  // correct cart with stale data. Every dispatch checks this ref first
  // and drops the response if it's no longer for the active restaurant.
  const activeRestaurantRef = useRef(restaurantName);
  activeRestaurantRef.current = restaurantName;

  const fetchCart = async () => {
    const requestedFor = restaurantName;
    try {
      const res = await api.get("/api/user/cart");
      if (activeRestaurantRef.current !== requestedFor) return; // stale response, ignore
      if (res?.data?.data?.data) {
        dispatch(setCartItems(res.data.data.data));
      }
    } catch (err) {
      if (activeRestaurantRef.current !== requestedFor) return; // stale error, ignore
      console.error("Error fetching cart:", err);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    const token = getToken(restaurantName);
    if (!token) {
      // No token for this restaurant (e.g. never signed in here) — clear
      // out whatever cart was left over from a previously viewed
      // restaurant so the button doesn't show a stale count.
      dispatch(setCartItems([]));
      return;
    }
    fetchCart();
    // restaurantName must be a dependency: this component instance is
    // reused across client-side navigations between
    // /home/restaurants/[slug] pages, so without it this effect only
    // ever runs once (when isReady first flips true) and never refetches
    // when the user navigates to a different restaurant's page.
  }, [isReady, restaurantName]);

  const { restaurant, isLoading: restaurantLoading } = useRestaurant();
  const { menu, isLoading: menuLoading } = useMenu();
  const { firstColor, textFirstColor } = useRestaurantSettings();

  // Active promo popup for this restaurant. Skips the request until we
  // actually have a restaurant id to avoid firing on "/api/user/popup/undefined".
  const { data: popupResponse } = useGet(
    restaurant?.id ? `/api/user/popup/${restaurant.id}` : null,
  ) as { data: PopupApiResponse | null };

  const activePopup: RestaurantPopup | null =
    popupResponse?.data?.data?.[0] ?? null;

  const [showPromoPopup, setShowPromoPopup] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !activePopup) return;
    const dismissedKey = `promo_popup_dismissed_${activePopup.id}`;
    const alreadyDismissed = sessionStorage.getItem(dismissedKey);
    if (!alreadyDismissed) {
      setShowPromoPopup(true);
    }
  }, [activePopup?.id]);

  const handleClosePromoPopup = () => {
    if (activePopup && typeof window !== "undefined") {
      sessionStorage.setItem(`promo_popup_dismissed_${activePopup.id}`, "1");
    }
    setShowPromoPopup(false);
  };

  const lang = normalizeLang(language);
  const popupTitle = activePopup
    ? getLocalizedPopupField(activePopup, "Title", lang)
    : "";
  const popupDescription = activePopup
    ? getLocalizedPopupField(activePopup, "description", lang)
    : "";
  const popupImage = activePopup
    ? toImageSrc(getLocalizedPopupField(activePopup, "image", lang))
    : "";

  // ✅ Extract the actual items array safely, handling both direct arrays and nested cart objects
  const rawItemsArray = Array.isArray(cartItems)
    ? cartItems
    : Array.isArray(cartItems?.cartItems)
      ? cartItems.cartItems
      : Array.isArray(cartItems?.items)
        ? cartItems.items
        : [];

  // 🔒 /api/user/cart returns the user's cart across ALL restaurants (each
  // item is tagged with its own restaurantId/restaurantName — see
  // CartItem in cartSlice.ts). The button on this page must only reflect
  // items belonging to the restaurant currently being viewed, so filter
  // by restaurant.id before counting. Without this, the badge sums the
  // user's entire cross-restaurant cart and looks "stuck" when switching
  // restaurants, since the underlying array doesn't change — only which
  // slice of it is relevant does.
  const actualItemsArray = restaurant?.id
    ? rawItemsArray.filter((item: any) => item?.restaurantId === restaurant.id)
    : [];

  // ✅ عدد المنتجات المختلفة فى السلة (صفوف السلة) — مش مجموع الكميات، عشان
  // لو أضفت نفس المنتج تانى بيزود quantity بس مش بيضيف صف جديد، فالرقم على
  // الزرار مايتغيّرش.
  const totalItems = actualItemsArray.length;

  // Trigger pop & pulse feedback ripple whenever item counter updates upward
  useEffect(() => {
    if (totalItems > 0) {
      setIsAnimate(true);
      const timer = setTimeout(() => setIsAnimate(false), 600); // Animation duration match window
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  // Persist this restaurant's real DB id (UUID), keyed by its slug — so
  // other pages (profile, checkout, etc.) can look it up via the same
  // slug without re-fetching the whole restaurant payload. Keying by slug
  // matters here: a different restaurant visited later must not overwrite
  // this one's stored id.
  useEffect(() => {
    if (restaurant?.id) {
      setRestaurantId(restaurantName, restaurant.id);
    }
  }, [restaurant?.id, restaurantName]);

  if (restaurantLoading || menuLoading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-yellow-500 bg-white dark:bg-black">
        {t("loading")}
      </div>
    );
  }

  if (!restaurant) {
    return <div className="p-8 text-center">{t("no-restaurant")}</div>;
  }

  return (
    <div className="relative w-full min-h-screen pb-24 font-sans bg-white dark:bg-black">
      {/* <LogoNav logo={NewKeetaLogo} /> */}
      <RestaurantHeader cover={restaurant.cover} />
      <RestaurantCard restaurant={restaurant} />
      <RestaurantItms
        menu={menu ?? []}
        restaurantId={restaurant?.id ?? ""}
        onCartUpdated={fetchCart}
      />

      {/* زر السلة العائم المطور مع مؤثرات إضافة ذكية */}
      {token && (
        <Link
          href={`${basePath}/order`}
          className={`fixed bottom-8 left-8 z-[90] flex items-center gap-3 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group select-none
            ${
              isAnimate
                ? "scale-110 shadow-yellow-400/60 ring-4 ring-yellow-400/30 animate-none"
                : "shadow-yellow-400/20"
            }`}
        >
          {/* Expanding Flash Pulse Ripple */}
          {isAnimate && (
            <span className="absolute inset-0 pointer-events-none rounded-2xl bg-yellow-400/40 animate-ping" />
          )}

          <div className="relative">
            <ShoppingBasket
              size={24}
              className={`transition-transform duration-300 
                ${isAnimate ? "scale-125 rotate-12 text-zinc-950" : "group-hover:translate-y-[-2px]"}`}
            />

            {totalItems > 0 && (
              <span
                className={`absolute -top-2 -right-2 bg-zinc-900 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-yellow-400 transition-all duration-300 tabular-nums
                  ${isAnimate ? "scale-125 bg-red-500 border-white" : "scale-100"}`}
              >
                {totalItems}
              </span>
            )}
          </div>

          <span className="text-lg font-black tracking-tight">
            {t("view-cart")}
          </span>
        </Link>
      )}

      {/* Restaurant promo popup — shown once per session, dismissible */}
      {showPromoPopup && activePopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClosePromoPopup}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden bg-white shadow-2xl dark:bg-zinc-900 rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClosePromoPopup}
              aria-label={t("close") || "Close"}
              className="absolute z-10 flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full top-3 right-3 bg-black/40 hover:bg-black/60"
            >
              <X size={18} />
            </button>

            {popupImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={popupImage}
                alt={popupTitle}
                className="object-cover w-full h-48"
              />
            )}

            <div className="p-6">
              <h3
                className="mb-2 text-xl font-black text-zinc-900 dark:text-white"
                style={{ color: firstColor || undefined }}
              >
                {popupTitle}
              </h3>
              {popupDescription && (
                <p className="mb-6 text-sm text-gray-600 dark:text-zinc-400">
                  {popupDescription}
                </p>
              )}

              <button
                onClick={handleClosePromoPopup}
                className="w-full py-3 text-sm font-bold transition-all rounded-xl active:scale-95"
                style={{
                  backgroundColor: firstColor || "#facc15",
                  color: textFirstColor || "#111827",
                }}
              >
                {t("gotIt") || "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
