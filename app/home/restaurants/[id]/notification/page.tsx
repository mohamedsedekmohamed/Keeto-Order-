"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useLanguage } from "../../../../../context/LanguageContext";
import useGet from "@/hooks/useGet";
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
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // 1. حالات تفاصيل الطلب (Axios & useEffect)
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 2. جلب القوائم (Active/History) باستخدام الـ Hook الخاص بك
  const { data: activeData, loading: loadingActive } = useGet<any>("/api/user/order/active");
  const { data: historyData, loading: loadingHistory } = useGet<any>("/api/user/order/history");

  const activeOrders = activeData?.data?.data || [];
  const historyOrders = historyData?.data?.data || [];
  const currentOrders = activeTab === "active" ? activeOrders : historyOrders;
  const isLoadingList = activeTab === "active" ? loadingActive : loadingHistory;

  // 3. تأثير جلب التفاصيل عند تغيير الـ ID المختار
  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      return;
    }

    const fetchOrderDetails = async () => {
      setLoadingDetails(true);
      try {
        // تأكد من المسار الكامل للـ API الخاص بك
        const response = await api.get(`/api/user/order/${selectedOrderId}`);
        if (response.data.success) {
          setSelectedOrder(response.data.data.data);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error(t("errorFetchingDetails") || "حدث خطأ في جلب التفاصيل");
        setSelectedOrderId(null); // إغلاق المودال في حالة الخطأ
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrderId, t]);

  return (
    <div className="max-w-2xl min-h-screen p-4 pb-24 mx-auto" dir={t("dir")}>
      
      {/* Header */}
      <header className="mt-4 mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t("myOrders")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{t("trackOrdersDesc")}</p>
      </header>

      {/* Tabs */}
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

      {/* List Area */}
      <div className="space-y-4">
        {isLoadingList ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
          </div>
        ) : currentOrders.length > 0 ? (
          currentOrders.map((order: any, i: number) => (
            <motion.div
              key={order.orderId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedOrderId(order.orderId)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl cursor-pointer hover:border-yellow-400 transition-all shadow-sm active:scale-[0.98]"
            >
              <div className="relative flex-shrink-0 w-16 h-16 overflow-hidden rounded-2xl bg-gray-50">
                <Image src={order.restaurantImage} alt={order.restaurantName} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">{order.restaurantName}</h3>
                  <span className="text-[10px] font-bold px-2 py-1 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 rounded-lg uppercase">
                    {t(order.status)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{order.orderNumber}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-black">{order.totalAmount} {t("currency")}</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <ShoppingBag size={12} /> {order.itemsCount} {t("items")}
                  </span>
                </div>
              </div>
              <div className="text-gray-300">
                {t("dir") === "rtl" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={60} className="mb-4 opacity-20" />
            <p className="font-bold">{t("noOrdersYet")}</p>
          </div>
        )}
      </div>

      {/* --- Details Side Panel (Modal) --- */}
      <AnimatePresence>
        {selectedOrderId && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            
            {/* Details Panel */}
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-zinc-950 rounded-t-[40px] max-h-[92vh] overflow-y-auto shadow-2xl border-t dark:border-zinc-800"
            >
              <div className="p-6">
                {/* Pull Bar */}
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mb-6" />
                
                {loadingDetails ? (
                  <div className="flex flex-col items-center gap-4 py-20">
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                    <p className="text-sm text-gray-500">{t("loadingDetails")}</p>
                  </div>
                ) : selectedOrder && (
                  <div className="space-y-6">
                    {/* Header Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 overflow-hidden shadow-md rounded-2xl">
                          <Image src={selectedOrder.restaurantImage} alt="" fill className="object-cover" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black">{selectedOrder.restaurantName}</h2>
                          <p className="text-xs text-gray-400">{selectedOrder.orderNumber}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedOrderId(null)} 
                        className="p-3 text-gray-500 transition-colors bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:text-red-500"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Order Items List */}
                    <div className="p-5 border border-gray-100 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl dark:border-zinc-800">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <ShoppingBag size={14} /> {t("orderSummary")}
                      </h4>
                      <div className="space-y-4">
                        {selectedOrder.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-7 h-7 bg-yellow-400 text-gray-900 text-[10px] font-black rounded-lg">
                                {item.quantity}x
                              </span>
                              <span className="text-sm font-bold">{item.foodName}</span>
                            </div>
                            <span className="text-sm font-black">{item.totalPrice} {t("currency")}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing Table */}
                    <div className="px-2 space-y-3">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{t("subtotal")}</span>
                        <span>{selectedOrder.subtotal} {t("currency")}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{t("deliveryFee")}</span>
                        <span>{selectedOrder.deliveryFee} {t("currency")}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{t("serviceFee")}</span>
                        <span>{selectedOrder.serviceFee} {t("currency")}</span>
                      </div>
                      <div className="h-px my-2 bg-gray-100 dark:bg-zinc-800" />
                      <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white">
                        <span>{t("total")}</span>
                        <span className="text-yellow-500">{selectedOrder.totalAmount} {t("currency")}</span>
                      </div>
                    </div>

                    {/* Footer Status */}
                    <div className="p-5 bg-yellow-400 rounded-[2rem] text-gray-900 flex items-center gap-4 shadow-lg shadow-yellow-400/20">
                      <div className="p-3 bg-white/20 rounded-2xl">
                        <ReceiptText size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black opacity-60">{t("orderStatus")}</p>
                        <p className="text-lg font-black leading-none">{t(selectedOrder.status)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}