"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "../../../../../../context/LanguageContext";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
import usePut from "@/app/hooks/usePut";
import { getRestaurantId } from "@/context/Restaurantid";
import {
  MapPin,
  CreditCard,
  ArrowLeft,
  Truck,
  Store,
  CheckCircle2,
  Navigation,
  Loader2,
  ChevronLeft,
  Plus,
  X,
  FileText,
  AlertCircle,
  Tag,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon URLs — Next.js/Webpack breaks Leaflet's default
// icon path resolution, so we point them at the CDN assets instead.
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

type CartItem = {
  cartId?: string;
  foodId?: string;
  name: string;
  nameAr?: string;
  quantity?: number;
  unitPrice?: number;
  originalUnitPrice?: number;
  totalPrice: string | number;
  originalTotalPrice?: number;
  priceChanged?: boolean;
  isAvailable?: boolean;
  [key: string]: any;
};

export default function Checkout() {
  const [orderNote, setOrderNote] = useState("");

  // Coupon: checked separately from the checkout submission itself, via
  // /api/user/coupon/check, so the user gets discount feedback (or an
  // error like "expired"/"not applicable") before they ever hit Confirm.
  // appliedCoupon holds the last successfully-checked response; editing
  // the code input after a successful check clears it so a stale discount
  // can't silently carry over to a code the user hasn't re-validated.
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const { t } = useLanguage();
  const isRtl = t("dir") === "rtl";
  const router = useRouter();
  const params = useParams();
  const restaurantName = params.slug as string;
  const basePath = `/home/restaurants/${restaurantName}`;

  // The real restaurant.id (UUID) — the route only gives us the slug, so
  // this is the value set on the menu page after fetching restaurant
  // details (see utils/restaurantId.ts). Not available on the server (or
  // before the menu page has ever run for this restaurant), so every use
  // below has to tolerate it being null.
  const restaurantId = getRestaurantId(restaurantName);

  const [orderType, setOrderType] = useState<
    "delivery" | "takeaway" | "dine_in"
  >("delivery");

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [showAddressPopup, setShowAddressPopup] = useState(false);

  const { data: scheduleRes, loading: isLoadingSchedule } = useGet<any>(
    `/api/user/restaurants/resturant-schedules/${restaurantId}`,
  );
  const scheduleData = scheduleRes?.data?.data;
  const canDeliveryNow: boolean = scheduleData?.canDeliveryNow ?? true;
  const canTakeawayNow: boolean = scheduleData?.canTakeawayNow ?? true;
  const canDineInNow: boolean = scheduleData?.canDineInNow ?? true;

  const getOrderSource = () => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem(`login_source_${restaurantName}`) ||
        "online_order_web"
      );
    }
    return "online_order_web";
  };

  // The out-of-stock dialog (on the menu page) writes the mode + address/
  // branch the user picked there to localStorage as "fulfillment_choice_zzz"
  // -> {"mode":"delivery"|"takeaway","id":"<addressId or branchId>"}. When
  // checkout opens, we want to default to that same choice instead of
  // always starting on delivery + the first saved address. If the key is
  // missing, malformed, or doesn't match anything we get back from the API,
  // this returns null and checkout falls back to its normal default
  // behavior further below.
  const getStoredFulfillmentChoice = (): {
    mode: "delivery" | "takeaway";
    id: string;
  } | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("fulfillment_choice_zzz");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        (parsed?.mode === "delivery" || parsed?.mode === "takeaway") &&
        typeof parsed?.id === "string" &&
        parsed.id
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Applied at most once, the first time addresses/branches are available —
  // a ref rather than re-reading localStorage every render, so a manual
  // change the user makes on this page afterward is never overwritten by it.
  const appliedStoredChoiceRef = useRef(false);

  const {
    data: checkoutData,
    loading: isLoadingCheckout,
    refetch,
  } = useGet<any>(
    `/api/user/order/select?restaurantId=${restaurantId}&orderSource=${getOrderSource()}`,
  );

  // /api/user/cart needs restaurantId + serviceModule always, plus
  // branchId/addressId only when relevant (takeaway -> branch, delivery ->
  // address) — built with URLSearchParams so the optional ones don't show
  // up as "branchId=undefined" in the query string.
  const cartQuery = useMemo(() => {
    const qs = new URLSearchParams();
    if (restaurantId) qs.set("restaurantId", restaurantId);
    qs.set("serviceModule", orderType);
    if (selectedBranch) qs.set("branchId", selectedBranch);
    if (selectedAddress) qs.set("addressId", selectedAddress);
    return qs.toString();
  }, [restaurantId, orderType, selectedBranch, selectedAddress]);

  const { data: cartRes, loading: isLoadingCart } = useGet<any>(
    `/api/user/cart?${cartQuery}`,
  );

  const {
    data: profileRes,
    loading: isLoadingProfile,
    refetch: refetchProfile,
  } = useGet<any>("/api/user/profile");

  const profileUser = profileRes?.data?.data?.user;

  // Apple's "Hide My Email" sign-in gives the user a random relay address like
  // thc44djrm9@privaterelay.appleid.com instead of their real email, and no
  // real name either. We only ask for a name to fill that gap — and only
  // once ever: as soon as a REAL profileUser.name is set, this stays false
  // for good, even though the relay email itself never changes.
  // NOTE: the profile model has no separate "username" field — the actual
  // /api/user/profile PUT endpoint (see the account/profile page) reads/writes
  // "name". The popup below is still called UsernamePopup/username in the UI
  // copy since that's what we ask the user for, but it maps to profile.name.
  const isAppleRelayEmail = (email?: string | null) =>
    !!email && /@privaterelay\.appleid\.com$/i.test(email.trim());

  // The backend auto-fills profile.name from the relay email's local part
  // (e.g. email "thc44djrm9@privaterelay.appleid.com" -> name "thc44djrm9")
  // when there's no real name from Apple. So "!profileUser.name" is never
  // true for these accounts — name is always populated, just with junk.
  // Detect that specific case by checking whether name matches the local
  // part of the relay email, rather than guessing at a generic pattern.
  const isPlaceholderName = (name?: string | null, email?: string | null) => {
    const trimmedName = name?.trim();
    if (!trimmedName) return true;
    const localPart = email?.split("@")[0]?.trim();
    return !!localPart && trimmedName.toLowerCase() === localPart.toLowerCase();
  };

  // The email-pattern check runs on every render because it's derived from
  // profileUser, but the relay email never changes — so if the refetch after
  // saving is slow, cached, or the server hasn't caught up yet, the same
  // pattern check fires again and reopens the popup right after the user
  // saved. usernameConfirmed is a one-way local latch: the moment the save
  // succeeds we flip it and never re-run the email-pattern check again for
  // the rest of this session, regardless of what profileUser looks like.
  const [usernameConfirmed, setUsernameConfirmed] = useState(false);

  const showUsernamePopup =
    !usernameConfirmed &&
    !!profileUser &&
    isAppleRelayEmail(profileUser.email) &&
    isPlaceholderName(profileUser.name, profileUser.email);

  // Egyptian mobile format: exactly 11 digits, must start with "01".
  // Used to validate the phone/alternatePhone values as they already
  // come back from the profile API (not just whether they exist).
  const isValidEgyptPhone = (value?: string | null): boolean =>
    !!value && /^01\d{9}$/.test(value.trim());

  // Derived directly from the fetched profile — no local state/effect needed.
  // Once refetchProfile() pulls the updated phone fields, this recomputes
  // to false on the next render automatically.
  // Triggers the popup if either field is missing on the profile OR if a
  // value exists but is not a valid 11-digit number starting with "01".
  const showPhonePopup =
    !!profileUser &&
    (!isValidEgyptPhone(profileUser.phone) ||
      !isValidEgyptPhone(profileUser.alternatePhone));

  const { postData, loading: isSubmitting } = usePost();
  const { postData: postCouponCheck, loading: isCheckingCoupon } = usePost(
    "/api/user/coupon/check",
  );

  const data = checkoutData?.data?.data;
  const paymentMethods = data?.paymentMethods || [];
  const rawCartData = cartRes?.data?.data;

  const cartItems: CartItem[] = Array.isArray(rawCartData?.items)
    ? rawCartData.items
    : [];

  const subtotal = useMemo(() => {
    if (rawCartData?.totalSummary?.subtotal !== undefined) {
      return Number(rawCartData.totalSummary.subtotal);
    }
    return cartItems.reduce(
      (acc, item) => acc + Number(item.totalPrice || 0),
      0,
    );
  }, [rawCartData, cartItems]);

  // The cart endpoint re-prices items against whichever branch/address is
  // currently selected (a food's price or discount can differ per branch).
  // `priceChanged` on an item, and `originalTotalPrice` vs `totalPrice`,
  // tell us exactly which lines shifted and by how much so we can surface
  // that to the user before they confirm — rather than silently charging a
  // different total than what they added to cart at.
  const priceChangedItems = useMemo(
    () => cartItems.filter((item) => item.priceChanged),
    [cartItems],
  );

  const cartTotalSummary = rawCartData?.totalSummary;
  const originalSubtotal = Number(
    cartTotalSummary?.originalSubtotal ?? subtotal,
  );
  const hasPriceChanges =
    !!rawCartData?.hasPriceChanges || priceChangedItems.length > 0;

  const currentAddress = useMemo(() => {
    return data?.addresses?.find((addr: any) => addr.id === selectedAddress);
  }, [data?.addresses, selectedAddress]);

  const availableOrderTypes = useMemo(() => {
    const types: ("delivery" | "takeaway" | "dine_in")[] = [];
    if (canDeliveryNow) types.push("delivery");
    if (canTakeawayNow) types.push("takeaway");
    if (canDineInNow) types.push("dine_in");
    return types;
  }, [canDeliveryNow, canTakeawayNow, canDineInNow]);

  const activeOrderType: "delivery" | "takeaway" | "dine_in" =
    availableOrderTypes.includes(orderType)
      ? orderType
      : availableOrderTypes[0];

  // Modified: Extract delivery fee from the currently selected address
  const baseDeliveryFee = useMemo(() => {
    if (
      activeOrderType !== "delivery" ||
      !currentAddress ||
      !currentAddress.isDeliverable
    )
      return 0;
    return Number(currentAddress.deliveryFee) || 0;
  }, [activeOrderType, currentAddress]);

  // Site-wide free delivery offer (from /api/user/order/select ->
  // data.freeDeliveryOffer.minOrderAmount). If the cart subtotal meets or
  // exceeds this threshold, delivery is free regardless of the address's
  // own deliveryFee. Otherwise, fall back to the address's normal fee.
  const freeDeliveryOffer = data?.freeDeliveryOffer;
  const freeDeliveryMinOrderAmount = Number(
    freeDeliveryOffer?.minOrderAmount || 0,
  );
  const isFreeDeliveryOfferActive = !!freeDeliveryOffer;
  const qualifiesForFreeDelivery =
    isFreeDeliveryOfferActive &&
    freeDeliveryMinOrderAmount > 0 &&
    subtotal >= freeDeliveryMinOrderAmount;

  const deliveryFee = useMemo(() => {
    if (activeOrderType !== "delivery") return 0;
    if (qualifiesForFreeDelivery) return 0;
    return baseDeliveryFee;
  }, [activeOrderType, qualifiesForFreeDelivery, baseDeliveryFee]);

  // How much more the user needs to spend to unlock the free delivery offer.
  const freeDeliveryRemaining = Math.max(
    0,
    freeDeliveryMinOrderAmount - subtotal,
  );

  // Modified: Extract service fee from the root data object
  const serviceFee = Number(data?.serviceFee) || 0;

  const couponDiscount = appliedCoupon?.discount || 0;

  const total = useMemo(() => {
    return Math.max(0, subtotal + deliveryFee + serviceFee - couponDiscount);
  }, [subtotal, deliveryFee, serviceFee, couponDiscount]);

  useEffect(() => {
    // Tracks whether this same effect run already picked an address, so the
    // fallback default-address logic below doesn't fire a second, later
    // setSelectedAddress call that would clobber a just-applied stored
    // choice (state updates from earlier in this effect aren't reflected in
    // `selectedAddress` until the next render).
    let addressHandledThisPass = !!selectedAddress;

    if (!appliedStoredChoiceRef.current && data) {
      appliedStoredChoiceRef.current = true;
      const stored = getStoredFulfillmentChoice();

      if (stored?.mode === "delivery") {
        const match = data.addresses?.find((a: any) => a.id === stored.id);
        if (match) {
          setOrderType("delivery");
          setSelectedAddress(stored.id);
          addressHandledThisPass = true;
        }
      } else if (stored?.mode === "takeaway") {
        const match = data.branches?.find((b: any) => b.id === stored.id);
        if (match) {
          setOrderType("takeaway");
          setSelectedBranch(stored.id);
        }
      }
      // No stored value, or it didn't match any address/branch we got back
      // — fall straight through to the same default behavior as before.
    }

    if (data?.addresses?.length > 0 && !addressHandledThisPass) {
      setSelectedAddress(data.addresses[0].id);
    }
    if (paymentMethods.length > 0 && !selectedPayment) {
      setSelectedPayment(paymentMethods[0].id);
    }
  }, [data, selectedAddress, selectedPayment, paymentMethods]);

  // A coupon's discount can depend on deliveryFee (e.g. "free delivery"
  // style codes), which itself changes when the user switches order type
  // or picks a different address. Rather than let a stale discount from a
  // different deliveryFee silently apply, drop the applied coupon whenever
  // deliveryFee changes and make the user re-check it. The code stays in
  // the input so they can just hit "Apply" again.
  const isFirstDeliveryFeeRender = useRef(true);
  useEffect(() => {
    if (isFirstDeliveryFeeRender.current) {
      isFirstDeliveryFeeRender.current = false;
      return;
    }
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponError(
        t("dir") === "rtl"
          ? "تغيرت تفاصيل الطلب، يرجى إعادة تطبيق الكوبون"
          : "Order details changed — please re-apply your coupon",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryFee]);

  // Prices can also shift because of a re-price at the currently selected
  // branch/address (surfaced above via hasPriceChanges/priceChangedItems),
  // which changes subtotal without necessarily touching deliveryFee. A
  // coupon discount was checked against the OLD subtotal, so it needs to be
  // invalidated here too — same "keep the code, drop the stale discount"
  // pattern as the deliveryFee effect above.
  const isFirstPriceChangeRender = useRef(true);
  useEffect(() => {
    if (isFirstPriceChangeRender.current) {
      isFirstPriceChangeRender.current = false;
      return;
    }
    if (!hasPriceChanges) return;
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponError(
        t("dir") === "rtl"
          ? "تغيرت أسعار بعض الأصناف، يرجى إعادة تطبيق الكوبون"
          : "Some item prices changed — please re-apply your coupon",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPriceChanges, subtotal]);

  const handleCheckCoupon = async () => {
    const trimmedCode = couponCode.trim();
    if (!trimmedCode) {
      return toast.error(
        t("dir") === "rtl"
          ? "يرجى إدخال كود الكوبون"
          : "Please enter a coupon code",
      );
    }
    if (!restaurantId) return;

    setCouponError(null);

    try {
      const res: any = await postCouponCheck({
        code: trimmedCode,
        restaurantId,
        deliveryFee,
        subtotal,
      });

      const result = res?.data?.data || res?.data || res;
      const discount = Number(result?.discount ?? result?.discountAmount ?? 0);

      setAppliedCoupon({ code: trimmedCode, discount });
      toast.success(
        t("dir") === "rtl" ? "تم تطبيق الكوبون بنجاح" : "Coupon applied",
      );
    } catch (err: any) {
      // usePost already toasts the server's error message; just reflect
      // it inline next to the field and make sure no stale discount lingers.
      setAppliedCoupon(null);
      setCouponError(err?.message || null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  const handleConfirmOrder = async () => {
    if (!selectedPayment) return toast.error(t("selectPaymentError"));

    if (activeOrderType === "delivery") {
      if (!selectedAddress) return toast.error(t("selectAddressError"));
      if (currentAddress && !currentAddress.isDeliverable) {
        return toast.error(
          t("dir") === "rtl"
            ? "لا يمكن التوصيل للعنوان المحدد"
            : "Cannot deliver to selected address",
        );
      }
    }

    if (activeOrderType === "takeaway" && !selectedBranch)
      return toast.error(t("selectBranchError"));

    const payload = {
      orderSource: getOrderSource(),
      orderType: activeOrderType,
      paymentMethod: selectedPayment,
      idempotencyKey: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      addressId: activeOrderType === "delivery" ? selectedAddress : null,
      zoneId:
        activeOrderType === "delivery"
          ? (currentAddress?.zoneId ?? null)
          : null,
      branchId: activeOrderType === "takeaway" ? selectedBranch || null : null,
      note: orderNote,
      couponCode: appliedCoupon?.code || null,
    };

    try {
      await postData(payload, "/api/user/order/checkout");
      toast.success(t("orderSuccess"));
      router.push(`/profile?tab=tracking&callbackSlug=${restaurantName}`);
    } catch {
      toast.error(t("orderFailed"));
    }
  };

  if (
    isLoadingCheckout ||
    isLoadingCart ||
    isLoadingSchedule ||
    isLoadingProfile
  )
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <p className="font-bold text-gray-500">{t("loadingOptions")}</p>
      </div>
    );

  // Apple private-relay email means no real name came through sign-in.
  // Ask for one — but only ever once, since showUsernamePopup goes false
  // permanently the moment a real profileUser.name is saved (and stays
  // false all session via usernameConfirmed once the save succeeds).
  if (showUsernamePopup) {
    return (
      <UsernamePopup
        // Don't pre-fill with the placeholder relay-derived name (e.g.
        // "thc44djrm9") — that's exactly the junk value we're asking the
        // user to replace, and showing it back to them as a "suggestion"
        // is misleading.
        initialUsername=""
        onSuccess={() => {
          // Close the popup immediately and permanently for this session —
          // don't wait on / depend on the refetch to confirm it, since a
          // slow or stale GET is exactly what was reopening the popup.
          setUsernameConfirmed(true);
          refetchProfile();
        }}
      />
    );
  }

  // Phone / alternate phone are required before checkout can proceed.
  // If either is missing OR not a valid 11-digit "01..." number on the
  // profile, close out the checkout screen and force the user to fix it.
  if (showPhonePopup) {
    return (
      <PhonePopup
        initialPhone={profileUser?.phone || ""}
        initialAlternatePhone={profileUser?.alternatePhone || ""}
        onSuccess={refetchProfile}
      />
    );
  }

  const isOrderBlocked =
    activeOrderType === "delivery" &&
    currentAddress &&
    !currentAddress.isDeliverable;

  return (
    <div
      className="max-w-2xl p-4 pb-32 mx-auto duration-500 animate-in fade-in"
      dir={t("dir")}
    >
      <h2 className="mb-8 text-3xl font-black text-gray-900 dark:text-white">
        {t("completeOrder")}
      </h2>
      <button
        onClick={() => router.back()}
        className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md active:scale-95 text-theme-first-text mb-6"
      >
        <ChevronLeft className="w-6 h-6 transform rotate-0 rtl:rotate-180" />
      </button>

      {/* 1. Order Type */}
      <section className="mb-8">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <Navigation size={20} className="text-yellow-500" /> {t("orderType")}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "delivery", label: t("delivery"), icon: Truck },
            { id: "takeaway", label: t("takeaway"), icon: Store },
            { id: "dine_in", label: t("dineIn"), icon: CheckCircle2 },
          ]
            .filter((type) => availableOrderTypes.includes(type.id as any))
            .map((type) => (
              <button
                key={type.id}
                onClick={() => setOrderType(type.id as any)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  activeOrderType === type.id
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                    : "border-gray-100 dark:border-zinc-800 text-gray-500"
                }`}
              >
                <type.icon size={24} />
                <span className="text-xs font-bold">{type.label}</span>
              </button>
            ))}
        </div>
      </section>

      {/* 2. Delivery Address */}
      {activeOrderType === "delivery" && (
        <section className="mb-8 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <MapPin size={20} className="text-yellow-500" />{" "}
              {t("deliveryAddress")}
            </h3>
            <button
              onClick={() => setShowAddressPopup(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-theme-first-text bg-yellow-400 rounded-xl hover:bg-yellow-500 transition-colors"
            >
              <Plus size={16} />
              {t("add-address")}
            </button>
          </div>
          <div className="space-y-3">
            {data?.addresses?.length === 0 ? (
              <div className="p-6 text-center border-2 border-gray-200 border-dashed rounded-2xl dark:border-zinc-800">
                <p className="mb-4 text-gray-500">{t("no-addresses-found")}</p>
              </div>
            ) : (
              data?.addresses?.map((addr: any) => {
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      selectedAddress === addr.id
                        ? addr.isDeliverable
                          ? "border-yellow-400 bg-white dark:bg-zinc-900"
                          : "border-red-400 bg-red-50 dark:bg-red-950/20"
                        : "border-gray-100 dark:border-zinc-800"
                    } ${!addr.isDeliverable && "opacity-80"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-xl mt-1">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="font-bold">{addr.title}</p>
                        <p className="text-sm text-gray-500">
                          {addr.street}, {addr.number}
                        </p>

                        {/* Modified: Deliverability feedback */}
                        {!addr.isDeliverable && (
                          <div className="flex items-center gap-1 mt-2 text-red-500">
                            <AlertCircle size={14} />
                            <p className="text-xs font-bold">
                              {t("dir") === "rtl"
                                ? "المطعم لا يوصل لهذا العنوان"
                                : "Delivery unavailable for this address"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedAddress === addr.id && addr.isDeliverable && (
                      <CheckCircle2 size={20} className="text-yellow-500" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* 3. Branch */}
      {activeOrderType !== "delivery" && (
        <section className="mb-8 animate-in slide-in-from-top-2">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
            <Store size={20} className="text-yellow-500" /> {t("selectBranch")}
          </h3>
          <div className="space-y-3">
            {data?.branches?.map((branch: any) => (
              <div
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  selectedBranch === branch.id
                    ? "border-yellow-400 bg-white dark:bg-zinc-900"
                    : "border-gray-100 dark:border-zinc-800"
                }`}
              >
                <div>
                  <p className="font-bold">{branch.name}</p>
                  <p className="text-sm text-gray-500">{branch.address}</p>
                </div>
                {selectedBranch === branch.id && (
                  <CheckCircle2 size={20} className="text-yellow-500" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Payment */}
      <section className="mb-8">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <CreditCard size={20} className="text-yellow-500" />{" "}
          {t("paymentMethod")}
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {paymentMethods.map(
            (method: { id: string; name: string; nameAr?: string }) => {
              const isRtl = t("dir") === "rtl";
              const displayName =
                isRtl && method.nameAr ? method.nameAr : t(method.name);

              return (
                <div
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                    selectedPayment === method.id
                      ? "border-yellow-400 bg-white dark:bg-zinc-900"
                      : "border-gray-100 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-bold">{displayName}</p>
                  </div>
                  {selectedPayment === method.id && (
                    <CheckCircle2 size={20} className="text-yellow-500" />
                  )}
                </div>
              );
            },
          )}
        </div>
      </section>

      {/* Notes Area */}
      <section className="mb-6 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <textarea
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder={
            t("dir") === "rtl"
              ? "اكتب أي ملاحظات خاصة بالطلب هنا..."
              : "Write any special instructions here..."
          }
          rows={3}
          className="w-full p-4 text-sm text-zinc-800 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none resize-none focus:ring-2 focus:ring-yellow-400 transition-all"
        />
      </section>

      {/* Coupon */}
      <section className="mb-6 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <Tag size={20} className="text-yellow-500" />{" "}
          {t("dir") === "rtl" ? "كود الخصم" : "Coupon Code"}
        </h3>

        {appliedCoupon ? (
          <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-400 rounded-xl text-theme-first-text">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {appliedCoupon.code}
                </p>
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                  {t("dir") === "rtl"
                    ? `تم خصم ${appliedCoupon.discount} ${t("egp")}`
                    : `${appliedCoupon.discount} ${t("egp")} off applied`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors"
              aria-label={
                t("dir") === "rtl" ? "إزالة الكوبون" : "Remove coupon"
              }
            >
              <X size={18} className="text-yellow-700 dark:text-yellow-400" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  // Any edit invalidates the previously shown error — the
                  // user hasn't re-checked this new code yet.
                  if (couponError) setCouponError(null);
                }}
                placeholder={
                  t("dir") === "rtl" ? "أدخل كود الكوبون" : "Enter coupon code"
                }
                className="flex-1 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-zinc-900 dark:text-white text-sm uppercase"
              />
              <button
                type="button"
                onClick={handleCheckCoupon}
                disabled={isCheckingCoupon || !couponCode.trim()}
                className="px-5 py-3 font-bold text-theme-first-text bg-yellow-400 rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm shrink-0"
              >
                {isCheckingCoupon && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {t("dir") === "rtl" ? "تطبيق" : "Apply"}
              </button>
            </div>
            {couponError && (
              <div className="flex items-center gap-1.5 mt-2 text-red-500">
                <AlertCircle size={14} />
                <p className="text-xs font-bold">{couponError}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Price Change Alert — surfaces items whose price differs for the
          currently selected branch/address, before the user confirms */}
      {hasPriceChanges && (
        <section className="mb-6 p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-start gap-2.5 mb-3">
            <AlertCircle
              size={18}
              className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            />
            <div>
              <p className="font-bold text-sm text-amber-900 dark:text-amber-300">
                {isRtl
                  ? "تغيرت أسعار بعض الأصناف"
                  : "Some item prices have changed"}
              </p>
              <p className="text-xs font-medium text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                {isRtl
                  ? "الأسعار قد تختلف حسب الفرع أو العنوان الذي اخترته."
                  : "Prices can differ based on the branch or address you selected."}
              </p>
            </div>
          </div>

          {priceChangedItems.length > 0 && (
            <div className="space-y-2">
              {priceChangedItems.map((item) => {
                const itemName = isRtl && item.nameAr ? item.nameAr : item.name;
                const oldPrice = Number(
                  item.originalTotalPrice ?? item.totalPrice,
                );
                const newPrice = Number(item.totalPrice);
                const isIncrease = newPrice > oldPrice;

                return (
                  <div
                    key={item.cartId || item.foodId}
                    className="flex items-center justify-between gap-3 text-xs font-semibold bg-white/60 dark:bg-black/20 rounded-xl px-3 py-2"
                  >
                    <span className="text-amber-950 dark:text-amber-200 truncate">
                      {itemName}
                      {item.quantity && item.quantity > 1
                        ? ` ×${item.quantity}`
                        : ""}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="line-through text-amber-600/60 dark:text-amber-500/50">
                        {oldPrice} {t("egp")}
                      </span>
                      <span
                        className={
                          isIncrease
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }
                      >
                        {newPrice} {t("egp")}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {originalSubtotal !== subtotal && (
            <div className="flex items-center justify-between text-xs font-bold mt-3 pt-3 border-t border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300">
              <span>{isRtl ? "الإجمالي الجديد" : "New subtotal"}</span>
              <span className="flex items-center gap-1.5">
                <span className="line-through text-amber-600/60 dark:text-amber-500/50 font-medium">
                  {originalSubtotal} {t("egp")}
                </span>
                <span>
                  {subtotal} {t("egp")}
                </span>
              </span>
            </div>
          )}
        </section>
      )}

      {/* 5. Order Summary */}
      <section className="mb-8 p-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900 dark:text-white">
          <FileText size={20} className="text-yellow-500" /> {t("orderSummary")}
        </h3>

        <div className="space-y-3 text-sm font-medium text-gray-600 dark:text-zinc-400">
          <div className="flex justify-between items-center">
            <span>{t("subtotal")}</span>
            <span className="text-gray-900 dark:text-white font-bold">
              {subtotal} {t("egp")}
            </span>
          </div>

          {activeOrderType === "delivery" && (
            <div className="flex justify-between items-center">
              <span>{t("deliveryFee")}</span>
              <span
                className={`font-bold ${!currentAddress?.isDeliverable ? "text-red-500" : "text-gray-900 dark:text-white"}`}
              >
                {!currentAddress?.isDeliverable
                  ? "-"
                  : deliveryFee === 0
                    ? t("dir") === "rtl"
                      ? "مجاني"
                      : "Free"
                    : `${deliveryFee} ${t("egp")}`}
              </span>
            </div>
          )}

          {activeOrderType === "delivery" &&
            currentAddress?.isDeliverable &&
            isFreeDeliveryOfferActive &&
            !qualifiesForFreeDelivery && (
              <div className="flex items-center gap-2 text-xs font-semibold text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl px-3 py-2">
                <Truck size={14} />
                <span>
                  {t("dir") === "rtl"
                    ? `أضف ${freeDeliveryRemaining} ${t("egp")} أخرى (الحد الأدنى ${freeDeliveryMinOrderAmount} ${t("egp")}) للحصول على توصيل مجاني`
                    : `Add ${freeDeliveryRemaining} ${t("egp")} more (min. ${freeDeliveryMinOrderAmount} ${t("egp")}) to get free delivery`}
                </span>
              </div>
            )}

          <div className="flex justify-between items-center">
            <span>{t("serviceFee")}</span>
            <span className="text-gray-900 dark:text-white font-bold">
              {serviceFee} {t("egp")}
            </span>
          </div>

          {appliedCoupon && couponDiscount > 0 && (
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Tag size={14} className="text-yellow-500" />
                {t("dir") === "rtl" ? "الخصم" : "Discount"} (
                {appliedCoupon.code})
              </span>
              <span className="text-green-600 dark:text-green-400 font-bold">
                -{couponDiscount} {t("egp")}
              </span>
            </div>
          )}

          <hr className="border-gray-200 dark:border-zinc-800 my-2" />

          <div className="flex justify-between items-center text-base font-bold text-gray-900 dark:text-white pt-1">
            <span>{t("total")}</span>
            <span className="text-yellow-500 text-lg">
              {total} {t("egp")}
            </span>
          </div>
        </div>
      </section>

      {/* Confirm Button */}
      <button
        disabled={isSubmitting || isOrderBlocked}
        onClick={handleConfirmOrder}
        className="relative flex items-center justify-center w-full max-w-2xl gap-3 px-6 py-4 overflow-hidden font-bold text-theme-first-text transition-all duration-300 shadow-lg group bg-yellow-400 hover:bg-yellow-500 rounded-2xl shadow-yellow-400/30 hover:shadow-xl hover:shadow-yellow-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="absolute inset-0 transition duration-500 opacity-0 group-hover:opacity-100 bg-white/10 blur-xl" />
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">{t("processing")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-base">{t("confirmAndPay")}</span>
            <ArrowLeft
              size={20}
              className={`transition-transform duration-300 group-hover:-translate-x-1 ${
                t("dir") === "ltr" ? "rotate-180 group-hover:translate-x-1" : ""
              }`}
            />
          </div>
        )}
      </button>

      {/* Address Popup */}
      {showAddressPopup && (
        <AddAddressPopup
          onClose={() => setShowAddressPopup(false)}
          onSuccess={(newAddressId) => {
            refetch();
            if (newAddressId) setSelectedAddress(newAddressId);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PhonePopup Component
// Blocks checkout until the user has a phone + alternate phone
// saved on their profile. Uses the same /api/user/profile endpoint
// (via usePut) to save the update.
// ─────────────────────────────────────────────

interface PhonePopupProps {
  initialPhone: string;
  initialAlternatePhone: string;
  onSuccess: () => void | Promise<void>;
}

function PhonePopup({
  initialPhone,
  initialAlternatePhone,
  onSuccess,
}: PhonePopupProps) {
  const { t } = useLanguage();
  const { putData: postProfile, loading: isSavingProfile } =
    usePut("/api/user/profile");

  const [phone, setPhone] = useState(initialPhone);
  const [alternatePhone, setAlternatePhone] = useState(initialAlternatePhone);

  const inputClass =
    "w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-zinc-900 dark:text-white text-sm";

  const phoneRegex = /^01\d{9}$/; // 11 digits, must start with 01

  // Phone / alternate phone: digits only, max 11 characters.
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
  };

  const handleAlternatePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAlternatePhone(e.target.value.replace(/\D/g, "").slice(0, 11));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPhone = phone.trim();
    const trimmedAlternatePhone = alternatePhone.trim();

    if (!trimmedPhone || !trimmedAlternatePhone) {
      return toast.error(
        t("dir") === "rtl"
          ? "يرجى إدخال رقم الهاتف ورقم الهاتف البديل."
          : "Please enter both your phone and alternate phone numbers.",
      );
    }

    if (!phoneRegex.test(trimmedPhone)) {
      return toast.error(
        t("dir") === "rtl"
          ? "رقم الهاتف يجب أن يتكون من 11 رقمًا ويبدأ بـ 01"
          : "Phone number must be 11 digits and start with 01.",
      );
    }

    if (!phoneRegex.test(trimmedAlternatePhone)) {
      return toast.error(
        t("dir") === "rtl"
          ? "رقم الهاتف البديل يجب أن يتكون من 11 رقمًا ويبدأ بـ 01"
          : "Alternate phone number must be 11 digits and start with 01.",
      );
    }

    try {
      await postProfile(
        { phone: trimmedPhone, alternatePhone: trimmedAlternatePhone },
        null,
        t("dir") === "rtl"
          ? "تم تحديث بيانات الهاتف بنجاح"
          : "Phone details updated successfully",
      );
      // Wait for the profile refetch to resolve before returning — avoids
      // the popup staying on screen (or flashing back) on slow connections
      // because the fresh phone/alternatePhone hasn't landed in state yet.
      await onSuccess();
    } catch {
      // Error toast already handled inside usePut
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      dir={t("dir")}
    >
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl scale-100 duration-200 animate-in zoom-in-95">
        <div className="mb-6">
          <h2 className="text-xl font-bold dark:text-white mb-1">
            {t("dir") === "rtl"
              ? "استكمال بيانات الهاتف"
              : "Complete Your Phone Details"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t("dir") === "rtl"
              ? "يرجى إدخال رقم هاتفك ورقم هاتف بديل لإتمام عملية الطلب."
              : "Please add a phone number and an alternate phone number to continue with checkout."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t("dir") === "rtl" ? "رقم الهاتف" : "Phone Number"}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              value={phone}
              onChange={handlePhoneChange}
              placeholder={
                t("dir") === "rtl" ? "أدخل رقم الهاتف" : "Enter phone number"
              }
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t("dir") === "rtl"
                ? "رقم الهاتف البديل"
                : "Alternate Phone Number"}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              value={alternatePhone}
              onChange={handleAlternatePhoneChange}
              placeholder={
                t("dir") === "rtl"
                  ? "أدخل رقم الهاتف البديل"
                  : "Enter alternate phone number"
              }
              className={inputClass}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full py-3.5 mt-2 font-bold text-theme-first-text bg-yellow-400 rounded-xl hover:bg-yellow-500 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {isSavingProfile && <Loader2 size={16} className="animate-spin" />}
            {isSavingProfile
              ? t("dir") === "rtl"
                ? "جاري الحفظ..."
                : "Saving..."
              : t("dir") === "rtl"
                ? "حفظ ومتابعة"
                : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// UsernamePopup Component
// Blocks checkout when the profile still has an Apple "Hide My Email"
// relay address (e.g. thc44djrm9@privaterelay.appleid.com) — that sign-in
// flow also skips giving us a real name, so we collect a username here.
// Gated to run only once ever per user: see showUsernamePopup, which goes
// false permanently as soon as profileUser.name is saved. Uses the
// same /api/user/profile endpoint (via usePut) to save the update.
// ─────────────────────────────────────────────

interface UsernamePopupProps {
  initialUsername: string;
  onSuccess: () => void | Promise<void>;
}

function UsernamePopup({ initialUsername, onSuccess }: UsernamePopupProps) {
  const { t } = useLanguage();
  const { putData: postProfile, loading: isSavingProfile } =
    usePut("/api/user/profile");

  const [username, setUsername] = useState(initialUsername);

  const inputClass =
    "w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-zinc-900 dark:text-white text-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      return toast.error(
        t("dir") === "rtl"
          ? "يرجى إدخال اسم المستخدم."
          : "Please enter a username.",
      );
    }

    try {
      await postProfile(
        { name: trimmedUsername },
        null,
        t("dir") === "rtl"
          ? "تم تحديث اسم المستخدم بنجاح"
          : "Username updated successfully",
      );
      // Wait for the profile refetch to resolve before returning — on a
      // slow/mobile connection, firing this without awaiting means the
      // popup can still be on screen (or briefly flash back) because
      // profileUser.name hasn't landed in state yet.
      await onSuccess();
    } catch {
      // Error toast already handled inside usePut
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      dir={t("dir")}
    >
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl scale-100 duration-200 animate-in zoom-in-95">
        <div className="mb-6">
          <h2 className="text-xl font-bold dark:text-white mb-1">
            {t("dir") === "rtl"
              ? "استكمال بيانات الحساب"
              : "Complete Your Account Details"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t("dir") === "rtl"
              ? "لقد سجلت الدخول باستخدام خيار إخفاء البريد الإلكتروني من Apple. يرجى إدخال اسم مستخدم لإتمام عملية الطلب."
              : "You signed in using Apple's Hide My Email option. Please enter a username to continue with checkout."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t("dir") === "rtl" ? "اسم المستخدم" : "Username"}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                t("dir") === "rtl" ? "أدخل اسم المستخدم" : "Enter username"
              }
              className={inputClass}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full py-3.5 mt-2 font-bold text-theme-first-text bg-yellow-400 rounded-xl hover:bg-yellow-500 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {isSavingProfile && <Loader2 size={16} className="animate-spin" />}
            {isSavingProfile
              ? t("dir") === "rtl"
                ? "جاري الحفظ..."
                : "Saving..."
              : t("dir") === "rtl"
                ? "حفظ ومتابعة"
                : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AddAddressPopup Component
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// LocationPicker Component (draggable map pin)
// ─────────────────────────────────────────────

function MapClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const pos = marker.getLatLng();
          onChange(pos.lat, pos.lng);
        }
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={true}
      style={{ height: "220px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[lat, lng]}
        draggable={true}
        eventHandlers={eventHandlers}
        ref={markerRef}
      />
      <MapClickHandler onChange={onChange} />
      <RecenterOnChange lat={lat} lng={lng} />
    </MapContainer>
  );
}

interface AddAddressPopupProps {
  onClose: () => void;
  onSuccess: (id?: string) => void;
}

function AddAddressPopup({ onClose, onSuccess }: AddAddressPopupProps) {
  const { t } = useLanguage();
  const { postData: postAddress, loading: postingAddress } =
    usePost("/api/user/address");

  const [isLocating, setIsLocating] = useState(false);
  const [locationErrorType, setLocationErrorType] = useState<
    "ios" | "android" | "generic" | null
  >(null);

  // Leaflet needs the DOM, so we only render the map after mounting on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fallback map center (Cairo, Egypt) used until we have a real location.
  const DEFAULT_MAP_CENTER: [number, number] = [30.0444, 31.2357];

  const [addressForm, setAddressForm] = useState({
    title: "",

    street: "",
    fulladdress: "",
    number: "",
    floor: "",
    apartment: "",
    landmark: "",
    lat: null as number | null,
    lng: null as number | null,
    location: "" as string,
  });

  const inputClass =
    "w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-zinc-900 dark:text-white text-sm";

  // Reverse-geocodes a coordinate and stores it (+ derived address fields)
  // in the form. Shared by the GPS button and the draggable map pin.
  const applyLocation = async (latitude: number, longitude: number) => {
    let extractedTitle = "";
    let extractedStreet = "";
    let extractedfulladdress = "";

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      );
      const geoData = await res.json();
      const address = geoData?.address || {};

      extractedTitle =
        address.road ||
        address.neighbourhood ||
        address.suburb ||
        geoData?.display_name ||
        "";

      extractedStreet = address.road || address.pedestrian || "";
      extractedfulladdress = geoData?.display_name || "";
    } catch (geoError) {
      console.error("Error reverse geocoding location:", geoError);
    }

    setAddressForm((prev) => ({
      ...prev,
      lat: latitude,
      lng: longitude,
      location: extractedTitle,
      street: extractedStreet,
      fulladdress: extractedfulladdress,
    }));
  };

  // Called when the user drags the pin or taps elsewhere on the map.
  const handleMapLocationChange = (lat: number, lng: number) => {
    applyLocation(lat, lng);
  };

  const handleGetCurrentLocation = () => {
    const isFacebookBrowser =
      navigator.userAgent.includes("FBAN") ||
      navigator.userAgent.includes("FBAV");
    if (isFacebookBrowser) {
      setLocationErrorType("ios");
      return;
    }

    if (!navigator.geolocation) {
      return toast.error(
        t("dir") === "rtl"
          ? "المتصفح الخاص بك لا يدعم تحديد الموقع."
          : "Geolocation is not supported by your browser.",
      );
    }

    setIsLocating(true);
    setLocationErrorType(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    };

    const successCallback = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      await applyLocation(latitude, longitude);

      setIsLocating(false);
      toast.success(
        t("dir") === "rtl"
          ? "تم تحديد موقعك الحالي بنجاح!"
          : "Current location fetched successfully!",
      );
    };

    const errorCallback = (error: GeolocationPositionError) => {
      setIsLocating(false);
      console.error("Error getting location:", error);

      if (error.code === error.PERMISSION_DENIED) {
        const userAgent =
          navigator.userAgent || navigator.vendor || (window as any).opera;
        const isiOS =
          /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        const isAndroid = /Android/i.test(userAgent);

        if (isiOS) {
          setLocationErrorType("ios");
        } else if (isAndroid) {
          setLocationErrorType("android");
        } else {
          setLocationErrorType("generic");
        }
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        toast.error(
          t("dir") === "rtl"
            ? "معلومات الموقع غير متوفرة. يرجى التأكد من تفعيل الـ GPS في هاتفك."
            : "Location information is unavailable. Please ensure your device GPS is turned on.",
        );
      } else if (error.code === error.TIMEOUT) {
        toast.error(
          t("dir") === "rtl"
            ? "انتهت مهلة طلب الموقع. يرجى المحاولة مرة أخرى."
            : "Location request timed out. Please try again.",
        );
      }
    };

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setIsLocating(false);
            const userAgent =
              navigator.userAgent || navigator.vendor || (window as any).opera;
            const isiOS =
              /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
            setLocationErrorType(isiOS ? "ios" : "android");
          } else {
            navigator.geolocation.getCurrentPosition(
              successCallback,
              errorCallback,
              options,
            );
          }
        })
        .catch(() => {
          navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,
            options,
          );
        });
    } else {
      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        options,
      );
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addressForm.lat === null || addressForm.lng === null) {
      return toast.error(
        t("dir") === "rtl"
          ? "يرجى تحديد الموقع الحالي أولاً لتأكيد إرسال الإحداثيات."
          : "Please capture your current location before submitting.",
      );
    }

    const payload = {
      ...addressForm,
      number: String(addressForm.number) || 0,
      floor: String(addressForm.floor) || 0,
    };

    try {
      const response = await postAddress(
        payload,
        null,
        t("address-added-success"),
      );
      onClose();
      onSuccess(response?.data?.data?.id || response?.data?.id);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl scale-100 duration-200 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold dark:text-white">
            {t("add-address")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} className="dark:text-white" />
          </button>
        </div>

        {/* GPS Location Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="w-full mb-4 py-3 px-4 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold text-sm transition-all border border-zinc-200 dark:border-zinc-700 active:scale-98 disabled:opacity-60"
        >
          {isLocating ? (
            <Loader2 size={18} className="animate-spin text-yellow-500" />
          ) : (
            <Navigation size={18} className="text-yellow-500 fill-yellow-500" />
          )}
          {isLocating
            ? t("dir") === "rtl"
              ? "جاري تحديد موقعك..."
              : "Locating..."
            : t("dir") === "rtl"
              ? "استخدام موقعي الحالي (GPS)"
              : "Use Current Location (GPS)"}
        </button>

        {/* Alert box when permission is denied */}
        {locationErrorType && (
          <div className="mb-4 p-4 rounded-2xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2.5">
              <span className="text-lg mt-0.5">⚠️</span>
              <div className="text-xs font-medium leading-relaxed">
                <p className="font-bold text-sm mb-1">
                  {t("dir") === "rtl"
                    ? "صلاحية الموقع محجوبة"
                    : "Location Access Blocked"}
                </p>

                {navigator.userAgent.includes("FBAN") ||
                navigator.userAgent.includes("FBAV") ? (
                  <div className="space-y-3">
                    <p>
                      {t("dir") === "rtl"
                        ? "متصفح فيسبوك قد لا يدعم تحديد الموقع بشكل صحيح."
                        : "The Facebook browser may not fully support location access."}
                    </p>

                    <ol className="list-decimal ps-5 space-y-1">
                      <li>
                        {t("dir") === "rtl"
                          ? "اضغط على القائمة (⋮) بالأعلى."
                          : "Tap the menu (⋮) at the top."}
                      </li>

                      <li>
                        {t("dir") === "rtl"
                          ? "اختر «فتح في المتصفح» (Open in Browser)."
                          : "Select 'Open in Browser'."}
                      </li>

                      <li>
                        {t("dir") === "rtl"
                          ? "إذا طُلب منك، فعِّل «مشاركة الموقع» (Share Location) أو اسمح بالوصول إلى الموقع من إعدادات جهازك."
                          : "If prompted, enable 'Share Location' or allow location access from your device settings."}
                      </li>
                    </ol>
                  </div>
                ) : (
                  <p>
                    {locationErrorType === "ios" &&
                      (t("dir") === "rtl"
                        ? "يرجى تفعيل خدمات الموقع والسماح لـ Safari بالوصول إلى موقعك."
                        : "Please enable Location Services and allow Safari to access your location.")}
                    {locationErrorType === "android" &&
                      (t("dir") === "rtl"
                        ? "يرجى تفعيل خدمة الموقع (GPS) والسماح للمتصفح بالوصول إلى موقعك."
                        : "Please enable GPS and allow your browser to access your location.")}

                    {locationErrorType === "generic" && (
                      <p>
                        {t("dir") === "rtl"
                          ? "تعذر الوصول إلى موقعك الحالي. يرجى التأكد من تفعيل خدمة الموقع والسماح للمتصفح بالوصول إلى موقعك، ثم أعد المحاولة."
                          : "Unable to access your current location. Please make sure location services are enabled and your browser has permission to access your location, then try again."}
                      </p>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Map - drag the pin or tap the map to fine-tune the location */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t("dir") === "rtl"
              ? "اسحب الدبوس لتحديد موقعك بدقة"
              : "Drag the pin to fine-tune your exact location"}
          </p>
          {mounted && (
            <div className="overflow-hidden border rounded-2xl border-zinc-200 dark:border-zinc-800">
              <LocationPicker
                lat={addressForm.lat ?? DEFAULT_MAP_CENTER[0]}
                lng={addressForm.lng ?? DEFAULT_MAP_CENTER[1]}
                onChange={handleMapLocationChange}
              />
            </div>
          )}
        </div>

        {/* Captured Coordinates Feedback */}
        {addressForm.lat && addressForm.lng && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl flex items-start gap-2 text-xs font-semibold text-green-700 dark:text-green-400 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              {addressForm.location && <span>{addressForm.location}</span>}
              <span>
                {t("dir") === "rtl"
                  ? `تم التقاط الموقع: (${addressForm.lat.toFixed(4)}, ${addressForm.lng.toFixed(4)})`
                  : `Location captured: (${addressForm.lat.toFixed(4)}, ${addressForm.lng.toFixed(4)})`}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleAddressSubmit} className="space-y-4">
          <input
            name="title"
            placeholder={t("title")}
            value={addressForm.title}
            onChange={handleInputChange}
            className={inputClass}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="street"
              placeholder={t("street")}
              value={addressForm.street}
              onChange={handleInputChange}
              className={`col-span-2 ${inputClass}`}
              required
            />

            <textarea
              name="fulladdress"
              placeholder={t("address") || "Full Address"}
              value={addressForm.fulladdress}
              onChange={handleInputChange}
              className={`col-span-2 ${inputClass} resize-none`}
              rows={2}
              required
            />

            <input
              name="number"
              placeholder={t("number")}
              value={addressForm.number}
              onChange={handleInputChange}
              className={inputClass}
              required
            />
            <input
              name="floor"
              placeholder={t("floor")}
              value={addressForm.floor}
              onChange={handleInputChange}
              className={inputClass}
              required
            />
            <input
              name="apartment"
              placeholder={t("apartment")}
              value={addressForm.apartment}
              onChange={handleInputChange}
              className={inputClass}
              required
            />
            <input
              name="landmark"
              placeholder={t("landmark")}
              value={addressForm.landmark}
              onChange={handleInputChange}
              className={`col-span-2 ${inputClass}`}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-zinc-700 bg-zinc-100 rounded-xl hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition-colors text-sm"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={postingAddress || isLocating}
              className="flex-1 py-3 font-bold text-theme-first-text bg-yellow-400 rounded-xl hover:bg-yellow-500 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {postingAddress && <Loader2 size={16} className="animate-spin" />}
              {postingAddress ? t("saving") : t("add-address-btn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
