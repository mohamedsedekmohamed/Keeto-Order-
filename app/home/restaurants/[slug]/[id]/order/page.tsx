"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useMenu, type MenuItem } from "@/context/RestaurantContext";
import { useTenant } from "@/context/TenantContext";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import api from "@/api/api";
import type { CartItem } from "@/redux/cartSlice";

type WeightRequestStatus =
  | "idle"
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "error";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const getWeightRequestResponseData = (response: unknown) => {
  const root = asRecord(response);
  const outerData = asRecord(root?.data);
  const innerData = asRecord(outerData?.data);
  return innerData ?? outerData ?? root;
};

const getWeightRequestPayload = (response: unknown) => {
  const payload = getWeightRequestResponseData(response);
  return (
    asRecord(payload?.weightRequest) ??
    asRecord(payload?.request) ??
    payload
  );
};

const getWeightRequestId = (response: unknown): string | null => {
  const payload = getWeightRequestPayload(response);
  const id =
    payload?.weightRequestId ??
    payload?.weight_request_id ??
    payload?.requestId ??
    payload?.request_id ??
    payload?.id;
  return typeof id === "string" || typeof id === "number"
    ? String(id)
    : null;
};

const normalizeWeightRequestStatus = (
  response: unknown,
): "pending" | "accepted" | "rejected" | "unknown" => {
  const responseData = getWeightRequestResponseData(response);
  const payload = getWeightRequestPayload(response);
  const rawStatus =
    payload?.status ??
    payload?.requestStatus ??
    payload?.request_status ??
    payload?.state;
  const canCheckout = payload?.canCheckout ?? responseData?.canCheckout;
  if (typeof rawStatus !== "string") {
    return canCheckout === true ? "accepted" : "unknown";
  }

  const status = rawStatus.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (
    ["rejected", "declined", "refused", "cancelled", "canceled"].includes(
      status,
    )
  ) {
    return "rejected";
  }
  const pendingStatuses = [
    "pending",
    "requested",
    "processing",
    "under_review",
    "waiting",
    "in_progress",
    "awaiting_weighing",
  ];
  if (
    [
      "accepted",
      "approved",
      "confirmed",
      "completed",
      "success",
      "successful",
      "awaiting_customer_approval",
    ].includes(status)
  ) {
    return "accepted";
  }
  if (canCheckout === true) return "accepted";
  if (canCheckout === false) {
    return pendingStatuses.includes(status) ? "pending" : "unknown";
  }
  if (pendingStatuses.includes(status)) {
    return "pending";
  }
  return "unknown";
};

export default function Cart() {
  const items = useAppSelector((state) => state.cart.items);
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { menu, isLoading: isLoadingMenu } = useMenu();
  const params = useParams();
  const { tenant, buildLink } = useTenant();
  const restaurantName = (params?.slug as string) || tenant?.slug || "";
  const [showConfirm, setShowConfirm] = useState(false);
  const basePath = `/home/restaurants/${restaurantName}`;
  const router = useRouter();
  const restaurantId = params?.id as string;
  const { data } = useGet<any>(
    `/api/user/restaurants/resturant-schedules/${restaurantId}`,
  );
  const schedule = data?.data?.data;
  const isOpen = schedule?.isOpenNow ?? false;
  const CART_EXPIRY_KEY = "cart-expiry";

  // 👈 2. تهيئة الـ Hooks للتعديل والحذف
  const { putData } = usePut();
  const { deleteData } = useDelete("/users", "تم الحذف بنجاح");
  const { language } = useLanguage();
  const isRtl = language === "العربية";
  const weightRequestStorageKey = restaurantId
    ? `weight-request-${restaurantId}`
    : null;
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [weightRequestId, setWeightRequestId] = useState<string | null>(null);
  const [weightRequestStatus, setWeightRequestStatus] =
    useState<WeightRequestStatus>("idle");
  const [weightRequestError, setWeightRequestError] = useState<string | null>(
    null,
  );
  const [isSendingWeightRequest, setIsSendingWeightRequest] = useState(false);
  const [isCancellingWeightRequest, setIsCancellingWeightRequest] =
    useState(false);
  const [weightRequestRestored, setWeightRequestRestored] = useState(false);
  const weightItems = useMemo(
    () => items.filter((item) => item.sold_by === "weight"),
    [items],
  );
  const menuFoodById = useMemo(() => {
    const foods = new Map<string, MenuItem>();
    menu?.forEach((category) =>
      category.foods.forEach((food) => foods.set(food.id, food)),
    );
    return foods;
  }, [menu]);
  const enrichCartItems = useCallback(
    (cartItems: CartItem[]) =>
      cartItems.map((item) => {
        const food = item.foodId ? menuFoodById.get(item.foodId) : undefined;
        return {
          ...item,
          sold_by: item.sold_by ?? food?.sold_by,
          weight_unit: item.weight_unit ?? food?.weight_unit,
        };
      }),
    [menuFoodById],
  );

  const persistWeightRequestState = useCallback(
    (status: WeightRequestStatus, requestId: string | null = null) => {
      setWeightRequestStatus(status);
      setWeightRequestId(requestId);
      setWeightRequestError(null);

      if (!weightRequestStorageKey) return;
      if (status === "idle" || status === "error") {
        localStorage.removeItem(weightRequestStorageKey);
        return;
      }

      const cartIds = items
        .filter((item) => item.sold_by === "weight")
        .map((item) => item.cartId)
        .sort();
      localStorage.setItem(
        weightRequestStorageKey,
        JSON.stringify({ status, requestId, cartIds }),
      );
    },
    [items, weightRequestStorageKey],
  );

  // 👈 1. جلب البيانات عند فتح الصفحة
  // بنبعت restaurantId مع الريكوست عشان السيرفر يرجع سلة المطعم ده
  // بالظبط، مش أي سلة تانية مرتبطة بالتوكن بس
  const {
    data: cartData,
    loading: fetchingCart,
    refetch,
  } = useGet<any>(
    restaurantId ? `/api/user/cart?restaurantId=${restaurantId}` : null,
  );
  const weightRequestPollActionsRef = useRef({
    persistWeightRequestState,
    refetch,
    t,
  });

  useEffect(() => {
    weightRequestPollActionsRef.current = {
      persistWeightRequestState,
      refetch,
      t,
    };
  }, [persistWeightRequestState, refetch, t]);

  // فحص الصلاحية فوراً عند الدخول لمنع وميض البيانات المنتهية
  useEffect(() => {
    const expiry = localStorage.getItem(CART_EXPIRY_KEY);
    if (expiry && Date.now() >= Number(expiry)) {
      // إذا كانت منتهية، نظف الـ Local State فوراً ولا تنتظر الـ API
      dispatch(clearCartLocal());
      localStorage.removeItem(CART_EXPIRY_KEY);

      // استدعاء الـ API لحذفها من السيرفر
      fetch(
        restaurantId
          ? `/api/user/cart?restaurantId=${restaurantId}`
          : "/api/user/cart",
        { method: "DELETE" },
      )
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

    const cartItems = cartData?.data?.data?.items;
    if (Array.isArray(cartItems) && !isExpired) {
      dispatch(setCartItems(enrichCartItems(cartItems)));
    } else if (cartData?.data?.data && !isExpired) {
      console.error("Unexpected cart response: expected an items array");
    }
  }, [cartData, dispatch, enrichCartItems]);

  useEffect(() => {
    setWeightInputs((previous) => {
      const next = { ...previous };
      weightItems.forEach((item) => {
        if (next[item.cartId] === undefined) {
          const weight = item.finalWeight ?? item.weight;
          next[item.cartId] = weight == null ? "" : String(weight);
        }
      });
      return next;
    });
  }, [weightItems]);

  useEffect(() => {
    if (weightRequestStatus !== "accepted") return;
    setWeightInputs(
      Object.fromEntries(
        weightItems.map((item) => [
          item.cartId,
          (item.finalWeight ?? item.weight) == null
            ? ""
            : String(item.finalWeight ?? item.weight),
        ]),
      ),
    );
  }, [weightItems, weightRequestStatus]);

  useEffect(() => {
    const serverItems = cartData?.data?.data?.items;
    if (
      isLoadingMenu ||
      !weightRequestStorageKey ||
      !Array.isArray(serverItems)
    ) {
      return;
    }

    const cartIds = enrichCartItems(serverItems)
      .filter((item) => item.sold_by === "weight")
      .map((item) => String(item.cartId))
      .sort();
    const savedState = localStorage.getItem(weightRequestStorageKey);
    if (!savedState) {
      setWeightRequestStatus("idle");
      setWeightRequestId(null);
      setWeightRequestRestored(true);
      return;
    }

    try {
      const parsed = JSON.parse(savedState);
      const savedCartIds = Array.isArray(parsed?.cartIds)
        ? parsed.cartIds.map(String).sort()
        : [];
      const validStatus = [
        "pending",
        "accepted",
        "rejected",
        "cancelled",
      ].includes(parsed?.status);
      const validRequestId =
        parsed?.status !== "pending" ||
        (typeof parsed?.requestId === "string" && parsed.requestId.length > 0);

      if (
        !validStatus ||
        !validRequestId ||
        JSON.stringify(cartIds) !== JSON.stringify(savedCartIds)
      ) {
        localStorage.removeItem(weightRequestStorageKey);
        setWeightRequestStatus("idle");
        setWeightRequestId(null);
      } else {
        setWeightRequestStatus(parsed.status);
        setWeightRequestId(
          parsed.status === "pending" || parsed.status === "accepted"
            ? parsed.requestId || null
            : null,
        );
      }
    } catch (error) {
      console.error("Failed to restore weight request state", error);
      localStorage.removeItem(weightRequestStorageKey);
      setWeightRequestStatus("idle");
      setWeightRequestId(null);
    }

    setWeightRequestRestored(true);
  }, [cartData, enrichCartItems, isLoadingMenu, weightRequestStorageKey]);

  useEffect(() => {
    const cartResponse = asRecord(cartData?.data?.data);
    const activeRequest =
      asRecord(cartResponse?.activeWeightRequest) ??
      asRecord(cartResponse?.weightRequest);
    const responseItems = Array.isArray(cartResponse?.items)
      ? cartResponse.items
      : [];
    const requestId =
      activeRequest?.id ??
      responseItems
        .map(asRecord)
        .find((item) => item?.weightRequestId)?.weightRequestId;
    if (
      activeRequest?.status !== "awaiting_customer_approval" ||
      (typeof requestId !== "string" && typeof requestId !== "number") ||
      cartResponse?.canCheckout !== true
    ) {
      return;
    }

    persistWeightRequestState("accepted", String(requestId));
    setWeightInputs((previous) => {
      let changed = false;
      const next = { ...previous };
      responseItems.forEach((value: unknown) => {
        const item = asRecord(value);
        const finalWeightValue = item?.finalWeight;
        const finalWeight = Number(finalWeightValue);
        if (
          item?.sold_by === "weight" &&
          (typeof item.cartId === "string" ||
            typeof item.cartId === "number") &&
          (typeof finalWeightValue === "string" ||
            typeof finalWeightValue === "number") &&
          Number.isFinite(finalWeight) &&
          finalWeight > 0
        ) {
          const cartId = String(item.cartId);
          const weight = String(finalWeightValue);
          if (next[cartId] !== weight) {
            next[cartId] = weight;
            changed = true;
          }
        }
      });
      return changed ? next : previous;
    });
  }, [cartData, persistWeightRequestState]);

  useEffect(() => {
    if (
      !weightRequestRestored ||
      weightRequestStatus !== "pending" ||
      !weightRequestId
    ) {
      return;
    }

    let active = true;
    let requestInFlight = false;
    const checkWeightRequest = async () => {
      if (requestInFlight) return;
      requestInFlight = true;

      try {
        const response = await api.get(
          `/api/user/weight-requests/${encodeURIComponent(weightRequestId)}`,
        );
        if (!active) return;

        const status = normalizeWeightRequestStatus(response.data);
        if (status === "accepted") {
          const {
            persistWeightRequestState,
            refetch,
            t,
          } = weightRequestPollActionsRef.current;
          const responseItems =
            getWeightRequestPayload(response.data)?.items ??
            getWeightRequestResponseData(response.data)?.items;
          if (Array.isArray(responseItems)) {
            setWeightInputs((previous) => {
              const next = { ...previous };
              responseItems.forEach((value) => {
                const requestItem = asRecord(value);
                const cartItemId = requestItem?.cartItemId;
                const finalWeight = requestItem?.finalWeight;
                const normalizedWeight =
                  typeof finalWeight === "string" ||
                  typeof finalWeight === "number"
                    ? Number(finalWeight)
                    : NaN;
                if (
                  (typeof cartItemId === "string" ||
                    typeof cartItemId === "number") &&
                  Number.isFinite(normalizedWeight) &&
                  normalizedWeight > 0
                ) {
                  next[String(cartItemId)] = String(normalizedWeight);
                }
              });
              return next;
            });
          }
          persistWeightRequestState("accepted", weightRequestId);
          await refetch();
          toast.success(t("weightRequestAccepted"));
        } else if (status === "rejected") {
          weightRequestPollActionsRef.current.persistWeightRequestState(
            "rejected",
          );
          toast.error(
            weightRequestPollActionsRef.current.t("weightRequestRejected"),
          );
        } else if (status === "unknown") {
          setWeightRequestError(
            weightRequestPollActionsRef.current.t(
              "weightRequestStatusUnknown",
            ),
          );
        } else {
          setWeightRequestError(null);
        }
      } catch (error) {
        if (active) {
          console.error("Failed to check weight request status", error);
          setWeightRequestError(
            weightRequestPollActionsRef.current.t(
              "weightRequestStatusFailed",
            ),
          );
        }
      } finally {
        requestInFlight = false;
      }
    };

    void checkWeightRequest();
    const interval = setInterval(checkWeightRequest, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [
    weightRequestId,
    weightRequestRestored,
    weightRequestStatus,
  ]);

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
          await deleteData(
            restaurantId
              ? `/api/user/cart?restaurantId=${restaurantId}`
              : "/api/user/cart",
            t("cartCleared"),
          );
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
  }, [deleteData, dispatch, t, restaurantId]);

  const totalSummary = cartData?.data?.data?.totalSummary;
  const totalPrice = Number(totalSummary?.subtotal || 0);
  const firstOrderDiscount = totalSummary?.firstOrderDiscount;
  const firstOrderDiscountAmount = Number(
    firstOrderDiscount?.discountAmount ?? 0,
  );
  const hasFirstOrderDiscount =
    Number.isFinite(firstOrderDiscountAmount) && firstOrderDiscountAmount > 0;
  const subtotalBeforeFirstOrderDiscount = hasFirstOrderDiscount
    ? Number(
        firstOrderDiscount?.summary?.subtotal ??
          totalPrice + firstOrderDiscountAmount,
      )
    : totalPrice;
  const handleWeightInputChange = (cartId: string, value: string) => {
    setWeightInputs((previous) => ({ ...previous, [cartId]: value }));
  };

  const handleSendWeightRequest = async () => {
    if (!restaurantId || weightItems.length === 0 || isSendingWeightRequest) {
      return;
    }

    const weights = weightItems.map((item) => ({
      item,
      weight: (
        weightInputs[item.cartId] ??
        (item.weight == null ? "" : String(item.weight))
      ).trim(),
    }));
    if (
      weights.some(
        ({ item, weight }) =>
          !item.cartId ||
          !weight ||
          !Number.isFinite(Number(weight)) ||
          Number(weight) <= 0,
      )
    ) {
      toast.error(t("enterWeightForAllItems"));
      return;
    }

    setIsSendingWeightRequest(true);
    setWeightRequestError(null);
    try {
      for (const { item, weight } of weights) {
        await api.put(`/api/user/cart/${encodeURIComponent(item.cartId)}`, {
          weight,
        });
      }

      const response = await api.post("/api/user/weight-requests", {
        restaurantId,
      });
      const requestId = getWeightRequestId(response.data);
      if (!requestId) {
        persistWeightRequestState("error");
        const errorMessage = t("weightRequestMissingId");
        setWeightRequestError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      persistWeightRequestState("pending", requestId);
      toast.success(t("weightRequestSent"));
      await refetch();
    } catch (error) {
      console.error("Failed to submit weight request", error);
      const errorMessage =
        error instanceof Error ? error.message : t("weightRequestFailed");
      setWeightRequestError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSendingWeightRequest(false);
    }
  };

  const weightCheckoutReady =
    weightItems.length === 0 || weightRequestStatus === "accepted";

  const cancelWeightRequest = async (reason: string) => {
    if (!weightRequestId) {
      throw new Error(t("weightRequestMissingId"));
    }

    await api.post(
      `/api/user/weight-requests/${encodeURIComponent(weightRequestId)}/cancel`,
      { reason },
    );
    persistWeightRequestState("cancelled");
  };

  const handleCancelWeightRequest = async () => {
    if (isCancellingWeightRequest) return;
    if (!weightRequestId) {
      const errorMessage = t("weightRequestMissingId");
      setWeightRequestError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsCancellingWeightRequest(true);
    setWeightRequestError(null);
    try {
      await cancelWeightRequest("Changed my mind");
      await refetch();
      toast.success(
        isRtl
          ? "تم إلغاء طلب الوزن. يمكنك تعديل الأوزان وإرساله مرة أخرى."
          : "Weight request cancelled. You can edit the weights and send it again.",
      );
    } catch (error) {
      console.error("Failed to cancel weight request", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : isRtl
            ? "تعذر إلغاء طلب الوزن."
            : "Could not cancel the weight request.";
      setWeightRequestError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCancellingWeightRequest(false);
    }
  };

  // دوال التعامل مع الـ API
  const handleQuantityChange = async (
    cartId: string,
    currentQuantity: number,
    change: number,
  ) => {
    const item = items.find((cartItem) => cartItem.cartId === cartId);
    if (item?.sold_by === "weight" && weightRequestStatus === "pending") {
      toast.error(t("weightRequestPending"));
      return;
    }

    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      if (item?.sold_by === "weight" && weightRequestStatus === "accepted") {
        await cancelWeightRequest("A weight item was changed in the cart");
      }
      await putData({ quantity: newQuantity }, `/api/user/cart/${cartId}`);
      if (item?.sold_by === "weight") {
        persistWeightRequestState("idle");
      }
      toast.success(t("quantityUpdated"));
      dispatch(updateQuantityLocal({ cartId, quantity: newQuantity }));

      await refetch();
    } catch (error) {
      toast.error(t("failedUpdateQuantity"));
    }
  };

  const handleRemoveItem = async (cartId: string) => {
    try {
      if (
        items.find((item) => item.cartId === cartId)?.sold_by === "weight" &&
        (weightRequestStatus === "pending" ||
          weightRequestStatus === "accepted") &&
        weightRequestId
      ) {
        await cancelWeightRequest("A weight item was removed from the cart");
      }
      await deleteData(`/api/user/cart/${cartId}`, t("itemRemoved"));
      if (items.find((item) => item.cartId === cartId)?.sold_by === "weight") {
        persistWeightRequestState("idle");
      }
      dispatch(removeFromCartLocal(cartId));
      await refetch();
    } catch (error) {
      toast.error(t("failedRemoveItem"));
    }
  };

  const handleClearCart = async () => {
    try {
      if (
        (weightRequestStatus === "pending" ||
          weightRequestStatus === "accepted") &&
        weightRequestId
      ) {
        await cancelWeightRequest("The cart was cleared");
      }
      await deleteData(
        restaurantId
          ? `/api/user/cart?restaurantId=${restaurantId}`
          : "/api/user/cart",
        t("cartCleared"),
      );
      persistWeightRequestState("idle");
      dispatch(clearCartLocal());
      localStorage.removeItem(CART_EXPIRY_KEY);
      await refetch();
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

      {weightItems.length > 0 && (
        <div
          className={`p-5 mb-6 space-y-3 border border-yellow-200 bg-yellow-50/95 dark:border-yellow-500/20 dark:bg-zinc-900/95 rounded-2xl ${
            weightRequestStatus === "pending" ||
            weightRequestStatus === "accepted"
              ? "sticky top-2 z-20 shadow-lg backdrop-blur"
              : ""
          }`}
        >
          <h3 className="font-bold text-gray-900 dark:text-white">
            {t("weightRequestTitle")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-zinc-300">
            {weightRequestStatus === "pending"
              ? t("weightRequestPending")
              : weightRequestStatus === "accepted"
                ? t("weightRequestAccepted")
                : weightRequestStatus === "rejected"
                  ? t("weightRequestRejected")
                  : weightRequestStatus === "cancelled"
                    ? isRtl
                      ? "تم إلغاء طلب الوزن. يمكنك تعديل الأوزان وإرساله مرة أخرى."
                      : "Weight request cancelled. You can edit the weights and send it again."
                    : t("weightRequestInstructions")}
          </p>
          {weightRequestError && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {weightRequestError}
            </p>
          )}
          {weightRequestStatus === "accepted" && (
            <Link
              href={buildLink("pay", restaurantName)}
              onClick={(event) => {
                if (!isOpen) {
                  event.preventDefault();
                  alert(t("Restaurant is currently closed"));
                }
              }}
              aria-disabled={!isOpen}
              className={`flex w-full items-center justify-center rounded-xl px-4 py-3 font-bold text-gray-900 ${
                isOpen
                  ? "bg-yellow-400 hover:bg-yellow-500"
                  : "cursor-not-allowed bg-gray-300 opacity-60"
              }`}
            >
              {isOpen ? t("checkoutNow") : t("closed")}
            </Link>
          )}
          {(weightRequestStatus === "pending" ||
            weightRequestStatus === "accepted") && (
            <button
              type="button"
              onClick={handleCancelWeightRequest}
              disabled={isCancellingWeightRequest || isSendingWeightRequest}
              className="w-full px-4 py-3 font-bold text-red-700 transition-colors border border-red-200 rounded-xl bg-white hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              {isCancellingWeightRequest
                ? isRtl
                  ? "جارٍ إلغاء الطلب..."
                  : "Cancelling request..."
                : weightRequestStatus === "accepted"
                  ? isRtl
                    ? "إلغاء الطلب وتعديل الأوزان"
                    : "Cancel and edit weights"
                  : isRtl
                    ? "إلغاء طلب الوزن"
                    : "Cancel weight request"}
            </button>
          )}
          {weightRequestStatus !== "pending" &&
            weightRequestStatus !== "accepted" && (
              <button
                type="button"
                onClick={handleSendWeightRequest}
                disabled={
                  !weightRequestRestored ||
                  isSendingWeightRequest ||
                  isCancellingWeightRequest
                }
                className="w-full px-4 py-3 font-bold text-gray-900 transition-colors bg-yellow-400 rounded-xl hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingWeightRequest
                  ? t("sendingWeightRequest")
                  : weightRequestStatus === "rejected" ||
                      weightRequestStatus === "cancelled"
                    ? t("resendWeightRequest")
                    : t("sendWeightRequest")}
              </button>
            )}
        </div>
      )}

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
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-2xl font-bold text-yellow-600 bg-yellow-50">
                      {item.name?.[0] || "?"}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                    {isRtl ? item.nameAr || item.name : item.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                    <span className="font-bold text-yellow-600 dark:text-yellow-500">
                      {item.unitPrice}
                    </span>{" "}
                    {t("currency")}{" "}
                    {item.sold_by === "weight" && item.weight_unit
                      ? `${t("per")} ${item.weight_unit}`
                      : t("perItem")}
                  </p>
                  {(item.note ) && (
                    <p className="mt-1 inline-flex items-start gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-50 rounded-lg dark:bg-zinc-800 dark:text-zinc-300">
                      <span className="font-semibold text-gray-500 dark:text-zinc-400">
                        {t("note") || "Note"}:
                      </span>
                      <span>{item.note }</span>
                    </p>
                  )}
                  {item.sold_by === "weight" && (
                    <label className="mt-2 flex flex-col gap-1 text-xs font-semibold text-gray-600 dark:text-zinc-300">
                      <span>
                        {weightRequestStatus === "accepted"
                          ? t("confirmedWeight")
                          : t("requestedWeight")}
                        {item.weight_unit ? ` (${item.weight_unit})` : ""}
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        value={
                          weightInputs[item.cartId] ??
                          (item.weight == null ? "" : String(item.weight))
                        }
                        onChange={(event) =>
                          handleWeightInputChange(
                            item.cartId,
                            event.target.value,
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.preventDefault();
                        }}
                        disabled={
                          weightRequestStatus === "pending" ||
                          weightRequestStatus === "accepted" ||
                          isCancellingWeightRequest ||
                          isSendingWeightRequest
                        }
                        className="w-36 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-yellow-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white disabled:opacity-60"
                      />
                    </label>
                  )}
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
            {subtotalBeforeFirstOrderDiscount} {t("currency")}
          </span>
        </div>

        {hasFirstOrderDiscount && (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
            <span className="text-gray-500 dark:text-zinc-400">
              {t("firstOrderDiscount")}
            </span>
            <span className="font-bold text-green-600 dark:text-green-500">
              -{firstOrderDiscountAmount} {t("currency")}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {t("total")}
          </span>
          <span className="text-2xl font-black text-yellow-600 dark:text-yellow-500">
            {totalPrice} {t("currency")}
          </span>
        </div>

        <Link
          href={buildLink("pay", restaurantName)}
          onClick={(e) => {
            if (!weightCheckoutReady) {
              e.preventDefault();
              toast.error(t("weightRequestMustBeAccepted"));
              return;
            }
            if (!isOpen) {
              e.preventDefault(); // يمنع التنقل
              alert(t("Restaurant is currently closed"));
            }
          }}
          aria-disabled={!weightCheckoutReady || !isOpen}
          className={`flex items-center justify-center gap-2 py-3 mt-6 text-base font-bold text-gray-900 rounded-xl transition-colors ${
            isOpen && weightCheckoutReady
              ? "bg-yellow-400 hover:bg-yellow-500"
              : !isOpen
                ? "bg-gray-300 cursor-not-allowed opacity-50 pointer-events-none"
                : "bg-gray-300 cursor-not-allowed opacity-50"
          }`}
        >
          <span>
            {!weightCheckoutReady
              ? t("weightRequestMustBeAccepted")
              : isOpen
                ? t("checkoutNow")
                : t("closed")}
          </span>
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