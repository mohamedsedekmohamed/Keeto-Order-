"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useLanguage } from "../../../../../../context/LanguageContext";
import useGet from "@/app/hooks/useGet";
import api from "@/api/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  History,
  ShoppingBag,
  Loader2,
  X,
  ReceiptText,
  Package,
  ChevronLeft,
  ChevronRight,
  Ban,
  AlertTriangle,
} from "lucide-react";

import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";

export default function OrdersPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const router = useRouter();

  // 1. Order details state management
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // 👈 States جديدة للتحكم في منتقي أسباب الإلغاء
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");

  const params = useParams();
  const restaurantId = params?.id as string;
  const restaurantName = params.slug as string;

  // 2. Fetch data from active and history endpoints respectively
  const {
    data: activeData,
    loading: loadingActive,
    refetch: refetchActive,
  } = useGet<any>("/api/user/order/active?restaurantId=" + restaurantId);
  const {
    data: historyData,
    loading: loadingHistory,
    refetch: refetchHistory,
  } = useGet<any>("/api/user/order/history?restaurantId=" + restaurantId);

  // 👈 جلب أسباب الإلغاء والبيانات المساعدة بناءً على الـ Endpoint المطلوب
  const { data: selectOptionsData } = useGet<any>(
    `/api/user/order/select?restaurantId=${restaurantId}`,
  );

  // استخراج مصفوفة الأسباب المتاحة من الـ Response المُرسل
  const cancelReasons =
    selectOptionsData?.data?.data?.reasons ||
    selectOptionsData?.data?.reasons ||
    [];

  // Helper function to safely normalize text strings for fallback checks
  const normalizeText = (str: string) =>
    str?.toLowerCase().replace(/[-_]/g, " ").trim();

  // ✅ FILTER ACTIVE ORDERS
  const activeOrders = activeData?.data?.data || activeData?.data || [];

  // ✅ FILTER HISTORY ORDERS
  const historyOrders = (
    historyData?.data?.data ||
    historyData?.data ||
    []
  ).filter((order: any) => {
    if (order.restaurantId && restaurantId) {
      return String(order.restaurantId) === String(restaurantId);
    }
    return (
      normalizeText(order?.restaurantName) === normalizeText(restaurantName)
    );
  });

  const currentOrders = activeTab === "active" ? activeOrders : historyOrders;
  const isLoadingList = activeTab === "active" ? loadingActive : loadingHistory;

  // 3. Dynamic Side Panel Data Loading Effect Hook
  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      return;
    }

    const fetchOrderDetails = async () => {
      setLoadingDetails(true);
      try {
        const response = await api.get(`/api/user/order/${selectedOrderId}`);
        if (response.data.success) {
          setSelectedOrder(response.data.data.data || response.data.data);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error(
          t("errorFetchingDetails") ||
            "Error pulling item data configurations.",
        );
        setSelectedOrderId(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrderId, t]);

  // ✅ دالة إلغاء الطلب مع إرسال الـ cancelReasonId للباك إند
  const handleCancelOrderSubmit = async () => {
    if (!selectedOrderId) return;
    if (!selectedReasonId) {
      toast.error(t("pleaseSelectReason") || "برجاء اختيار سبب الإلغاء أولاً");
      return;
    }

    setUpdatingStatus(true);
    try {
      // إرسال الطلب مع إرفاق الـ cancelReasonId المطلوب
      const response = await api.put(
        `/api/user/order/${selectedOrderId}/cancel`,
        {
          status: "cancelled",
          cancelReasonId: selectedReasonId,
        },
      );

      if (response.data.success || response.status === 200) {
        toast.success(
          t("orderCancelledSuccessfully") || "تم إلغاء الطلب بنجاح",
        );

        // إعادة تهيئة الحالات وإغلاق الـ Modals والتحديث
        setShowCancelModal(false);
        setSelectedOrderId(null);
        setSelectedReasonId("");
        refetchActive?.();
        refetchHistory?.();
      } else {
        toast.error(t("failedToCancel")  );
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(t("failedToCancel")  );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // تحديد ما إذا كان مسموحاً للمخدم بالإلغاء بناءً على حالة الطلب الحالية
  const isCancellationAllowed = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    const forbiddenStatuses = [
      "accepted",
      "delivered",
      "completed",
      "cancelled",
      "cooking",
      "on_the_way",
    ];
    return !forbiddenStatuses.includes(normalizedStatus);
  };

  return (
    <div
      className="max-w-2xl min-h-screen p-4 pb-24 mx-auto relative"
      dir={t("dir")}
    >
      {/* Header Layout */}
      <header className="mt-2 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            {t("myOrders")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {t("trackOrdersDesc")}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md active:scale-95 text-white"
        >
          <ChevronLeft className="w-6 h-6 transform rotate-0 rtl:rotate-180" />
        </button>
      </header>

      {/* Segmented Tab Controls */}
      <div className="flex p-1 mb-6 bg-gray-100 dark:bg-zinc-900 rounded-2xl">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            activeTab === "active"
              ? "bg-white dark:bg-zinc-800 text-yellow-500 shadow-sm"
              : "text-gray-500"
          }`}
        >
          <Clock size={18} />
          {t("activeOrders")}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            activeTab === "history"
              ? "bg-white dark:bg-zinc-800 text-yellow-500 shadow-sm"
              : "text-gray-500"
          }`}
        >
          <History size={18} />
          {t("orderHistory")}
        </button>
      </div>

      {/* Orders Map Listing View Wrapper */}
      <div className="space-y-4">
        {isLoadingList ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
          </div>
        ) : currentOrders.length > 0 ? (
          currentOrders.map((order: any, i: number) => (
            <motion.div
              key={order.orderId || order.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedOrderId(order.orderId || order.id)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl cursor-pointer hover:border-yellow-400 transition-all shadow-sm active:scale-[0.98]"
            >
              <div className="relative flex-shrink-0 w-16 h-16 overflow-hidden rounded-2xl bg-gray-50">
                <img
                  src={order.restaurantImage || "/placeholder.jpg"}
                  alt={order.restaurantName || "Restaurant logo"}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {order.restaurantName}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-1 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 rounded-lg uppercase">
                    {t(order.status) || order.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {order.orderNumber}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-black">
                    {order.totalAmount || order.total} {t("currency")}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <ShoppingBag size={12} />{" "}
                    {order.itemsCount || order.items?.length || 0} {t("items")}
                  </span>
                </div>
              </div>
              <div className="text-gray-300">
                {t("dir") === "rtl" ? (
                  <ChevronLeft size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={60} className="mb-4 opacity-20" />
            <p className="font-bold">{t("noOrdersYet")}</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
              {activeTab === "active"
                ? "If your order status changed to completed/delivered, it has moved to the 'Order History' tab."
                : "No historical logged transactions found for this establishment location."}
            </p>
          </div>
        )}
      </div>

      {/* Drawer Details Component View Panel Overlay */}
      <AnimatePresence>
        {selectedOrderId && (
          <>
            {/* Dark Sheet Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />

            {/* Sheet View Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-zinc-950 rounded-t-[40px] max-h-[92vh] overflow-y-auto shadow-2xl border-t dark:border-zinc-800"
            >
              <div className="p-6">
                {/* Visual Pull Bar Ornament */}
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mb-6" />

                {loadingDetails ? (
                  <div className="flex flex-col items-center gap-4 py-20">
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                    <p className="text-sm text-gray-500">
                      {t("loadingDetails")}
                    </p>
                  </div>
                ) : (
                  selectedOrder && (
                    <div className="space-y-6">
                      {/* Drawer Summary Banner Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 overflow-hidden shadow-md rounded-2xl">
                            <img
                              src={
                                selectedOrder.restaurantImage ||
                                "/placeholder.jpg"
                              }
                              alt={
                                selectedOrder.restaurantName ||
                                "Establishment Banner"
                              }
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div>
                            <h2 className="text-xl font-black">
                              {selectedOrder.restaurantName}
                            </h2>
                            <p className="text-xs text-gray-400">
                              {selectedOrder.orderNumber}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedOrderId(null)}
                          className="p-3 text-gray-500 transition-colors bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:text-red-500"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Breakdown Ledger Container Block */}
                      <div className="p-5 border border-gray-100 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl dark:border-zinc-800">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
                          <ShoppingBag size={14} /> {t("orderSummary")}
                        </h4>
                        <div className="space-y-4">
                          {(selectedOrder.items || []).map(
                            (item: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center justify-center w-7 h-7 bg-yellow-400 text-gray-900 text-[10px] font-black rounded-lg">
                                    {item.quantity || 1}x
                                  </span>
                                  <span className="text-sm font-bold">
                                    {item.foodName || item.name}
                                  </span>
                                </div>
                                <span className="text-sm font-black">
                                  {item.totalPrice || item.price}{" "}
                                  {t("currency")}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Aggregate Price Metrics Ledger */}
                      <div className="px-2 space-y-3">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{t("subtotal")}</span>
                          <span>
                            {selectedOrder.subtotal || selectedOrder.subTotal}{" "}
                            {t("currency")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{t("deliveryFee")}</span>
                          <span>
                            {selectedOrder.deliveryFee} {t("currency")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{t("serviceFee")}</span>
                          <span>
                            {selectedOrder.serviceFee} {t("currency")}
                          </span>
                        </div>
                        <div className="h-px my-2 bg-gray-100 dark:bg-zinc-800" />
                        <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white">
                          <span>{t("total")}</span>
                          <span className="text-yellow-500">
                            {selectedOrder.totalAmount || selectedOrder.total}{" "}
                            {t("currency")}
                          </span>
                        </div>
                      </div>

                      {/* Fixed Status Ribbon Footer banner */}
                      <div className="p-5 bg-yellow-400 rounded-[2rem] text-gray-900 flex items-center justify-between shadow-lg shadow-yellow-400/20">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl">
                            <ReceiptText size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-black opacity-60">
                              {t("orderStatus")}
                            </p>
                            <p className="text-lg font-black leading-none">
                              {t(selectedOrder.status) || selectedOrder.status}
                            </p>
                          </div>
                        </div>

                        {/* زر فتح مودال اختيار سبب الإلغاء */}
                        {isCancellationAllowed(selectedOrder.status) && (
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-colors shadow-md active:scale-95"
                          >
                            <Ban size={14} />
                            {t("cancelOrder") || "إلغاء الطلب"}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 👈 نافذة اختيار سبب الإلغاء (Cancel Reason Modal) */}
      <AnimatePresence>
        {showCancelModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[25%] md:max-w-md md:mx-auto bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] z-[90] shadow-2xl border dark:border-zinc-800"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl mb-4">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  {t("cancelOrderTitle")}
                </h3>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  {t("cancelOrderDesc")}
                </p>

                {/* قائمة الأسباب المسترجعة ديناميكياً */}
                <div className="w-full space-y-2 max-h-[200px] overflow-y-auto pr-1 mb-6">
                  {cancelReasons.length > 0 ? (
                    cancelReasons.map((reason: any) => (
                      <label
                        key={reason.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          selectedReasonId === reason.id
                            ? "border-red-500 bg-red-50/40 dark:bg-red-950/10 font-bold"
                            : "border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900"
                        }`}
                      >
                        <span className="text-sm text-gray-800 dark:text-zinc-200">
                          {t(reason.name) || reason.name}
                        </span>
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason.id}
                          checked={selectedReasonId === reason.id}
                          onChange={() => setSelectedReasonId(reason.id)}
                          className="w-4 h-4 accent-red-500 cursor-pointer"
                        />
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-4">
                      {t("noReasonsAvailable")}
                    </p>
                  )}
                </div>

                {/* أزرار التحكم والـ Actions */}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {t("back") || "تراجع"}
                  </button>
                  <button
                    onClick={handleCancelOrderSubmit}
                    disabled={updatingStatus || !selectedReasonId}
                    className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-red-600/10 flex items-center justify-center gap-2"
                  >
                    {updatingStatus ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      t("confirmCancel") 
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
