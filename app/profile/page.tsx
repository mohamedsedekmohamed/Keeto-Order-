"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Settings,
  Wallet,
  BadgeCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
  Truck,
  X,
  ReceiptText,
  Ban,
  AlertTriangle,
  Info,
  Tag,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "@/api/api";
import { useLanguage } from "../../context/LanguageContext";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
import usePut from "@/app/hooks/usePut";
import useDelete from "@/app/hooks/useDelete";
import useIsFacebookBrowser from "@/context/Useisfacebookbrowser";
import {
  getZoneCenter,
  getZoneName,
  type DeliveryZone,
} from "@/components/Zoneselect";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useToken } from "@/context/TokenContext";
import { getRestaurantId } from "@/context/Restaurantid";
import ProfileAccordion from "./components/ProfileAccordion";
import ProfileAddresses, {
  type Address,
} from "./components/ProfileAddresses";
import ProfileFavorites from "./components/ProfileFavorites";
import ProfileGeneralInfo from "./components/ProfileGeneralInfo";
import { OrderCreatedAt, PrepCountdown } from "./components/OrderTime";
import ProfileOrderDetails from "./components/ProfileOrderDetails";
import ProfileOrders from "./components/ProfileOrders";
import {
  AddressConfirmationModals,
  CancelReasonModal,
} from "./components/ProfileModals";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  photo: string | null;
  isVerified: boolean;
  isProfileComplete: boolean;
  isGuest?: boolean;
  createdAt: string;
  addresses: Address[];
}

interface ProfileApiResponse {
  success: boolean;
  data: {
    data: {
      user: UserProfile;
      walletBalance: string;
      ordersCount: number;
    };
  };
}

interface FavoriteFood {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  description: string;
  price: string;
}

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { logout, getToken } = useToken();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isRtl = typeof document !== "undefined" && document.dir === "rtl";
  const isArabic = String(language).toLowerCase() === "ar";
  const callbackSlug = searchParams.get("callbackSlug");

  const restaurantSlug =
    (params?.slug as string) ||
    (searchParams?.get("callbackSlug") as string) ||
    "";
  const token = getToken(restaurantSlug);

  const [storedRestaurantId, setStoredRestaurantId] = useState<string | null>(
    null,
  );
  const hasTab = searchParams.has("tab");
  // merchantOrderId only exists in the URL when returning from the payment
  // gateway, so in that case "back" must go to the restaurant page.
  const hasMerchantOrderId = !!searchParams.get("merchantOrderId");

  const handleNavigation = () => {
    if (!hasTab && !hasMerchantOrderId) {
      router.back();
    } else {
      router.push(`/home/restaurants/${restaurantSlug}/restaurant`);
    }
  };
  useEffect(() => {
    if (restaurantSlug) {
      setStoredRestaurantId(getRestaurantId(restaurantSlug));
    }
  }, [restaurantSlug]);
  const restaurantId = storedRestaurantId || restaurantSlug;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Active Tab State (can be null if all are closed, or one of the sections).
  // Reads the initial value from ?tab=... so links like
  // /profile?tab=tracking (e.g. the post-checkout redirect) actually open
  // the right section instead of always landing with everything closed.
  const VALID_TABS = ["general", "addresses", "favorites", "tracking"] as const;
  type TabKey = (typeof VALID_TABS)[number];
  const isValidTab = (value: string | null): value is TabKey =>
    !!value && (VALID_TABS as readonly string[]).includes(value);

  // merchantOrderId forces the "tracking" tab; if it doesn't exist, fall back
  // to orderId; otherwise use ?tab=...
  const getTabFromUrl = () =>
    searchParams.get("merchantOrderId") || searchParams.get("orderId")
      ? "tracking"
      : searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<TabKey | null>(() => {
    const tabParam = getTabFromUrl();
    return isValidTab(tabParam) ? tabParam : null;
  });

  // If the "tab" query param changes after mount (e.g. the user is
  // redirected here again from checkout while already on this page,
  // so no fresh mount happens), keep activeTab in sync with it.
  useEffect(() => {
    const tabParam = getTabFromUrl();
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const toggleTab = (
    tab: "general" | "addresses" | "favorites" | "tracking",
  ) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Shown when the address being updated is flagged as isRelatedToOrder
  // (i.e. it's tied to an in-progress order), so the user has to
  // explicitly confirm before the update actually goes through.
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
  const [pendingAddressPayload, setPendingAddressPayload] = useState<Record<
    string,
    any
  > | null>(null);
  const [isUpdateConfirmLoading, setIsUpdateConfirmLoading] = useState(false);

  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [favLoaded, setFavLoaded] = useState(false);

  const [orderSubTab, setOrderSubTab] = useState<"active" | "history">(
    "active",
  );
  // Picks up ?merchantOrderId=... if present (it only exists in the URL when
  // coming back from the payment gateway). Otherwise falls back to the normal
  // ?orderId=... flow (set by the checkout redirect) so the order that was
  // just placed opens automatically.
  const urlOrderId =
    searchParams.get("merchantOrderId") || searchParams.get("orderId") || null;
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    () => urlOrderId,
  );

  // Keep in sync if the URL params change after mount (no fresh mount happens
  // when redirected back to this same page).
  useEffect(() => {
    if (urlOrderId && urlOrderId !== selectedOrderId) {
      setSelectedOrderId(urlOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlOrderId]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [cancelReasons, setCancelReasons] = useState<any[]>([]);
  const [customCancelReason, setCustomCancelReason] = useState<string>("");

  const {
    data: profileResponse,
    loading: isFetching,
    refetch,
  } = useGet<ProfileApiResponse>(
    `/api/user/profile?restaurantId=${restaurantId}`,
  );
  const { putData: updateProfile, loading: isUpdatingProfile } =
    usePut("/api/user/profile");
  const { postData: addAddress, loading: isAddingAddress } =
    usePost("/api/user/address");
  const { putData: updateAddress, loading: isUpdatingAddress } = usePut();
  const { deleteData, loading: isDeletingAddress } = useDelete("");
  const { postData: toggleFav } = usePost("/api/user/favlist/toggle");

  const {
    data: activeOrdersData,
    loading: loadingActiveOrders,
    refetch: refetchActiveOrders,
  } = useGet<any>(`/api/user/order/active?restaurantId=${restaurantId}`);
  const {
    data: historyOrdersData,
    loading: loadingHistoryOrders,
    refetch: refetchHistoryOrders,
  } = useGet<any>(`/api/user/order/history?restaurantId=${restaurantId}`);

  const getOrderSource = () => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem(`login_source_${restaurantSlug}`) ||
        localStorage.getItem("login_source") ||
        "online_order_web"
      );
    }
    return "online_order_web";
  };

  const activeOrdersList =
    activeOrdersData?.data?.data || activeOrdersData?.data || [];
  const historyOrdersList =
    historyOrdersData?.data?.data || historyOrdersData?.data || [];
  const currentOrders =
    orderSubTab === "active" ? activeOrdersList : historyOrdersList;
  const isLoadingOrdersList =
    orderSubTab === "active" ? loadingActiveOrders : loadingHistoryOrders;

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      return;
    }

    const fetchOrderDetails = async () => {
      setLoadingOrderDetails(true);
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
        setLoadingOrderDetails(false);
      }
    };

    fetchOrderDetails();
  }, [selectedOrderId, t]);
  // Auto-poll active orders and selected order details
  useEffect(() => {
    // Only run polling if the user is viewing active orders
    if (activeTab !== "tracking" || orderSubTab !== "active") return;

    const POLL_INTERVAL = 2 * 60 * 1000; // Poll every 10 seconds

    const intervalId = setInterval(() => {
      // 1. Refetch the active orders list
      refetchActiveOrders?.();

      // 2. If an order drawer is open, fetch its latest details
      if (selectedOrderId) {
        api
          .get(`/api/user/order/${selectedOrderId}`)
          .then((response) => {
            if (response.data?.success) {
              setSelectedOrder(response.data.data.data || response.data.data);
            }
          })
          .catch((error) => {
            console.error("Error polling order details:", error);
          });
      }
    }, POLL_INTERVAL);

    // Clean up interval when leaving active tracking or switching tabs
    return () => clearInterval(intervalId);
  }, [activeTab, orderSubTab, selectedOrderId, refetchActiveOrders]);
  const handleOpenCancelModal = async () => {
    setShowCancelModal(true);
    setSelectedReasonId("");
    setCustomCancelReason("");
    try {
      const response = await api.get(
        `/api/user/order/select?restaurantId=${restaurantId}&orderSource=${getOrderSource()}`,
      );
      setCancelReasons(
        response.data?.data?.data?.reasons ||
        response.data?.data?.reasons ||
        response.data?.reasons ||
        [],
      );
    } catch (error) {
      console.error("Error fetching cancel reasons:", error);
      //toast.error(t("errorFetchingReasons") || "فشل تحميل أسباب الإلغاء");
    }
  };

  const handleCancelOrderSubmit = async () => {
    if (!selectedOrderId) return;
    if (!selectedReasonId) {
      toast.error(t("pleaseSelectReason") || "برجاء اختيار سبب الإلغاء أولاً");
      return;
    }

    const isOtherReason = selectedReasonId === "other";

    if (isOtherReason && !customCancelReason.trim()) {
      toast.error(t("pleaseWriteReason") || "برجاء كتابة سبب الإلغاء");
      return;
    }

    setUpdatingOrderStatus(true);
    try {
      const payload: Record<string, any> = {
        status: "cancelled",
      };

      if (isOtherReason) {
        payload.customReason = customCancelReason.trim();
      } else {
        payload.cancelReasonId = selectedReasonId;
      }

      const response = await api.put(
        `/api/user/order/${selectedOrderId}/cancel`,
        payload,
      );

      if (response.data.success || response.status === 200) {
        toast.success(
          t("orderCancelledSuccessfully") || "تم إلغاء الطلب بنجاح",
        );
        setShowCancelModal(false);
        setSelectedOrderId(null);
        setSelectedReasonId("");
        setCustomCancelReason("");
        refetchActiveOrders?.();
        refetchHistoryOrders?.();
      } else {
        toast.error(t("failedToCancel") || "فشل إلغاء الطلب");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(t("failedToCancel") || "فشل إلغاء الطلب");
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // Display-only relabel: takeaway orders are picked up, not delivered, so
  // once one reaches "out_for_delivery" it reads as "Ready" to the user
  // instead of the delivery wording. The underlying status value and all
  // its logic (delivery-man block, cancellation rules, final-status
  // checks, etc.) are untouched — this only changes what text is shown.
  const getOrderStatusLabel = (order: any) => {
    if (
      order?.orderType === "takeaway" &&
      order?.status === "out_for_delivery"
    ) {
      return t("ready") || (isRtl ? "جاهز" : "Ready");
    }
    return t(order?.status) || order?.status;
  };

  // Final/closed statuses — once an order reaches one of these there is no
  // more preparing left to do, so the prep-duration countdown no longer
  // applies and should not be shown in the order details dialog.
  const isFinalOrderStatus = (status: string | null | undefined) => {
    const normalizedStatus = status?.toLowerCase();
    const finalStatuses = [
      "cancelled",
      "canceled",
      "delivered",
      "refund",
      "refunded",
      "rejected",
    ];
    return !!normalizedStatus && finalStatuses.includes(normalizedStatus);
  };

  const userData = profileResponse?.data?.data?.user;
  const walletBalance = profileResponse?.data?.data?.walletBalance || "0.00";
  const ordersCount = profileResponse?.data?.data?.ordersCount || 0;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    title: "",
    type: "home",
    street: "",
    fulladdress: "",
    number: "",
    floor: "",
    apartment: "",
    landmark: "",
    lat: null as number | null,
    lng: null as number | null,
    location: "",
    zoneId: "",
  });
  const isFbBrowser = useIsFacebookBrowser();
  const [selectedZoneId, setSelectedZoneId] = useState("");

  // Zones come from the same "select" API used elsewhere on this page.
  const { data: zonesRes } = useGet<any>(
    isFbBrowser && restaurantId
      ? `/api/user/order/select?restaurantId=${restaurantId}&orderSource=${getOrderSource()}`
      : null,
  );
  const zones: DeliveryZone[] = Array.isArray(zonesRes?.data?.data?.zones)
    ? zonesRes.data.data.zones
    : [];

  const handleZoneSelect = (zone: DeliveryZone) => {
    const c = getZoneCenter(zone);
    if (!c) {
      toast.error(
        isArabic ? "تعذر تحديد إحداثيات هذه المنطقة." : "This zone has no coordinates.",
      );
      return;
    }
    const name = getZoneName(zone, isArabic);
    setSelectedZoneId(String(zone.id));
    setAddressForm((prev) => ({
      ...prev,
      lat: c.lat,
      lng: c.lng,
      location: name,
      street: prev.street || name,
      fulladdress: prev.fulladdress || name,
      zoneId: String(zone.id),
    }));
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        alternatePhone: userData.alternatePhone || "",
      });
    }
  }, [userData]);

  const fetchFavorites = async () => {
    if (!token) return;
    try {
      setIsFavLoading(true);
      const res = await axios.get(
        `https://keetobcknd.keeto.org/api/user/favlist?restaurantId=${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setFavorites(res?.data?.data?.data?.foods || []);
    } catch (error) {
      console.error(error);
      toast.error(t("favoritesLoadFailed") || "فشل تحميل المفضلة");
    } finally {
      setIsFavLoading(false);
      setFavLoaded(true);
    }
  };

  useEffect(() => {
    if (activeTab === "favorites" && !favLoaded && token) {
      fetchFavorites();
    }
  }, [activeTab, token]);

  const handleRemoveFavorite = async (foodId: string) => {
    try {
      await toggleFav(
        { foodId },
        null,
        t("removedFromFavorites") || "تمت الإزالة من المفضلة",
      );
      setFavorites((prev) => prev.filter((item) => item.id !== foodId));
    } catch (error) {
      toast.error(t("favoriteRemoveFailed") || "حدث خطأ أثناء الإزالة");
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Phone / alternate phone: digits only, max 11 characters.
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/\D/g, "").slice(0, 11);
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneDigits = formData.phone.replace(/\D/g, "");
    const altPhoneDigits = formData.alternatePhone.replace(/\D/g, "");
    const phoneRegex = /^01\d{9}$/; // 11 digits, must start with 01

    if (!phoneRegex.test(phoneDigits)) {
      toast.error(
        t("invalidPhone") || "رقم الهاتف يجب أن يتكون من 11 رقمًا ويبدأ بـ 01",
      );
      return;
    }

    if (!altPhoneDigits) {
      toast.error(t("phoneDetailsRequired"));
      return;
    }

    if (!phoneRegex.test(altPhoneDigits)) {
      toast.error(
        t("invalidAlternatePhone") ||
        "رقم الهاتف البديل يجب أن يتكون من 11 رقمًا ويبدأ بـ 01",
      );
      return;
    }

    try {
      await updateProfile(
        {
          name: formData.name,
          phone: phoneDigits,
          alternatePhone: altPhoneDigits,
        },
        null,
        t("updateSuccess") || "تم تحديث البيانات بنجاح!",
      );
      // Reload the whole page rather than just refetching in place — this
      // re-runs every hook on the page (profile, orders, favorites, etc.)
      // fresh against the just-saved data instead of keeping it all in
      // sync by hand.
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const applyLocation = async (latitude: number, longitude: number) => {
    let extractedTitle = "";
    let extractedStreet = "";
    let extractedFullAddress = "";

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      );
      const data = await res.json();
      const address = data?.address || {};

      extractedTitle =
        address.road ||
        address.neighbourhood ||
        address.suburb ||
        data?.display_name ||
        "";
      extractedStreet = address.road || address.pedestrian || "";
      extractedFullAddress = data?.display_name || "";
    } catch (geoError) {
      console.error("Error reverse geocoding location:", geoError);
    }

    setAddressForm((prev) => ({
      ...prev,
      lat: latitude,
      lng: longitude,
      location: extractedTitle,
      street: extractedStreet,
      fulladdress: extractedFullAddress,
    }));
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    applyLocation(lat, lng);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(
        isArabic
          ? "المتصفح الخاص بك لا يدعم تحديد الموقع."
          : "Geolocation is not supported by your browser.",
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await applyLocation(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        console.error("Error getting location:", error);
        alert(
          isArabic
            ? "فشل في تحديد الموقع. يرجى تفعيل الـ GPS وإعطاء الصلاحية."
            : "Failed to get location. Please allow location access.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const resetAddressForm = () => {
    setAddressForm({
      title: "",
      type: "home",
      street: "",
      fulladdress: "",
      number: "",
      floor: "",
      apartment: "",
      landmark: "",
      lat: null,
      lng: null,
      location: "",
      zoneId: "",
    });
    setSelectedZoneId("");
    setEditingAddressId(null);
    setIsFormOpen(false);
  };

  const handleAddNewClick = () => {
    resetAddressForm();
    setIsFormOpen(true);
  };

  const handleAddressEditClick = (address: Address) => {
    setAddressForm({
      title: address.title || "",
      type: address.type || "home",
      street: address.street || "",
      fulladdress: address.fulladdress || "",
      number: address.number?.toString() || "",
      floor: address.floor?.toString() || "",
      apartment: address.apartment || "",
      landmark: address.landmark || "",
      lat: address.lat !== null ? Number(address.lat) : null,
      lng: address.lng !== null ? Number(address.lng) : null,
      location: address.location || "",
      zoneId: "",
    });
    setSelectedZoneId("");
    setEditingAddressId(address.id);
    setIsFormOpen(true);
  };

  const handleAddressChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  // Actually performs the add/update API call. Pulled out of
  // handleAddressSubmit so it can be triggered either immediately (normal
  // case) or after the user confirms the "this address is linked to an
  // order" dialog.
  const submitAddress = async (payload: Record<string, any>) => {
    try {
      if (editingAddressId) {
        await updateAddress(
          payload,
          `/api/user/address/${editingAddressId}`,
          t("address-updated-success") || "تم تحديث العنوان بنجاح!",
        );
      } else {
        await addAddress(
          payload,
          null,
          t("address-added-success") || "تم إضافة العنوان بنجاح!",
        );
      }
      resetAddressForm();
      if (refetch) refetch();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !editingAddressId &&
      (addressForm.lat === null || addressForm.lng === null)
    ) {
      toast.error(
        isFbBrowser
          ? isArabic
            ? "يرجى اختيار منطقة التوصيل أولاً."
            : "Please select a delivery zone first."
          : isArabic
            ? "يرجى تحديد موقعك الحالي قبل إضافة العنوان."
            : "Please capture your current location before adding the address.",
      );
      return;
    }

    const payload = {
      ...addressForm,
      number: String(addressForm.number) || 0,
      floor: String(addressForm.floor) || 0,
    };

    // If we're editing an address that's tied to an order (as reported by
    // the profile response), don't update it right away — ask for
    // confirmation first.
    if (editingAddressId) {
      const currentAddress = userData?.addresses?.find(
        (a) => a.id === editingAddressId,
      );
      if (currentAddress?.isRelatedToOrder) {
        setPendingAddressPayload(payload);
        setShowUpdateConfirmModal(true);
        return;
      }
    }

    await submitAddress(payload);
  };

  const handleConfirmUpdateAddress = async () => {
    if (!pendingAddressPayload) return;
    setIsUpdateConfirmLoading(true);
    try {
      await submitAddress(pendingAddressPayload);
      setShowUpdateConfirmModal(false);
      setPendingAddressPayload(null);
    } catch (error) {
      // Keep the dialog open so the user can retry/cancel if the update fails.
    } finally {
      setIsUpdateConfirmLoading(false);
    }
  };

  const handleCancelUpdateAddress = () => {
    setShowUpdateConfirmModal(false);
    setPendingAddressPayload(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteData(
        `/api/user/address/${deleteId}`,
        t("address-deleted-success") || "تم حذف العنوان بنجاح!",
      );
      if (refetch) refetch();
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const hasLocation =
    addressForm.lat !== null &&
    addressForm.lng !== null &&
    !Number.isNaN(Number(addressForm.lat)) &&
    !Number.isNaN(Number(addressForm.lng));


  if (isFetching || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
      </div>
    );
  }

  const renderStaticOfferButton = () => (
    <button
      onClick={() => router.push(`/home/restaurants/${restaurantSlug}/offer`)}
      className="w-full flex items-center justify-between px-6 py-4 font-bold rounded-2xl transition-all bg-white/80 dark:bg-zinc-900/80 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/50 border border-white dark:border-zinc-800/50 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <Tag size={18} />
        <span>{t("offers") || "العروض"}</span>
      </div>
      <ChevronRight size={18} />
    </button>
  );

  return (
    <div className="relative min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-400/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-yellow-500/5 blur-[130px] rounded-full pointer-events-none" />

      <button
        onClick={handleNavigation}
        className="absolute z-20 flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md -mt-2 top-4 start-4 active:scale-95 text-white"
      >
        <ChevronLeft
          className={`w-6 h-6 transform ${isRtl ? "rotate-180" : ""}`}
        />
      </button>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              {t("profile") || "الحساب الشخصي"}
            </h1>
            <p className="mt-2 font-medium text-gray-500 dark:text-zinc-400">
              {t("manageProfile") || "إدارة ملفك الشخصي وعناوينك"}
            </p>
          </div>
          <button className="p-3 text-gray-500 transition-all bg-white border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl hover:border-yellow-400 dark:text-zinc-400">
            <Settings size={24} />
          </button>
        </motion.div>

        {/* -------------------------------------------
            DIV 1: THE TWO BOXES ONLY (Wallet & Orders)
        ------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-start">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                    {userData.name}
                  </h3>
                  {userData.isVerified && (
                    <BadgeCheck size={22} className="text-blue-500" />
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-zinc-400">
                  {userData.email}
                </p>
              </div>
            </div>

            {/* The Two Boxes */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="flex flex-col items-center justify-center px-6 py-4 bg-yellow-400/10 rounded-2xl border border-yellow-400/20 min-w-[140px]">
                <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-bold text-base">
                  <Wallet size={18} />
                  <span>{walletBalance}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  {t("wallet") || "المحفظة"}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center px-6 py-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 min-w-[140px]">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-base">
                  <ShoppingBag size={18} />
                  <span>{ordersCount}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  {t("orders") || "الطلبات"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* -------------------------------------------
            DIV 2: ACCORDION TABS (Open/Close with Arrows)
        ------------------------------------------- */}
        <div className="space-y-4">
          {/* SECTION 1: GENERAL INFO */}
          <ProfileAccordion
            icon={<Info size={18} />}
            label={t("generalInfo") || "معلومات عامة"}
            isOpen={activeTab === "general"}
            onToggle={() => toggleTab("general")}
          >
            <ProfileGeneralInfo
              formData={formData}
              isUpdating={isUpdatingProfile}
              t={t}
              onChange={handleProfileChange}
              onPhoneChange={handlePhoneChange}
              onSubmit={handleProfileSubmit}
            />
          </ProfileAccordion>

          {/* SECTION 2: ADDRESSES */}
          <ProfileAddresses
            isOpen={activeTab === "addresses"}
            isArabic={isArabic}
            isFacebookBrowser={isFbBrowser}
            isMounted={mounted}
            isGuest={!!userData.isGuest}
            addresses={userData.addresses || []}
            isFormOpen={isFormOpen}
            editingAddressId={editingAddressId}
            addressForm={addressForm}
            selectedZoneId={selectedZoneId}
            zones={zones}
            isLocating={isLocating}
            isAddingAddress={isAddingAddress}
            isUpdatingAddress={isUpdatingAddress}
            isDeletingAddress={isDeletingAddress}
            hasLocation={hasLocation}
            onToggle={() => toggleTab("addresses")}
            onAddNewClick={handleAddNewClick}
            onGetCurrentLocation={handleGetCurrentLocation}
            onResetForm={resetAddressForm}
            onSubmit={handleAddressSubmit}
            onZoneSelect={handleZoneSelect}
            onMapLocationChange={handleMapLocationChange}
            onChange={handleAddressChange}
            onEditAddress={handleAddressEditClick}
            onDeleteAddress={handleDeleteClick}
          />
          {/* SECTION 3: FAVORITES */}
          <ProfileFavorites
            isOpen={activeTab === "favorites"}
            favorites={favorites}
            isLoading={isFavLoading}
            isArabic={isArabic}
            t={t}
            onToggle={() => toggleTab("favorites")}
            onRemove={handleRemoveFavorite}
          />

          {/* SECTION 4: OFFERS -> Static route button only */}
          <div>{renderStaticOfferButton()}</div>

          {/* SECTION 5: ORDER TRACKING */}
          <ProfileOrders
            isOpen={activeTab === "tracking"}
            isRtl={isRtl}
            isLoading={isLoadingOrdersList}
            orderSubTab={orderSubTab}
            currentOrders={currentOrders}
            t={t}
            getOrderStatusLabel={getOrderStatusLabel}
            isFinalOrderStatus={isFinalOrderStatus}
            onToggle={() => toggleTab("tracking")}
            onChangeTab={setOrderSubTab}
            onSelectOrder={setSelectedOrderId}
          />
        </div>

        {/* LOG OUT BUTTON */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mt-8"
        >
          <button
            onClick={() => {
              logout(callbackSlug);
              logout();
              const redirectPath = callbackSlug
                ? `/home/restaurants/${callbackSlug}`
                : "/";
              router.push(redirectPath);
            }}
            className="flex items-center justify-center px-10 py-4 gap-2 font-black text-red-500 transition-all bg-white border border-red-100 hover:bg-red-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-red-500/10 rounded-2xl shadow-xl w-full sm:w-auto"
          >
            <LogOut size={20} />
            {t("logout") || "تسجيل الخروج"}
          </button>
        </motion.div>
      </div>

      <AddressConfirmationModals
        isDeleteOpen={showDeleteModal}
        isUpdateOpen={showUpdateConfirmModal}
        isUpdateLoading={isUpdateConfirmLoading}
        t={t}
        onCloseDelete={() => setShowDeleteModal(false)}
        onConfirmDelete={confirmDelete}
        onCancelUpdate={handleCancelUpdateAddress}
        onConfirmUpdate={handleConfirmUpdateAddress}
      />
      <ProfileOrderDetails
        isOpen={!!selectedOrderId}
        isLoading={loadingOrderDetails}
        isRtl={isRtl}
        isArabic={isArabic}
        selectedOrder={selectedOrder}
        t={t}
        isFinalOrderStatus={isFinalOrderStatus}
        getOrderStatusLabel={getOrderStatusLabel}
        onClose={() => setSelectedOrderId(null)}
        onStartCancel={handleOpenCancelModal}
      />
      <CancelReasonModal
        isOpen={showCancelModal}
        reasons={cancelReasons}
        selectedReasonId={selectedReasonId}
        customReason={customCancelReason}
        isUpdating={updatingOrderStatus}
        isRtl={isRtl}
        t={t}
        onClose={() => setShowCancelModal(false)}
        onSelectReason={setSelectedReasonId}
        onCustomReasonChange={(event) => setCustomCancelReason(event.target.value)}
        onBack={() => {
          setShowCancelModal(false);
          setSelectedReasonId("");
          setCustomCancelReason("");
        }}
        onSubmit={handleCancelOrderSubmit}
      />
    </div>
  );
}