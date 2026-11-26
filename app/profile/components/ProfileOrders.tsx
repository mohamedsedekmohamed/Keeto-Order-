"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import ProfileAccordion from "./ProfileAccordion";
import { OrderCreatedAt, PrepCountdown } from "./OrderTime";

type Translate = (key: string) => string | undefined;
type OrderTab = "active" | "history";

interface ProfileOrder {
  orderId?: string;
  id?: string;
  restaurantImage?: string;
  restaurantName?: string;
  restaurantNameAr?: string;
  status?: string;
  dailyOrderNumber?: string | number;
  totalAmount?: string | number;
  total?: string | number;
  itemsCount?: number;
  items?: unknown[];
  createdAt?: string;
  durationOrderPreparing?: number;
  deliveryMan?: {
    name?: string;
    phone?: string;
  };
}

interface ProfileOrdersProps {
  isOpen: boolean;
  isRtl: boolean;
  isLoading: boolean;
  orderSubTab: OrderTab;
  currentOrders: ProfileOrder[];
  t: Translate;
  getOrderStatusLabel: (order: ProfileOrder) => string;
  isFinalOrderStatus: (status: string | null | undefined) => boolean;
  onToggle: () => void;
  onChangeTab: (tab: OrderTab) => void;
  onSelectOrder: (id: string | null) => void;
}

export default function ProfileOrders({
  isOpen,
  isRtl,
  isLoading,
  orderSubTab,
  currentOrders,
  t,
  getOrderStatusLabel,
  isFinalOrderStatus,
  onToggle,
  onChangeTab,
  onSelectOrder,
}: ProfileOrdersProps) {
  return (
    <ProfileAccordion
      icon={<Truck size={18} />}
      label={t("orderTracking") || "تتبع الطلبات"}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="p-6 sm:p-8 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t("myOrders") || "طلباتي"}
        </h3>

        <div className="flex p-1 bg-gray-100 dark:bg-zinc-800/60 rounded-2xl">
          <button
            onClick={() => onChangeTab("active")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              orderSubTab === "active"
                ? "bg-white dark:bg-zinc-900 text-yellow-500 shadow-sm"
                : "text-gray-500 dark:text-zinc-400"
            }`}
          >
            <Clock size={16} />
            {t("activeOrders") || "الطلبات النشطة"}
          </button>
          <button
            onClick={() => onChangeTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              orderSubTab === "history"
                ? "bg-white dark:bg-zinc-900 text-yellow-500 shadow-sm"
                : "text-gray-500 dark:text-zinc-400"
            }`}
          >
            <History size={16} />
            {t("orderHistory") || "سجل الطلبات"}
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
          ) : currentOrders.length > 0 ? (
            currentOrders.map((order, index) => (
              <motion.div
                key={order.orderId || order.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectOrder(order.orderId || order.id || null)}
                className="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:border-yellow-400/50 transition-all active:scale-[0.98]"
              >
                <div className="relative flex-shrink-0 w-14 h-14 overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-800">
                  <img
                    src={order.restaurantImage || "/placeholder.jpg"}
                    alt={order.restaurantName || "Restaurant logo"}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">
                      {isRtl ? order.restaurantNameAr : order.restaurantName}
                    </h4>
                    {isFinalOrderStatus(order.status) ? (
                      <span className="text-[10px] font-bold px-2 py-1 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 rounded-lg uppercase whitespace-nowrap">
                        {getOrderStatusLabel(order)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg uppercase whitespace-nowrap">
                        <span className="relative flex w-1.5 h-1.5">
                          <span className="absolute inline-flex w-full h-full bg-green-500 rounded-full opacity-75 animate-ping" />
                          <span className="relative inline-flex w-1.5 h-1.5 bg-green-500 rounded-full" />
                        </span>
                        {getOrderStatusLabel(order)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {t("dailyOrderNumber") || "رقم الطلب"} :{" "}
                    {order.dailyOrderNumber}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      {order.totalAmount || order.total} {t("currency") || "ج.م"}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <ShoppingBag size={12} />{" "}
                      {order.itemsCount || order.items?.length || 0}{" "}
                      {t("items") || "عناصر"}
                    </span>
                  </div>

                  <OrderCreatedAt
                    createdAt={order.createdAt}
                    t={t}
                    className="mt-2 block"
                  />

                  {orderSubTab === "active" &&
                    order.durationOrderPreparing && (
                      <PrepCountdown
                        orderKey={order.orderId || order.id}
                        durationMinutes={order.durationOrderPreparing}
                        t={t}
                        className="mt-1"
                      />
                    )}

                  {order.status === "out_for_delivery" && order.deliveryMan && (
                    <div className="flex items-center justify-between mt-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-400/10 rounded-xl">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-yellow-300">
                        {order.deliveryMan.name}
                      </span>
                      <a
                        href={`tel:${order.deliveryMan.phone}`}
                        onClick={(event) => event.stopPropagation()}
                        className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400"
                      >
                        {order.deliveryMan.phone}
                      </a>
                    </div>
                  )}
                </div>
                <div className="text-gray-300 dark:text-zinc-600">
                  {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-500 dark:text-zinc-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
              <p className="font-bold">
                {t("noOrdersYet") || "لا توجد طلبات حتى الآن."}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                {orderSubTab === "active"
                  ? t("noActiveOrdersDesc") ||
                    "إذا تغيرت حالة طلبك إلى مكتمل/تم التوصيل، فقد انتقل إلى تبويب 'سجل الطلبات'."
                  : t("noHistoryOrdersDesc") ||
                    "لا يوجد سجل طلبات سابقة لهذا المطعم."}
              </p>
            </div>
          )}
        </div>
      </div>
    </ProfileAccordion>
  );
}
