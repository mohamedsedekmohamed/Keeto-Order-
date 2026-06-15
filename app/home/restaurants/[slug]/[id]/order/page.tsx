"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  updateQuantityLocal,
  removeFromCartLocal,
  clearCartLocal,
  setCartItems,
} from "@/redux/cartSlice";
import useGet from "@/app/hooks/useGet";
import usePut from "@/app/hooks/usePut";
import useDelete from "@/app/hooks/useDelete";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Receipt,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../../../../../context/LanguageContext";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";

export default function Cart() {
  const items = useAppSelector((state) => state.cart.items);
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const params = useParams();
  const restaurantName = params.slug as string;
  const [showConfirm, setShowConfirm] = useState(false);
  const basePath = `/home/restaurants/${restaurantName}`;
  const router = useRouter();

  const CART_EXPIRY_KEY = "cart-expiry";

  // 👈 2. تهيئة الـ Hooks للتعديل والحذف
  const { putData } = usePut();
  const { deleteData } = useDelete("/users", "تم الحذف بنجاح");
  const { language } = useLanguage();
  const isRtl = language === "العربية";

  // 👈 1. جلب البيانات عند فتح الصفحة
  const {
    data: cartData,
    loading: fetchingCart,
    refetch,
  } = useGet<any>("/api/user/cart");

  // فحص الصلاحية فوراً عند الدخول لمنع وميض البيانات المنتهية
  useEffect(() => {
    const expiry = localStorage.getItem(CART_EXPIRY_KEY);
    if (expiry && Date.now() >= Number(expiry)) {
      // إذا كانت منتهية، نظف الـ Local State فوراً ولا تنتظر الـ API
      dispatch(clearCartLocal());
      localStorage.removeItem(CART_EXPIRY_KEY);

      // استدعاء الـ API لحذفها من السيرفر
      fetch("/api/user/cart", { method: "DELETE" })
        .then(() => toast.error(t("cartExpired")))
        .catch((err) =>
          console.error("Failed to clear expired cart backend", err),
        );
    }
  }, [dispatch, t]);

  useEffect(() => {
    // تحديث البيانات فقط لو لم تكن منتهية الصلاحية في الـ localStorage
    const expiry = localStorage.getItem(CART_EXPIRY_KEY);
    const isExpired = expiry ? Date.now() >= Number(expiry) : false;

    if (cartData?.data?.data?.items && !isExpired) {
      dispatch(setCartItems(cartData.data.data.items));
    }
  }, [cartData, dispatch]);

  // ✅ ضبط وقت الانتهاء بناءً على بيانات السيرفر الفعلية وليس الـ Local State المتقلب
  useEffect(() => {
    const serverItems = cartData?.data?.data?.items || [];
    if (serverItems.length > 0) {
      const existingExpiry = localStorage.getItem(CART_EXPIRY_KEY);
      if (!existingExpiry) {
        const expiryTime = Date.now() + 60 * 60 * 1000; // 60 دقيقة
        localStorage.setItem(CART_EXPIRY_KEY, expiryTime.toString());
      }
    } else if (cartData && serverItems.length === 0) {
      // السلة فارغة من السيرفر، امسح المفتاح
      localStorage.removeItem(CART_EXPIRY_KEY);
    }
  }, [cartData]);

  // ✅ فحص دوري مستقل أثناء تواجد المستخدم في الصفحة
  useEffect(() => {
    const checkCartExpiry = async () => {
      const expiry = localStorage.getItem(CART_EXPIRY_KEY);
      if (!expiry) return;

      if (Date.now() >= Number(expiry)) {
        try {
          await deleteData("/api/user/cart", t("cartCleared"));
          dispatch(clearCartLocal());
          localStorage.removeItem(CART_EXPIRY_KEY);
          toast.error(t("cartExpired"));
        } catch (error) {
          console.error("Failed to clear expired cart");
        }
      }
    };

    const interval = setInterval(checkCartExpiry, 30000); // فحص كل 30 ثانية
    return () => clearInterval(interval);
  }, [deleteData, dispatch, t]);

  const totalPrice = Number(cartData?.data?.data?.totalSummary?.subtotal || 0);

  // دوال التعامل مع الـ API
  const handleQuantityChange = async (
    cartId: string,
    currentQuantity: number,
    change: number,
  ) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      await putData({ quantity: newQuantity }, `/api/user/cart/${cartId}`);
      toast.success(t("quantityUpdated"));
      dispatch(updateQuantityLocal({ cartId, quantity: newQuantity }));
    } catch (error) {
      toast.error(t("failedUpdateQuantity"));
    }
  };

  const handleRemoveItem = async (cartId: string) => {
    try {
      await deleteData(`/api/user/cart/${cartId}`, t("itemRemoved"));
      dispatch(removeFromCartLocal(cartId));
    } catch (error) {
      toast.error(t("failedRemoveItem"));
    }
  };

  const handleClearCart = async () => {
    try {
      await deleteData("/api/user/cart", t("cartCleared"));
      dispatch(clearCartLocal());
      localStorage.removeItem(CART_EXPIRY_KEY);
    } catch (error) {
      toast.error(t("failedClearCart"));
    }
  };

  if (fetchingCart && items.length === 0) {
    return <Loading />;
  }

  // 🟡 Empty Cart
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 min-h-[60vh] animate-in fade-in duration-500">
        <div className="p-8 mb-6 rounded-full bg-gray-50 dark:bg-zinc-900">
          <ShoppingBag size={80} className="text-yellow-500 opacity-30" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("cartEmpty")}
        </p>
        <p className="mt-2 text-gray-500 dark:text-zinc-400">
          {t("orderDeliciousMealsNow")}
        </p>
        <button
          onClick={() => router.back()}
          className="absolute z-20 flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md mt-20 top-4 left-4 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="max-w-2xl p-4 pb-32 mx-auto duration-500 animate-in slide-in-from-bottom-4"
      dir={t("dir") || "rtl"}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            {t("shoppingCart")}
          </h2>
          <span className="flex items-center justify-center w-8 h-8 text-sm font-bold text-yellow-600 rounded-full bg-yellow-50 dark:bg-yellow-500/10">
            {items.length}
          </span>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 transition-all duration-300 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 active:scale-95"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">{t("clearAll")}</span>
        </button>
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 -mr-2 rounded-full shadow-md active:scale-95 text-white"
        >
          <ChevronLeft className="w-6 h-6 transform rotate-0 rtl:rotate-180" />
        </button>
      </div>

      {/* Items */}
      <div className="space-y-4">
        {Array.isArray(items) &&
          items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col justify-between gap-4 p-4 transition-all duration-300 bg-white border shadow-sm sm:flex-row sm:items-center border-gray-100/60 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-2xl bg-gray-50 dark:bg-zinc-800">
                  {item.image ? (
                    <img
                      src={item.image || "/placeholder.jpg"}
                      alt={item.name || "image"}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-2xl font-bold text-yellow-600 bg-yellow-50">
                      {item.name?.[0] || "?"}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    <span className="font-bold text-yellow-600 dark:text-yellow-500">
                      {item.unitPrice}
                    </span>{" "}
                    {t("currency")} {t("perItem")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full gap-3 sm:flex-col sm:items-end sm:w-auto">
                <span className="font-bold text-gray-900 dark:text-white sm:mb-2">
                  {item.totalPrice} {t("currency")}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRemoveItem(item.cartId)}
                    className="p-1.5 text-gray-400 transition-all duration-300 rounded-lg bg-gray-50 hover:text-red-500 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-center gap-3 p-1 border border-gray-100/60 bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 rounded-xl">
                    <button
                      onClick={() =>
                        handleQuantityChange(item.cartId, item.quantity, -1)
                      }
                      disabled={item.quantity <= 1}
                      className="p-1.5 transition-all duration-300 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-white disabled:opacity-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-4 font-bold text-center text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item.cartId, item.quantity, 1)
                      }
                      className="p-1.5 transition-all duration-300 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Summary */}
      <div className="p-6 mt-8 bg-white border border-gray-100/60 dark:bg-zinc-900 rounded-3xl">
        <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-zinc-400">
          <Receipt size={20} />
          <h3 className="font-semibold">{t("orderSummary")}</h3>
        </div>

        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
          <span className="text-gray-500 dark:text-zinc-400">
            {t("subtotal")}
          </span>
          <span className="font-bold text-gray-900 dark:text-white">
            {totalPrice} {t("currency")}
          </span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {t("total")}
          </span>
          <span className="text-2xl font-black text-yellow-600 dark:text-yellow-500">
            {totalPrice} {t("currency")}
          </span>
        </div>

        <Link
          href={`${basePath}/pay`}
          className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-gray-900 transition-all duration-300 bg-yellow-400 shadow-sm hover:bg-yellow-500 rounded-2xl shadow-yellow-400/10 active:scale-95"
        >
          <span>{t("checkoutNow")}</span>
          <ArrowLeft
            size={20}
            className={t("dir") === "ltr" ? "rotate-180" : ""}
          />
        </Link>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[90%] max-w-sm p-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300">
            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
              {t("confirm")}
            </h3>

            <p className="mb-6 text-sm text-gray-500 dark:text-zinc-400">
              {t("confirmClearCart")}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 transition bg-gray-100 rounded-xl hover:bg-gray-200 dark:bg-zinc-800 dark:text-white"
              >
                {t("cancel")}
              </button>

              <button
                onClick={() => {
                  handleClearCart();
                  setShowConfirm(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white transition bg-red-500 rounded-xl hover:bg-red-600"
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
