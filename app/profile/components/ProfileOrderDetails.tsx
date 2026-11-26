"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  CheckCircle2,
  Loader2,
  ReceiptText,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { OrderCreatedAt, PrepCountdown } from "./OrderTime";

type Translate = (key: string) => string | undefined;

interface OrderPart {
  optionNameAr?: string;
  optionName?: string;
  nameAr?: string;
  name?: string;
  price?: string | number;
}

interface OrderItem {
  quantity?: number;
  foodNameAr?: string;
  foodName?: string;
  name?: string;
  basePrice?: string | number;
  price?: string | number;
  variations?: string | OrderPart[];
  addons?: string | OrderPart[];
  note?: string;
}

export interface ProfileOrderDetailsData {
  orderId?: string;
  id?: string;
  status?: string;
  restaurantImage?: string;
  restaurantName?: string;
  restaurantNameAr?: string;
  dailyOrderNumber?: string | number;
  createdAt?: string;
  durationOrderPreparing?: number;
  cancellation?: {
    reason?: string;
  };
  items?: OrderItem[];
  subtotal?: string | number;
  subTotal?: string | number;
  deliveryFee?: string | number;
  serviceFee?: string | number;
  totalAmount?: string | number;
  total?: string | number;
  deliveryMan?: {
    name?: string;
    phone?: string;
  };
}

interface ProfileOrderDetailsProps {
  isOpen: boolean;
  isLoading: boolean;
  isRtl: boolean;
  isArabic: boolean;
  selectedOrder: ProfileOrderDetailsData | null;
  t: Translate;
  isFinalOrderStatus: (status: string | null | undefined) => boolean;
  getOrderStatusLabel: (order: ProfileOrderDetailsData) => string;
  onClose: () => void;
  onStartCancel: () => void;
}

const ORDER_STATUS_STEPS = [
  { key: "pending", labelFallbackEn: "Pending", labelFallbackAr: "قيد الانتظار" },
  { key: "accepted", labelFallbackEn: "Confirmed", labelFallbackAr: "تم التأكيد" },
  { key: "preparing", labelFallbackEn: "Preparing", labelFallbackAr: "قيد التحضير" },
  { key: "out_for_delivery", labelFallbackEn: "Ready", labelFallbackAr: "جاهز" },
  { key: "delivered", labelFallbackEn: "Delivered", labelFallbackAr: "تم التوصيل" },
];

function getOrderStatusStepIndex(status: string | null | undefined) {
  const normalized = status?.toLowerCase();
  const stepAliases: Record<string, number> = {
    pending: 0,
    accepted: 1,
    confirmed: 1,
    preparing: 2,
    out_for_delivery: 3,
    ready: 3,
    delivered: 4,
    completed: 4,
  };
  return normalized && normalized in stepAliases ? stepAliases[normalized] : 0;
}

function isCancelledOrderStatus(status: string | null | undefined) {
  const normalized = status?.toLowerCase();
  return (
    !!normalized &&
    ["cancelled", "canceled", "refund", "refunded", "rejected"].includes(
      normalized,
    )
  );
}

function isCancellationAllowed(status: string | null | undefined) {
  const normalized = status?.toLowerCase();
  return ![
    "accepted",
    "delivered",
    "completed",
    "cancelled",
    "preparing",
    "out_for_delivery",
    "refund",
  ].includes(normalized || "");
}

function parseOrderParts(value: string | OrderPart[] | undefined): OrderPart[] {
  try {
    const parsed: unknown =
      typeof value === "string" ? JSON.parse(value) : value || [];
    return Array.isArray(parsed) ? (parsed as OrderPart[]) : [];
  } catch {
    return [];
  }
}

export default function ProfileOrderDetails({
  isOpen,
  isLoading,
  isRtl,
  isArabic,
  selectedOrder,
  t,
  isFinalOrderStatus,
  getOrderStatusLabel,
  onClose,
  onStartCancel,
}: ProfileOrderDetailsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-zinc-950 rounded-t-[40px] max-h-[92vh] overflow-y-auto shadow-2xl border-t dark:border-zinc-800"
          >
            <div className="p-6">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mb-6" />

              {isLoading ? (
                <div className="flex flex-col items-center gap-4 py-20">
                  <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                  <p className="text-sm text-gray-500">
                    {t("loadingDetails") || "جاري تحميل التفاصيل..."}
                  </p>
                </div>
              ) : (
                selectedOrder && (
                  <div className="space-y-6">
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
                            {isRtl
                              ? selectedOrder.restaurantNameAr
                              : selectedOrder.restaurantName}
                          </h2>
                          <p className="text-xs text-gray-400">
                            {t("dailyOrderNumber") || "رقم الطلب"} :{" "}
                            {selectedOrder.dailyOrderNumber}
                          </p>
                          <OrderCreatedAt
                            createdAt={selectedOrder.createdAt}
                            t={t}
                            className="mt-1 block"
                          />
                          {selectedOrder.durationOrderPreparing &&
                            !isFinalOrderStatus(selectedOrder.status) && (
                              <PrepCountdown
                                orderKey={
                                  selectedOrder.orderId || selectedOrder.id
                                }
                                durationMinutes={
                                  selectedOrder.durationOrderPreparing
                                }
                                t={t}
                                className="mt-1.5"
                              />
                            )}
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-3 text-gray-500 transition-colors bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:text-red-500"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {selectedOrder.cancellation && (
                      <div className="flex items-start gap-3 p-4 border border-red-100 bg-red-50/60 dark:bg-red-950/20 dark:border-red-900/40 rounded-3xl">
                        <div className="flex items-center justify-center flex-shrink-0 text-red-500 bg-red-100 dark:bg-red-900/40 rounded-2xl w-10 h-10">
                          <Ban size={18} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] uppercase font-black text-red-400 tracking-wide">
                            {t("cancellationReason") || "سبب الإلغاء"}
                          </p>
                          <p className="text-sm font-bold text-red-700 dark:text-red-300 leading-snug">
                            {selectedOrder.cancellation.reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {!isCancelledOrderStatus(selectedOrder.status) && (
                      <div className="p-5 border border-gray-100 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl dark:border-zinc-800">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase mb-5 flex items-center gap-2">
                          <Truck size={14} />
                          {t("orderStatus") || "حالة الطلب"}
                        </h4>
                        <div className="flex flex-col">
                          {ORDER_STATUS_STEPS.map((step, index) => {
                            const currentIndex = getOrderStatusStepIndex(
                              selectedOrder.status,
                            );
                            const isCompleted = index < currentIndex;
                            const isCurrent = index === currentIndex;
                            const isLast = index === ORDER_STATUS_STEPS.length - 1;
                            const label =
                              t(step.key) ||
                              (isRtl
                                ? step.labelFallbackAr
                                : step.labelFallbackEn);

                            return (
                              <div
                                key={step.key}
                                className="flex items-stretch gap-3"
                              >
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`flex items-center justify-center flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors ${
                                      isCompleted
                                        ? "bg-yellow-400 border-yellow-400"
                                        : isCurrent
                                          ? "border-yellow-400 bg-white dark:bg-zinc-900"
                                          : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                    }`}
                                  >
                                    {isCompleted && (
                                      <CheckCircle2
                                        size={12}
                                        className="text-gray-900"
                                        strokeWidth={3}
                                      />
                                    )}
                                    {isCurrent && !isCompleted && (
                                      <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                                    )}
                                  </span>
                                  {!isLast && (
                                    <span
                                      className={`w-0.5 flex-1 min-h-[24px] ${
                                        isCompleted
                                          ? "bg-yellow-400"
                                          : "bg-gray-200 dark:bg-zinc-700"
                                      }`}
                                    />
                                  )}
                                </div>
                                <p
                                  className={`text-sm ${
                                    isLast ? "pb-0" : "pb-6"
                                  } ${
                                    isCurrent
                                      ? "font-black text-yellow-500"
                                      : isCompleted
                                        ? "font-bold text-gray-900 dark:text-white"
                                        : "font-bold text-gray-300 dark:text-zinc-600"
                                  }`}
                                >
                                  {label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="p-5 border border-gray-100 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl dark:border-zinc-800">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <ShoppingBag size={14} />{" "}
                        {t("orderSummary") || "ملخص الطلب"}
                      </h4>
                      <div className="space-y-4">
                        {(selectedOrder.items || []).map((item, index) => {
                          const parsedVariations = parseOrderParts(
                            item.variations,
                          );
                          const parsedAddons = parseOrderParts(item.addons);

                          return (
                            <div
                              key={index}
                              className="flex flex-col gap-2 pb-3 border-b border-gray-100 dark:border-zinc-800 last:border-0 last:pb-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center justify-center w-7 h-7 bg-yellow-400 text-gray-900 text-[10px] font-black rounded-lg">
                                    {item.quantity || 1}x
                                  </span>
                                  <span className="text-sm font-bold">
                                    {(isRtl
                                      ? item.foodNameAr
                                      : item.foodName) || item.name}
                                  </span>
                                </div>
                                <span className="text-sm font-black">
                                  {item.basePrice || item.price}{" "}
                                  {t("currency") || "ج.م"}
                                </span>
                              </div>

                              {(parsedVariations.length > 0 ||
                                parsedAddons.length > 0) && (
                                <div className="ml-10 flex flex-col gap-1">
                                  {parsedVariations.map((variation, partIndex) => (
                                    <div
                                      key={`v-${partIndex}`}
                                      className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400"
                                    >
                                      <span>
                                        •{" "}
                                        {(isRtl
                                          ? variation.optionNameAr
                                          : variation.optionName) ||
                                          variation.name ||
                                          t("variation")}
                                      </span>
                                    </div>
                                  ))}
                                  {parsedAddons.map((addon, partIndex) => (
                                    <div
                                      key={`a-${partIndex}`}
                                      className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400"
                                    >
                                      <span>
                                        +{" "}
                                        {(isArabic
                                          ? addon.nameAr
                                          : addon.name) ||
                                          addon.name ||
                                          t("addon")}
                                      </span>
                                      {addon.price && (
                                        <span>
                                          +{addon.price} {t("currency") || "ج.م"}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {item.note && (
                                <div className="ml-10 text-xs italic text-gray-400">
                                  {t("note") || "ملاحظة"}: {item.note}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="px-2 space-y-3">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{t("subtotal") || "المجموع الفرعي"}</span>
                        <span>
                          {selectedOrder.subtotal || selectedOrder.subTotal}{" "}
                          {t("currency") || "ج.م"}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{t("deliveryFee") || "رسوم التوصيل"}</span>
                        <span>
                          {selectedOrder.deliveryFee} {t("currency") || "ج.م"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{t("serviceFee") || "رسوم الخدمة"}</span>
                        <span>
                          {selectedOrder.serviceFee} {t("currency") || "ج.م"}
                        </span>
                      </div>
                      <div className="h-px my-2 bg-gray-100 dark:bg-zinc-800" />
                      <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white">
                        <span>{t("total") || "الإجمالي"}</span>
                        <span className="text-yellow-500">
                          {selectedOrder.totalAmount || selectedOrder.total}{" "}
                          {t("currency") || "ج.م"}
                        </span>
                      </div>
                    </div>

                    {selectedOrder.status === "out_for_delivery" &&
                      selectedOrder.deliveryMan && (
                        <div className="flex items-center justify-between mt-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-400/10 rounded-xl">
                          <span className="text-[11px] font-bold text-gray-700 dark:text-yellow-300">
                            {t("deliveryMan") || "عامل التوصيل"} :{" "}
                            {selectedOrder.deliveryMan.name}
                          </span>
                          <a
                            href={`tel:${selectedOrder.deliveryMan.phone}`}
                            onClick={(event) => event.stopPropagation()}
                            className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400"
                          >
                            {t("callDeliveryMan") || "اتصال بعامل التوصيل"} :{" "}
                            {selectedOrder.deliveryMan.phone}
                          </a>
                        </div>
                      )}

                    <div className="p-5 bg-yellow-400 rounded-[2rem] text-gray-900 flex items-center justify-between shadow-lg shadow-yellow-400/20">
                      <div className="flex items-center gap-4">
                        <div className="relative p-3 bg-white/20 rounded-2xl">
                          <ReceiptText size={24} />
                          {!isFinalOrderStatus(selectedOrder.status) && (
                            <span className="absolute -top-1 -right-1 flex w-3 h-3">
                              <span className="absolute inline-flex w-full h-full bg-green-500 rounded-full opacity-75 animate-ping" />
                              <span className="relative inline-flex w-3 h-3 bg-green-500 border-2 border-yellow-400 rounded-full" />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black opacity-60 flex items-center gap-1.5">
                            {!isFinalOrderStatus(selectedOrder.status) && (
                              <span className="relative flex w-1.5 h-1.5">
                                <span className="absolute inline-flex w-full h-full bg-green-500 rounded-full opacity-75 animate-ping" />
                                <span className="relative inline-flex w-1.5 h-1.5 bg-green-500 rounded-full" />
                              </span>
                            )}
                            {t("orderStatus") || "حالة الطلب"}
                          </p>
                          <p className="text-lg font-black leading-none">
                            {getOrderStatusLabel(selectedOrder)}
                          </p>
                        </div>
                      </div>

                      {isCancellationAllowed(selectedOrder.status) && (
                        <button
                          onClick={onStartCancel}
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
  );
}
