"use client";

import { useState } from "react";
import { useLanguage } from "../../../../../context/LanguageContext";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
// 👈 أضفنا استيراد Image هنا
import { 
  MapPin, 
  CreditCard, 
  ArrowLeft, 
  Truck, 
  Store, 
  CheckCircle2, 
  Navigation,
  Loader2
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Checkout() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams<{ id: string }>();
      const basePath = `/home/restaurants/${params.id}`;

  const [orderType, setOrderType] = useState<"delivery" | "takeaway" | "dine_in">("delivery");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");

  const { data: checkoutData, loading: isLoading } = useGet<any>(`/api/user/order/select?restaurantId=${params.id}`);
  const { postData, loading: isSubmitting } = usePost();

  const data = checkoutData?.data?.data;

  const handleConfirmOrder = async () => {
    if (!selectedPayment) return toast.error(t("selectPaymentError"));
    if (orderType === "delivery" && !selectedAddress) return toast.error(t("selectAddressError"));
    if (orderType !== "delivery" && !selectedBranch) return toast.error(t("selectBranchError"));

    const payload = {
      orderSource: "food_aggregator",
      orderType: orderType,
      paymentMethodId: selectedPayment,
      idempotencyKey: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      addressId: orderType === "delivery" ? selectedAddress : null,
      branchId: orderType !== "delivery" ? selectedBranch : data?.branches[0]?.id,
    };

    try {
      await postData(payload, "/api/user/order/checkout");
      toast.success(t("orderSuccess"));
      router.push(`${basePath}`);
    } catch (error) {
      toast.error(t("orderFailed"));
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
      <p className="font-bold text-gray-500">{t("loadingOptions")}</p>
    </div>
  );

  return (
    <div className="max-w-2xl p-4 pb-32 mx-auto duration-500 animate-in fade-in" dir={t("dir")}>
      
      <h2 className="mb-8 text-3xl font-black text-gray-900 dark:text-white">{t("completeOrder")}</h2>

      {/* 1. نوع الطلب */}
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

      {/* 2. العنوان (توصيل) */}
      {orderType === "delivery" && (
        <section className="mb-8 animate-in slide-in-from-top-2">
          <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
            <MapPin size={20} className="text-yellow-500" /> {t("deliveryAddress")}
          </h3>
          <div className="space-y-3">
            {data?.addresses?.map((addr: any) => (
              <div 
                key={addr.id}
                onClick={() => setSelectedAddress(addr.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  selectedAddress === addr.id ? "border-yellow-400 bg-white dark:bg-zinc-900" : "border-gray-100 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-xl">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="font-bold">{addr.title}</p>
                    <p className="text-sm text-gray-500">{addr.street}, {addr.number}</p>
                  </div>
                </div>
                {selectedAddress === addr.id && <CheckCircle2 size={20} className="text-yellow-500" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. الفرع (استلام / مطعم) */}
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
                  selectedBranch === branch.id ? "border-yellow-400 bg-white dark:bg-zinc-900" : "border-gray-100 dark:border-zinc-800"
                }`}
              >
                <div>
                  <p className="font-bold">{branch.name}</p>
                  <p className="text-sm text-gray-500">{branch.address}</p>
                </div>
                {selectedBranch === branch.id && <CheckCircle2 size={20} className="text-yellow-500" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. طريقة الدفع */}
      <section className="mb-8">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <CreditCard size={20} className="text-yellow-500" /> {t("paymentMethod")}
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {data?.paymentMethods?.map((method: any) => (
            <div 
              key={method.id}
              onClick={() => setSelectedPayment(method.id)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                selectedPayment === method.id ? "border-yellow-400 bg-white dark:bg-zinc-900" : "border-gray-100 dark:border-zinc-800"
              }`}
            >
              <div className="relative w-10 h-10 overflow-hidden">
              
                <img
  src={method.image || "/placeholder.jpg"}
  alt={method.name || "image"}
  className="object-cover w-full bg-gray-100 h-44"
/>
              </div>
              <div className="flex-1">
                <p className="font-bold">{method.name}</p>
                <p className="text-xs text-gray-500">{method.description}</p>
              </div>
              {selectedPayment === method.id && <CheckCircle2 size={20} className="text-yellow-500" />}
            </div>
          ))}
        </div>
      </section>

     
      <button
  disabled={isSubmitting}
  onClick={handleConfirmOrder}
  className="relative flex items-center justify-center w-full max-w-2xl gap-3 px-6 py-4 overflow-hidden font-bold text-gray-900 transition-all duration-300 shadow-lg group bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-yellow-400/30 hover:from-yellow-500 hover:to-yellow-600 hover:shadow-xl hover:shadow-yellow-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
>
  {/* glow effect */}
  <span className="absolute inset-0 transition duration-500 opacity-0 group-hover:opacity-100 bg-white/10 blur-xl" />

  {isSubmitting ? (
    <div className="flex items-center gap-2">
      <Loader2 className="animate-spin" size={20} />
      <span className="text-sm">{t("processing") || "Processing..."}</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span className="text-base">{t("confirmAndPay")}</span>

      <ArrowLeft
        size={20}
        className={`
          transition-transform duration-300
          group-hover:-translate-x-1
          ${t("dir") === "ltr" ? "rotate-180 group-hover:translate-x-1" : ""}
        `}
      />
    </div>
  )}
</button>

    </div>
  );
}