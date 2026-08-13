"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "../../../../../../context/LanguageContext";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
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

type CartItem = { totalPrice: string | number; [key: string]: any };

export default function Checkout() {
  const [orderNote, setOrderNote] = useState("");
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const restaurantName = params.slug as string;
  const basePath = `/home/restaurants/${restaurantName}`;

  const [orderType, setOrderType] = useState<
    "delivery" | "takeaway" | "dine_in"
  >("delivery");

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [showAddressPopup, setShowAddressPopup] = useState(false);

  const { data: scheduleRes, loading: isLoadingSchedule } = useGet<any>(
    `/api/user/restaurants/resturant-schedules/${params.id}`,
  );
  const scheduleData = scheduleRes?.data?.data;
  const canDeliveryNow: boolean = scheduleData?.canDeliveryNow ?? true;
  const canTakeawayNow: boolean = scheduleData?.canTakeawayNow ?? true;
  const canDineInNow: boolean = scheduleData?.canDineInNow ?? true;

  const getOrderSource = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("login_source") || "food_aggregator";
    }
    return "food_aggregator";
  };

  const {
    data: checkoutData,
    loading: isLoadingCheckout,
    refetch,
  } = useGet<any>(
    `/api/user/order/select?restaurantId=${params.id}&orderSource=${getOrderSource()}`,
  );

  const { data: cartRes, loading: isLoadingCart } =
    useGet<any>("/api/user/cart");

  const { postData, loading: isSubmitting } = usePost();

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
  const deliveryFee = useMemo(() => {
    if (
      activeOrderType !== "delivery" ||
      !currentAddress ||
      !currentAddress.isDeliverable
    )
      return 0;
    return Number(currentAddress.deliveryFee) || 0;
  }, [activeOrderType, currentAddress]);

  // Modified: Extract service fee from the root data object
  const serviceFee = Number(data?.serviceFee) || 0;

  const total = useMemo(() => {
    return subtotal + deliveryFee + serviceFee;
  }, [subtotal, deliveryFee, serviceFee]);

  useEffect(() => {
    if (data?.addresses?.length > 0 && !selectedAddress) {
      setSelectedAddress(data.addresses[0].id);
    }
    if (data?.branches?.length > 0 && !selectedBranch) {
      setSelectedBranch(data.branches[0].id);
    }
    if (paymentMethods.length > 0 && !selectedPayment) {
      setSelectedPayment(paymentMethods[0].id);
    }
  }, [data, selectedAddress, selectedBranch, selectedPayment, paymentMethods]);

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

    if (activeOrderType !== "delivery" && !selectedBranch)
      return toast.error(t("selectBranchError"));

    const payload = {
      orderSource: getOrderSource(),
      orderType: activeOrderType,
      paymentMethod: selectedPayment,
      idempotencyKey: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      addressId: activeOrderType === "delivery" ? selectedAddress : null,
      branchId:
        activeOrderType !== "delivery" ? selectedBranch : data?.branches[0]?.id,
      note: orderNote,
    };

    try {
      await postData(payload, "/api/user/order/checkout");
      toast.success(t("orderSuccess"));
      router.push(`${basePath}`);
    } catch {
      toast.error(t("orderFailed"));
    }
  };

  if (isLoadingCheckout || isLoadingCart || isLoadingSchedule)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <p className="font-bold text-gray-500">{t("loadingOptions")}</p>
      </div>
    );

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
        className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md active:scale-95 text-white mb-6"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 transition-colors"
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

          <div className="flex justify-between items-center">
            <span>{t("serviceFee")}</span>
            <span className="text-gray-900 dark:text-white font-bold">
              {serviceFee} {t("egp")}
            </span>
          </div>

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
        className="relative flex items-center justify-center w-full max-w-2xl gap-3 px-6 py-4 overflow-hidden font-bold text-gray-900 transition-all duration-300 shadow-lg group bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-yellow-400/30 hover:from-yellow-500 hover:to-yellow-600 hover:shadow-xl hover:shadow-yellow-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
      number: Number(addressForm.number) || 0,
      floor: Number(addressForm.floor) || 0,
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
              className="flex-1 py-3 font-bold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 text-sm"
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
