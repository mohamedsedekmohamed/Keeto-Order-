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

type Zone = { id: string; name: string };
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

  // ✅ Add Address Popup State
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: "",
    zoneId: "",
    type: "home",
    street: "",
    number: "",
    floor: "",
  });

  // 1. جلب بيانات خيارات الدفع والعناوين والفروع
  const {
    data: checkoutData,
    loading: isLoadingCheckout,
    refetch,
  } = useGet<any>(`/api/user/order/select?restaurantId=${params.id}`);

  // 2. جلب بيانات الكارت لحساب الـ subtotal
  const { data: cartRes, loading: isLoadingCart } =
    useGet<any>("/api/user/cart");

  const { data: zonesRes, loading: loadingZones } = useGet<any>(
    "/api/user/address/zone",
  );
  const { postData, loading: isSubmitting } = usePost();
  const { postData: postAddress, loading: postingAddress } =
    usePost("/api/user/address");

  const paymentMethods = [t("cash_on_delivery"), t("visa"), t("wallet")];
  const data = checkoutData?.data?.data;
  const zones: Zone[] = zonesRes?.data?.data || [];
  const cartItems: CartItem[] = cartRes?.data?.data || [];

  const inputClass =
    "w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all text-zinc-900 dark:text-white";

  // 🧮 حسابات ملخص الطلب ديناميكياً من ريسبرنس الكارت
  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.totalPrice || 0),
    0,
  );
  const deliveryFee = orderType === "delivery" ? data?.deliveryFee || 0 : 0; // قيمة التوصيل من الـ checkout data (أو 0 لو مش دليفري)
  const serviceFee = 5; // قيمة الخدمة الثابتة
  const total = subtotal + deliveryFee + serviceFee; // الإجمالي النهائي

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await postAddress(addressForm, null, t("address-added-success"));
      setShowAddressPopup(false);
      setAddressForm({
        title: "",
        zoneId: "",
        type: "home",
        street: "",
        number: "",
        floor: "",
      });
      refetch(); // تحديث البيانات لإظهار العنوان الجديد
    } catch {}
  };

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

  // عرض شاشة التحميل في حالة تحميل الكارت أو بيانات الـ Checkout
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
        className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md active:scale-95 text-white"
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
            {/* ✅ Add Address Button */}
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
          {paymentMethods.map((method: string) => (
            <div
              key={method}
              onClick={() => setSelectedPayment(method)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                selectedPayment === method
                  ? "border-yellow-400 bg-white dark:bg-zinc-900"
                  : "border-gray-100 dark:border-zinc-800"
              }`}
            >
              <div className="flex-1">
                <p className="font-bold">{method}</p>
              </div>
              {selectedPayment === method && (
                <CheckCircle2 size={20} className="text-yellow-500" />
              )}
            </div>
          ))}
        </div>
      </section>
      {/* مساحة كتابة الملاحظات */}
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

      {/* 5. Order Summary (ملخص الطلب) */}
      <section className="mb-8 p-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-gray-900 dark:text-white">
          <FileText size={20} className="text-yellow-500" />{" "}
          {t("orderSummary") || "Order Summary"}
        </h3>

        <div className="space-y-3 text-sm font-medium text-gray-600 dark:text-zinc-400">
          <div className="flex justify-between items-center">
            <span>{t("subtotal") || "Subtotal"}</span>
            <span className="text-gray-900 dark:text-white font-bold">
              {subtotal} {t("egp") || "EGP"}
            </span>
          </div>

          {orderType === "delivery" && (
            <div className="flex justify-between items-center">
              <span>{t("deliveryFee") || "Delivery Fee"}</span>
              <span className="text-gray-900 dark:text-white font-bold">
                {deliveryFee} {t("egp") || "EGP"}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span>{t("serviceFee") || "Service Fee"}</span>
            <span className="text-gray-900 dark:text-white font-bold">
              {serviceFee} {t("egp") || "EGP"}
            </span>
          </div>

          <hr className="border-gray-200 dark:border-zinc-800 my-2" />

          <div className="flex justify-between items-center text-base font-bold text-gray-900 dark:text-white pt-1">
            <span>{t("total") || "Total"}</span>
            <span className="text-yellow-500 text-lg">
              {total} {t("egp") || "EGP"}
            </span>
          </div>
        </div>
      </section>

      {/* Confirm Button */}
      <button
        disabled={isSubmitting}
        onClick={handleConfirmOrder}
        className="relative flex items-center justify-center w-full max-w-2xl gap-3 px-6 py-4 overflow-hidden font-bold text-gray-900 transition-all duration-300 shadow-lg group bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-yellow-400/30 hover:from-yellow-500 hover:to-yellow-600 hover:shadow-xl hover:shadow-yellow-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
      >
        <span className="absolute inset-0 transition duration-500 opacity-0 group-hover:opacity-100 bg-white/10 blur-xl" />
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">
              {t("processing") || "Processing..."}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-base">{t("confirmAndPay")}</span>
            <ArrowLeft
              size={20}
              className={`transition-transform duration-300 group-hover:-translate-x-1 ${t("dir") === "ltr" ? "rotate-180 group-hover:translate-x-1" : ""}`}
            />
          </div>
        )}
      </button>

      {/* ✅ Add Address Popup */}
      {showAddressPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">
                {t("add-address")}
              </h2>
              <button
                onClick={() => setShowAddressPopup(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <input
                name="title"
                placeholder={t("title")}
                value={addressForm.title}
                onChange={handleAddressChange}
                className={inputClass}
                required
              />

              <select
                name="zoneId"
                value={addressForm.zoneId}
                onChange={handleAddressChange}
                className={inputClass}
                required
              >
                <option value="" disabled>
                  {loadingZones ? t("loading") : t("select-zone")}
                </option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>

              <select
                name="type"
                value={addressForm.type}
                onChange={handleAddressChange}
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
                onChange={handleAddressChange}
                className={inputClass}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  name="number"
                  placeholder={t("number")}
                  value={addressForm.number}
                  onChange={handleAddressChange}
                  className={inputClass}
                  required
                />
                <input
                  name="floor"
                  placeholder={t("floor")}
                  value={addressForm.floor}
                  onChange={handleAddressChange}
                  className={inputClass}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressPopup(false)}
                  className="flex-1 py-3 font-bold text-zinc-700 bg-zinc-100 rounded-xl hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={postingAddress}
                  className="flex-1 py-3 font-bold text-gray-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 disabled:opacity-70 transition-colors"
                >
                  {postingAddress ? t("saving") : t("add-address-btn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
