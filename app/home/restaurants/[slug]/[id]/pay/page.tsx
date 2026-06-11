"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Zone = {
  id: string;
  name: string;
  nameAr?: string;
  cityId: string;
};
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

  // التحكم بظهور نافذة إضافة عنوان جديد
  const [showAddressPopup, setShowAddressPopup] = useState(false);

  // 1. جلب خيارات الدفع والعناوين والفروع
  const {
    data: checkoutData,
    loading: isLoadingCheckout,
    refetch,
  } = useGet<any>(`/api/user/order/select?restaurantId=${params.id}`);

  // 2. جلب بيانات السلة لحساب المجموع
  const { data: cartRes, loading: isLoadingCart } =
    useGet<any>("/api/user/cart");

  const { postData, loading: isSubmitting } = usePost();

  const data = checkoutData?.data?.data;
  const cartItems: CartItem[] = cartRes?.data?.data || [];
  const paymentMethods = data?.paymentMethods || [];

  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.totalPrice || 0),
    0,
  );
  const deliveryFee = orderType === "delivery" ? data?.deliveryFee || 0 : 0;
  const serviceFee = 5;
  const total = subtotal + deliveryFee + serviceFee;

  const handleConfirmOrder = async () => {
    if (!selectedPayment) return toast.error(t("selectPaymentError"));
    if (orderType === "delivery" && !selectedAddress)
      return toast.error(t("selectAddressError"));
    if (orderType !== "delivery" && !selectedBranch)
      return toast.error(t("selectBranchError"));

    const payload = {
      orderSource: "food_aggregator",
      orderType,
      paymentMethod: selectedPayment,
      idempotencyKey: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      addressId: orderType === "delivery" ? selectedAddress : null,
      branchId:
        orderType !== "delivery" ? selectedBranch : data?.branches[0]?.id,
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

  if (isLoadingCheckout || isLoadingCart)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <p className="font-bold text-gray-500">{t("loadingOptions")}</p>
      </div>
    );

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
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setOrderType(type.id as any)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                orderType === type.id
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
      {orderType === "delivery" && (
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
              data?.addresses?.map((addr: any) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedAddress === addr.id
                      ? "border-yellow-400 bg-white dark:bg-zinc-900"
                      : "border-gray-100 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-xl">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="font-bold">{addr.title}</p>
                      <p className="text-sm text-gray-500">
                        {addr.street}, {addr.number}
                      </p>
                    </div>
                  </div>
                  {selectedAddress === addr.id && (
                    <CheckCircle2 size={20} className="text-yellow-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* 3. Branch */}
      {orderType !== "delivery" && (
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

          {orderType === "delivery" && (
            <div className="flex justify-between items-center">
              <span>{t("deliveryFee")}</span>
              <span className="text-gray-900 dark:text-white font-bold">
                {deliveryFee} {t("egp")}
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
        disabled={isSubmitting}
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

      {/* Address Popup Component */}
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

/**
 * النافذة المنبثقة لإضافة عنوان مع فلترة المناطق ديناميكياً بناءً على المدينة المستخرجة
 */
/**
 * النافذة المنبثقة لإضافة عنوان مع فلترة المناطق ديناميكياً ودعم الموقع الحالي
 */
interface AddAddressPopupProps {
  onClose: () => void;
  onSuccess: (id?: string) => void;
}

function AddAddressPopup({ onClose, onSuccess }: AddAddressPopupProps) {
  const { t } = useLanguage();
  const { postData: postAddress, loading: postingAddress } =
    usePost("/api/user/address");

  const { data: zonesRes, loading: loadingZones } = useGet<any>(
    "/api/user/address/zone",
  );
  const allZones: Zone[] = zonesRes?.data?.data || [];

  const uniqueCityIds = Array.from(
    new Set(allZones.map((z) => z.cityId).filter(Boolean)),
  );

  const getCityDetails = (cityId: string) => {
    switch (cityId) {
      case "2cf2d384-9467-4d79-a269-d9527cdc66e2":
        return { en: "Alexandria", ar: "الإسكندرية" };
      case "ed19b748-8c20-4f65-bd89-769ab845dff6":
        return { en: "Cairo", ar: "القاهرة" };
      case "b7b476d1-d376-4515-b4be-1d5839e1be60":
        return { en: "Suez", ar: "السويس" };
      default:
        return { en: "Other City", ar: "مدينة أخرى" };
    }
  };

  const citiesList = uniqueCityIds.map((id) => ({
    id,
    name: t("dir") === "rtl" ? getCityDetails(id).ar : getCityDetails(id).en,
  }));

  const [selectedCityId, setSelectedCityId] = useState("");
  const [isLocating, setIsLocating] = useState(false); // حالة تحميل أثناء جلب الـ GPS

  const [addressForm, setAddressForm] = useState({
    title: "",
    zoneId: "",
    type: "home" as "home" | "work" | "other",
    street: "",
    number: "",
    floor: "",
    lat: null as number | null,
    lng: null as number | null,
  });

  const filteredZones = allZones.filter(
    (zone) => zone.cityId === selectedCityId,
  );

  const inputClass =
    "w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-zinc-900 dark:text-white text-sm";

  // دالة جلب الموقع الجغرافي الحالي لليوزر
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      return toast.error(
        t("dir") === "rtl"
          ? "المتصفح الخاص بك لا يدعم تحديد الموقع."
          : "Geolocation is not supported by your browser.",
      );
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddressForm((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
        setIsLocating(false);
        toast.success(
          t("dir") === "rtl"
            ? "تم تحديد موقعك الحالي بنجاح!"
            : "Current location fetched successfully!",
        );
      },
      (error) => {
        setIsLocating(false);
        console.error("Error getting location:", error);
        toast.error(
          t("dir") === "rtl"
            ? "فشل في تحديد الموقع. يرجى إعطاء الصلاحية للمتصفح."
            : "Failed to get location. Please allow location access.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCityId(e.target.value);
    setAddressForm((prev) => ({ ...prev, zoneId: "" }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // تأكيد وجود الـ Lat و Lng قبل الإرسال لو الباك إند بيطلبهم إجباري
    if (addressForm.lat === null || addressForm.lng === null) {
      return toast.error(
        t("dir") === "rtl"
          ? "يرجى تحديد الموقع الحالي أولاً لتأكيد إرسال الإحداثيات."
          : "Please capture your current location before submitting.",
      );
    }

    // تجهيز الداتا مع تحويل الأرقام إلى Numeric لضمان سلامة الـ API
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

        {/* زرار جلب الموقع الحالي */}
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

        {/* عرض الإحداثيات بشكل خفيف كـ Feedback لليوزر */}
        {addressForm.lat && addressForm.lng && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl flex items-center gap-2 text-xs font-semibold text-green-700 dark:text-green-400 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>
              {t("dir") === "rtl"
                ? `تم التقاط الموقع: (${addressForm.lat.toFixed(4)}, ${addressForm.lng.toFixed(4)})`
                : `Location captured: (${addressForm.lat.toFixed(4)}, ${addressForm.lng.toFixed(4)})`}
            </span>
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

          <select
            name="cityId"
            value={selectedCityId}
            onChange={handleCityChange}
            className={inputClass}
            required
          >
            <option value="" disabled>
              {loadingZones ? t("loading") : t("select-city") || "Select City"}
            </option>
            {citiesList.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>

          <select
            name="zoneId"
            value={addressForm.zoneId}
            onChange={handleInputChange}
            className={inputClass}
            disabled={!selectedCityId || loadingZones}
            required
          >
            <option value="" disabled>
              {loadingZones
                ? t("loading")
                : !selectedCityId
                  ? t("select-city-first") || "Please select a city first"
                  : t("select-zone")}
            </option>
            {filteredZones.map((z) => (
              <option key={z.id} value={z.id}>
                {t("dir") === "rtl" && z.nameAr ? z.nameAr : z.name}
              </option>
            ))}
          </select>

          <select
            name="type"
            value={addressForm.type}
            onChange={handleInputChange}
            className={inputClass}
          >
            <option value="home">{t("home")}</option>
            <option value="work">{t("work")}</option>
            <option value="other">{t("other")}</option>
          </select>

          <input
            name="street"
            placeholder={t("street")}
            value={addressForm.street}
            onChange={handleInputChange}
            className={inputClass}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="number"
              type="number"
              placeholder={t("number")}
              value={addressForm.number}
              onChange={handleInputChange}
              className={inputClass}
              required
            />
            <input
              name="floor"
              type="number"
              placeholder={t("floor")}
              value={addressForm.floor}
              onChange={handleInputChange}
              className={inputClass}
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
