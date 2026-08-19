"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Save,
  LogOut,
  Shield,
  Settings,
  Phone,
  Wallet,
  BadgeCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  ShoppingBag,
  Home,
  Briefcase,
  Edit,
  Trash2,
  Navigation,
  CheckCircle2,
  Plus,
  Heart,
  Truck,
  Clock,
  History,
  X,
  ReceiptText,
  Package,
  Ban,
  AlertTriangle,
  Info,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "@/api/api";
import { useLanguage } from "../../context/LanguageContext";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
import usePut from "@/app/hooks/usePut";
import useDelete from "@/app/hooks/useDelete";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useToken } from "@/context/TokenContext";
import { getRestaurantId } from "@/context/Restaurantid";

// Leaflet Imports
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Marker Icon Path Issue in Next.js
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

const DEFAULT_MAP_CENTER: [number, number] = [30.0444, 31.2357];

function MapClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng]);
  return null;
}

function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const pos = marker.getLatLng();
          onChange(pos.lat, pos.lng);
        }
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={true}
      style={{ height: "220px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[lat, lng]}
        draggable={true}
        eventHandlers={eventHandlers}
        ref={markerRef}
      />
      <MapClickHandler onChange={onChange} />
      <RecenterOnChange lat={lat} lng={lng} />
    </MapContainer>
  );
}

interface Address {
  id: string;
  type?: "home" | "work" | string;
  title: string;
  lat: number | null;
  lng: number | null;
  street: string;
  number: string | number;
  floor: string | number;
  apartment: string;
  landmark: string | null;
  fulladdress?: string;
  location?: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  photo: string | null;
  isVerified: boolean;
  isProfileComplete: boolean;
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

// Parses "DD/MM/YYYY, hh:mm:ss am/pm" (and falls back to native Date parsing
// for ISO strings) into a valid JS Date object.
function parseOrderDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)$/i,
  );

  if (match) {
    const [, dd, mm, yyyy, hh, min, sec, meridiem] = match;
    let hours = parseInt(hh, 10);
    if (/pm/i.test(meridiem) && hours !== 12) hours += 12;
    if (/am/i.test(meridiem) && hours === 12) hours = 0;
    return new Date(
      parseInt(yyyy, 10),
      parseInt(mm, 10) - 1,
      parseInt(dd, 10),
      hours,
      parseInt(min, 10),
      parseInt(sec, 10),
    );
  }

  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// Counts down from (createdAt + durationMinutes) to now, ticking every
// second. Returns null once inputs are missing/invalid; returns 0 (not
// negative) once the target time has passed.
function usePrepCountdown(
  createdAt: string | null | undefined,
  durationMinutes: number | null | undefined,
) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const start = parseOrderDate(createdAt);
    if (!start || !durationMinutes || durationMinutes <= 0) {
      setRemainingMs(null);
      return;
    }

    const target = start.getTime() + durationMinutes * 60 * 1000;

    const tick = () => {
      const diff = target - Date.now();
      setRemainingMs(diff > 0 ? diff : 0);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt, durationMinutes]);

  return remainingMs;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Small self-contained countdown pill. It keeps its own ticking state here
// (rather than in the page) so only this pill re-renders every second,
// not the whole orders list/details view.
function PrepCountdown({
  createdAt,
  durationMinutes,
  t,
  className = "",
}: {
  createdAt: string | null | undefined;
  durationMinutes: number | null | undefined;
  t: (key: string) => string | undefined;
  className?: string;
}) {
  const remainingMs = usePrepCountdown(createdAt, durationMinutes);

  if (remainingMs === null || !durationMinutes) return null;

  const isDone = remainingMs <= 0;

  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
        isDone
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-yellow-400/10 text-yellow-600 dark:text-yellow-400"
      } ${className}`}
    >
      <Clock size={12} />
      {isDone
        ? t("orderShouldBeReady") || "من المفترض أن يكون الطلب جاهزًا"
        : `${t("remainingPrepTime") || "الوقت المتبقي"} ${formatCountdown(remainingMs)}`}
    </div>
  );
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

  // Active Tab State (can be null if all are closed, or one of the sections)
  const [activeTab, setActiveTab] = useState<
    "general" | "addresses" | "favorites" | "tracking" | null
  >(null);

  const toggleTab = (
    tab: "general" | "addresses" | "favorites" | "tracking",
  ) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [favLoaded, setFavLoaded] = useState(false);

  const [orderSubTab, setOrderSubTab] = useState<"active" | "history">(
    "active",
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [cancelReasons, setCancelReasons] = useState<any[]>([]);

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
        "food_aggregator"
      );
    }
    return "food_aggregator";
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

    const POLL_INTERVAL = 2*60*1000; // Poll every 10 seconds

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
      toast.error(t("errorFetchingReasons") || "فشل تحميل أسباب الإلغاء");
    }
  };

  const handleCancelOrderSubmit = async () => {
    if (!selectedOrderId) return;
    if (!selectedReasonId) {
      toast.error(t("pleaseSelectReason") || "برجاء اختيار سبب الإلغاء أولاً");
      return;
    }

    setUpdatingOrderStatus(true);
    try {
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
        setShowCancelModal(false);
        setSelectedOrderId(null);
        setSelectedReasonId("");
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

  const isCancellationAllowed = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    const forbiddenStatuses = [
      "accepted",
      "delivered",
      "completed",
      "cancelled",
      "preparing",
      "out_for_delivery",
      "refund",
    ];
    return !forbiddenStatuses.includes(normalizedStatus);
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
  });

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(
        {
          name: formData.name,
          phone: formData.phone,
          alternatePhone: formData.alternatePhone,
        },
        null,
        t("updateSuccess") || "تم تحديث البيانات بنجاح!",
      );
      if (refetch) refetch();
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
    });
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
    });
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

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...addressForm,
      number: String(addressForm.number) || 0,
      floor: String(addressForm.floor) || 0,
    };

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
    }
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

  const latDisplay = hasLocation ? Number(addressForm.lat).toFixed(4) : "";
  const lngDisplay = hasLocation ? Number(addressForm.lng).toFixed(4) : "";

  if (isFetching || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
      </div>
    );
  }

  // Helper macro for rendering accordion buttons
  const renderAccordionButton = (
    tabKey: "general" | "addresses" | "favorites" | "tracking",
    icon: React.ReactNode,
    label: string,
  ) => {
    const isOpen = activeTab === tabKey;
    return (
      <button
        onClick={() => toggleTab(tabKey)}
        className={`w-full flex items-center justify-between px-6 py-4 font-bold rounded-2xl transition-all ${
          isOpen
            ? "bg-yellow-400 text-gray-900 shadow-md shadow-yellow-400/20"
            : "bg-white/80 dark:bg-zinc-900/80 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/50 border border-white dark:border-zinc-800/50 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </div>
        <ChevronDown
          size={18}
          className={`transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
    );
  };

  return (
    <div className="relative min-h-screen px-4 py-12 overflow-hidden transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-400/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-yellow-500/5 blur-[130px] rounded-full pointer-events-none" />

      <button
        onClick={() => router.back()}
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
          <div>
            {renderAccordionButton(
              "general",
              <Info size={18} />,
              t("generalInfo") || "معلومات عامة",
            )}
            <AnimatePresence>
              {activeTab === "general" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 sm:p-8 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {t("editProfile") || "تعديل البيانات الأساسية"}
                    </h3>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 ms-1">
                            {t("fullName") || "الاسم الكامل"}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                              <User
                                size={16}
                                className="text-gray-400 group-focus-within:text-yellow-500"
                              />
                            </div>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleProfileChange}
                              required
                              className="w-full py-3 text-sm transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-xl ps-10 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 ms-1">
                            {t("email") || "البريد الإلكتروني"}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                              <Mail size={16} className="text-gray-400" />
                            </div>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              disabled
                              className="w-full py-3 text-sm transition-all border-2 border-transparent outline-none bg-gray-200/60 dark:bg-zinc-800/20 text-gray-500 dark:text-zinc-500 rounded-xl ps-10 cursor-not-allowed select-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 ms-1">
                            {t("phone") || "رقم الهاتف"}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                              <Phone
                                size={16}
                                className="text-gray-400 group-focus-within:text-yellow-500"
                              />
                            </div>
                            <input
                              type="tel"
                              name="phone"
                              required
                              value={formData.phone}
                              onChange={handleProfileChange}
                              className="w-full py-3 text-sm transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-xl ps-10 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 ms-1">
                            {t("alternatePhone") || "رقم هاتف بديل"}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 flex items-center pointer-events-none start-0 ps-3">
                              <Phone
                                size={16}
                                className="text-gray-400 group-focus-within:text-yellow-500"
                              />
                            </div>
                            <input
                              type="tel"
                              name="alternatePhone"
                              value={formData.alternatePhone}
                              onChange={handleProfileChange}
                              className="w-full py-3 text-sm transition-all border-2 border-transparent outline-none bg-gray-100/50 dark:bg-zinc-800/40 rounded-xl ps-10 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus:border-yellow-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:text-yellow-500 transition-colors"
                        >
                          <Shield size={16} />
                          {t("changePassword") || "تغيير كلمة المرور"}
                        </button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isUpdatingProfile}
                          type="submit"
                          className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-black text-gray-900 transition-all bg-yellow-400 shadow-lg rounded-xl hover:bg-yellow-500 shadow-yellow-400/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isUpdatingProfile ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          {isUpdatingProfile
                            ? t("saving") || "جاري الحفظ..."
                            : t("saveChanges") || "حفظ التغييرات"}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 2: ADDRESSES */}
          <div>
            {renderAccordionButton(
              "addresses",
              <MapPin size={18} />,
              t("addresses") || "العناوين",
            )}
            <AnimatePresence>
              {activeTab === "addresses" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 sm:p-8 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t("savedAddresses") || "العناوين المحفوظة"}
                      </h3>

                      {!isFormOpen && (
                        <button
                          onClick={handleAddNewClick}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 transition-all active:scale-95 shadow-md shadow-yellow-400/20"
                        >
                          <Plus size={16} />
                          <span>
                            {t("add-address-btn") || "إضافة عنوان جديد"}
                          </span>
                        </button>
                      )}
                    </div>

                    {isFormOpen && (
                      <form
                        onSubmit={handleAddressSubmit}
                        className="p-6 mb-6 space-y-5 bg-gray-50/80 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-800 rounded-2xl transition-all"
                      >
                        <div className="pb-2 border-b border-gray-200 dark:border-zinc-700/60">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {editingAddressId
                              ? t("edit-address") || "تعديل العنوان"
                              : t("add-address") || "إضافة عنوان جديد"}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={handleGetCurrentLocation}
                          disabled={isLocating}
                          className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold text-sm transition-all border border-gray-200 dark:border-zinc-700 active:scale-98 disabled:opacity-60 shadow-sm"
                        >
                          {isLocating ? (
                            <Loader2
                              size={18}
                              className="animate-spin text-yellow-500"
                            />
                          ) : (
                            <Navigation
                              size={18}
                              className="text-yellow-500 fill-yellow-500"
                            />
                          )}
                          {isLocating
                            ? isArabic
                              ? "جاري تحديد موقعك..."
                              : "Locating..."
                            : isArabic
                              ? "استخدام موقعي الحالي (GPS)"
                              : "Use Current Location (GPS)"}
                        </button>

                        <div>
                          <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                            {isArabic
                              ? "اسحب الدبوس لتحديد موقعك بدقة"
                              : "Drag the pin to fine-tune your exact location"}
                          </p>
                          {mounted && (
                            <div className="overflow-hidden border rounded-2xl border-gray-200 dark:border-zinc-700">
                              <LocationPicker
                                lat={addressForm.lat ?? DEFAULT_MAP_CENTER[0]}
                                lng={addressForm.lng ?? DEFAULT_MAP_CENTER[1]}
                                onChange={handleMapLocationChange}
                              />
                            </div>
                          )}
                        </div>

                        {hasLocation ? (
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl flex items-start gap-2 text-xs font-semibold text-green-700 dark:text-green-400">
                            <CheckCircle2
                              size={16}
                              className="shrink-0 mt-0.5"
                            />
                            <div className="flex flex-col gap-0.5">
                              {addressForm.location && (
                                <span>{addressForm.location}</span>
                              )}
                              <span>
                                {isArabic
                                  ? `تم التقاط الموقع: (${latDisplay}, ${lngDisplay})`
                                  : `Location captured: (${latDisplay}, ${lngDisplay})`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                            {isArabic
                              ? "اضغط على الزر أعلاه لتحديد موقعك تلقائيًا قبل الحفظ."
                              : "Tap the button above to auto-detect your location before saving."}
                          </p>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                              {t("addressTitle") || "عنوان الإقامة"}
                            </label>
                            <input
                              type="text"
                              name="title"
                              placeholder={t("title") || "اسم العنوان"}
                              value={addressForm.title}
                              onChange={handleAddressChange}
                              className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                            {t("street") || "الشارع"}
                          </label>
                          <input
                            type="text"
                            name="street"
                            placeholder={t("street") || "اسم الشارع"}
                            value={addressForm.street}
                            onChange={handleAddressChange}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                            {t("address") || "العنوان بالتفصيل"}
                          </label>
                          <textarea
                            name="fulladdress"
                            placeholder={t("address") || "العنوان الكامل"}
                            value={addressForm.fulladdress}
                            onChange={handleAddressChange}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400 resize-none"
                            rows={2}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                              {t("number") || "المبنى"}
                            </label>
                            <input
                              type="text"
                              name="number"
                              placeholder={t("number") || "رقم المبنى"}
                              value={addressForm.number}
                              onChange={handleAddressChange}
                              className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                              {t("floor") || "الطابق"}
                            </label>
                            <input
                              type="text"
                              name="floor"
                              placeholder={t("floor") || "رقم الطابق"}
                              value={addressForm.floor}
                              onChange={handleAddressChange}
                              className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                              {t("apartment") || "الشقة"}
                            </label>
                            <input
                              type="text"
                              name="apartment"
                              placeholder={t("apartment") || "رقم الشقة"}
                              value={addressForm.apartment}
                              onChange={handleAddressChange}
                              className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                            {t("landmark") || "علامة مميزة"}
                          </label>
                          <input
                            type="text"
                            name="landmark"
                            placeholder={t("landmark") || "علامة مميزة"}
                            value={addressForm.landmark}
                            onChange={handleAddressChange}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none text-sm dark:text-white focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
                          <button
                            type="submit"
                            disabled={
                              isAddingAddress ||
                              isUpdatingAddress ||
                              isLocating ||
                              !hasLocation
                            }
                            className="flex-1 py-3 px-4 font-bold text-zinc-900 bg-yellow-400 rounded-xl hover:bg-yellow-500 shadow-md shadow-yellow-400/20 disabled:opacity-70 flex justify-center items-center gap-2"
                          >
                            {isAddingAddress || isUpdatingAddress ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            <span>
                              {isAddingAddress || isUpdatingAddress
                                ? t("saving") || "جاري الحفظ..."
                                : editingAddressId
                                  ? t("update-address") || "تحديث العنوان"
                                  : t("add-address-btn") || "حفظ العنوان"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={resetAddressForm}
                            className="px-5 py-3 font-bold text-gray-600 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700"
                          >
                            {t("cancel") || "إلغاء"}
                          </button>
                        </div>
                      </form>
                    )}

                    {userData.addresses?.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 dark:text-zinc-400">
                        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                        <p>
                          {t("noAddresses") || "لا توجد عناوين محفوظة حالياً."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {userData.addresses?.map((address) => (
                          <div
                            key={address.id}
                            className={`p-5 border bg-gray-50/50 dark:bg-zinc-800/30 border-gray-200 dark:border-zinc-800 rounded-2xl transition-all relative flex flex-col justify-between ${
                              editingAddressId === address.id
                                ? "ring-2 ring-yellow-400/50 border-yellow-400"
                                : "hover:border-yellow-400/50"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                  {address.type === "work" ? (
                                    <Briefcase
                                      size={16}
                                      className="text-yellow-500"
                                    />
                                  ) : (
                                    <Home
                                      size={16}
                                      className="text-yellow-500"
                                    />
                                  )}
                                  {address.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  {address.lat && address.lng && (
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                      📍 GPS
                                    </span>
                                  )}
                                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 capitalize">
                                    {address.type || "home"}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1 text-sm text-gray-600 dark:text-zinc-400">
                                <p>
                                  <span className="font-semibold text-gray-700 dark:text-zinc-300">
                                    {t("street") || "الشارع"}:
                                  </span>{" "}
                                  {address.street} - مبنى {address.number} (طابق{" "}
                                  {address.floor})
                                </p>
                                {address.fulladdress && (
                                  <p className="line-clamp-2">
                                    <span className="font-semibold text-gray-700 dark:text-zinc-300">
                                      {t("address") || "العنوان"}:
                                    </span>{" "}
                                    {address.fulladdress}
                                  </p>
                                )}
                                {address.landmark && (
                                  <p className="italic text-gray-400 mt-1">
                                    {t("landmark") || "علامة مميزة"}:{" "}
                                    {address.landmark}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
                              <button
                                onClick={() => handleAddressEditClick(address)}
                                className="flex-1 px-4 py-2 text-xs font-bold text-blue-600 transition-colors rounded-xl bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center gap-1.5"
                              >
                                <Edit size={14} />
                                <span>{t("edit") || "تعديل"}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(address.id)}
                                disabled={isDeletingAddress}
                                className="flex-1 px-4 py-2 text-xs font-bold text-red-600 transition-colors rounded-xl bg-red-50 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <Trash2 size={14} />
                                <span>{t("delete") || "حذف"}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 3: FAVORITES */}
          <div>
            {renderAccordionButton(
              "favorites",
              <Heart size={18} />,
              t("favorites") || "المفضلة",
            )}
            <AnimatePresence>
              {activeTab === "favorites" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 sm:p-8 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {t("favorites") || "المفضلة"}
                    </h3>

                    {isFavLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                      </div>
                    ) : favorites.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 dark:text-zinc-400">
                        <Heart className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                        <p>
                          {t("noFavorites") || "لا توجد عناصر مفضلة حالياً."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {favorites.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 transition bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-yellow-400/50"
                          >
                            <div className="relative w-full h-40 mb-4 overflow-hidden rounded-xl">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="object-cover w-full h-full"
                              />
                            </div>

                            <h4 className="mb-1 font-bold text-gray-900 dark:text-white">
                              {isArabic ? item.nameAr : item.name}
                            </h4>

                            <p className="mb-3 text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">
                              {item.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="font-black text-yellow-500">
                                {item.price} E£
                              </span>

                              <button
                                onClick={() => handleRemoveFavorite(item.id)}
                                className="p-2 transition bg-red-100 rounded-full cursor-pointer dark:bg-red-500/10 hover:scale-110"
                              >
                                <Heart
                                  size={16}
                                  className="text-red-500 fill-red-500"
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 4: ORDER TRACKING */}
          <div>
            {renderAccordionButton(
              "tracking",
              <Truck size={18} />,
              t("orderTracking") || "تتبع الطلبات",
            )}
            <AnimatePresence>
              {activeTab === "tracking" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 sm:p-8 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {t("myOrders") || "طلباتي"}
                    </h3>

                    <div className="flex p-1 bg-gray-100 dark:bg-zinc-800/60 rounded-2xl">
                      <button
                        onClick={() => setOrderSubTab("active")}
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
                        onClick={() => setOrderSubTab("history")}
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
                      {isLoadingOrdersList ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                        </div>
                      ) : currentOrders.length > 0 ? (
                        currentOrders.map((order: any, i: number) => (
                          <motion.div
                            key={order.orderId || order.id || i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() =>
                              setSelectedOrderId(order.orderId || order.id)
                            }
                            className="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:border-yellow-400/50 transition-all active:scale-[0.98]"
                          >
                            <div className="relative flex-shrink-0 w-14 h-14 overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-800">
                              <img
                                src={
                                  order.restaurantImage || "/placeholder.jpg"
                                }
                                alt={order.restaurantName || "Restaurant logo"}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                  {order.restaurantName}
                                </h4>
                                <span className="text-[10px] font-bold px-2 py-1 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 rounded-lg uppercase whitespace-nowrap">
                                  {t(order.status) || order.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {t("dailyOrderNumber") || "رقم الطلب"} :{" "}
                                {order.dailyOrderNumber}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-black text-gray-900 dark:text-white">
                                  {order.totalAmount || order.total}{" "}
                                  {t("currency") || "ج.م"}
                                </span>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <ShoppingBag size={12} />{" "}
                                  {order.itemsCount || order.items?.length || 0}{" "}
                                  {t("items") || "عناصر"}
                                </span>
                              </div>

                              {orderSubTab === "active" &&
                                order.durationOrderPreparing && (
                                  <PrepCountdown
                                    createdAt={order.createdAt}
                                    durationMinutes={
                                      order.durationOrderPreparing
                                    }
                                    t={t}
                                    className="mt-2 w-fit"
                                  />
                                )}

                              {order.status === "out_for_delivery" &&
                                order.deliveryMan && (
                                  <div className="flex items-center justify-between mt-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-400/10 rounded-xl">
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-yellow-300">
                                      {order.deliveryMan.name}
                                    </span>
                                    <a
                                      href={`tel:${order.deliveryMan.phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400"
                                    >
                                      {order.deliveryMan.phone}
                                    </a>
                                  </div>
                                )}
                            </div>
                            <div className="text-gray-300 dark:text-zinc-600">
                              {isRtl ? (
                                <ChevronLeft size={18} />
                              ) : (
                                <ChevronRight size={18} />
                              )}
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-2xl">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {t("confirm-delete") || "تأكيد الحذف"}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {t("are-you-sure-delete") ||
                "هل أنت تأكد من أنك تريد حذف هذا العنوان؟"}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 rounded-xl dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {t("cancel") || "إلغاء"}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"
              >
                {t("delete") || "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Drawer */}
      <AnimatePresence>
        {selectedOrderId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderId(null)}
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

                {loadingOrderDetails ? (
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
                              {selectedOrder.restaurantName}
                            </h2>
                            <p className="text-xs text-gray-400">
                              {t("dailyOrderNumber") || "رقم الطلب"} :{" "}
                              {selectedOrder.dailyOrderNumber}
                            </p>
                            {selectedOrder.durationOrderPreparing && (
                              <PrepCountdown
                                createdAt={selectedOrder.createdAt}
                                durationMinutes={
                                  selectedOrder.durationOrderPreparing
                                }
                                t={t}
                                className="mt-1.5 w-fit"
                              />
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedOrderId(null)}
                          className="p-3 text-gray-500 transition-colors bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:text-red-500"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="p-5 border border-gray-100 bg-gray-50 dark:bg-zinc-900/50 rounded-3xl dark:border-zinc-800">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
                          <ShoppingBag size={14} />{" "}
                          {t("orderSummary") || "ملخص الطلب"}
                        </h4>
                        <div className="space-y-4">
                          {(selectedOrder.items || []).map(
                            (item: any, i: number) => {
                              let parsedVariations: any[] = [];
                              let parsedAddons: any[] = [];
                              try {
                                parsedVariations =
                                  typeof item.variations === "string"
                                    ? JSON.parse(item.variations)
                                    : item.variations || [];
                              } catch {
                                parsedVariations = [];
                              }
                              try {
                                parsedAddons =
                                  typeof item.addons === "string"
                                    ? JSON.parse(item.addons)
                                    : item.addons || [];
                              } catch {
                                parsedAddons = [];
                              }

                              return (
                                <div
                                  key={i}
                                  className="flex flex-col gap-2 pb-3 border-b border-gray-100 dark:border-zinc-800 last:border-0 last:pb-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center justify-center w-7 h-7 bg-yellow-400 text-gray-900 text-[10px] font-black rounded-lg">
                                        {item.quantity || 1}x
                                      </span>
                                      <span className="text-sm font-bold">
                                        {item.foodName || item.name}
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
                                      {parsedVariations.map(
                                        (v: any, vi: number) => (
                                          <div
                                            key={`v-${vi}`}
                                            className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400"
                                          >
                                            <span>
                                              •{" "}
                                              {v.optionName ||
                                                v.name ||
                                                t("variation")}
                                            </span>
                                            {v.additionalPrice && (
                                              <span>
                                                +{v.additionalPrice}{" "}
                                                {t("currency") || "ج.م"}
                                              </span>
                                            )}
                                          </div>
                                        ),
                                      )}
                                      {parsedAddons.map(
                                        (a: any, ai: number) => (
                                          <div
                                            key={`a-${ai}`}
                                            className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400"
                                          >
                                            <span>
                                              +{" "}
                                              {(isArabic ? a.nameAr : a.name) ||
                                                a.name ||
                                                t("addon")}
                                            </span>
                                            {a.price && (
                                              <span>
                                                +{a.price}{" "}
                                                {t("currency") || "ج.م"}
                                              </span>
                                            )}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}

                                  {item.note && (
                                    <div className="ml-10 text-xs italic text-gray-400">
                                      {t("note") || "ملاحظة"}: {item.note}
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
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
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400"
                            >
                              {t("callDeliveryMan") || "اتصال بعامل التوصيل"} :{" "}
                              {selectedOrder.deliveryMan.phone}
                            </a>
                          </div>
                        )}

                      <div className="p-5 bg-yellow-400 rounded-[2rem] text-gray-900 flex items-center justify-between shadow-lg shadow-yellow-400/20">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl">
                            <ReceiptText size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-black opacity-60">
                              {t("orderStatus") || "حالة الطلب"}
                            </p>
                            <p className="text-lg font-black leading-none">
                              {t(selectedOrder.status) || selectedOrder.status}
                            </p>
                          </div>
                        </div>

                        {isCancellationAllowed(selectedOrder.status) && (
                          <button
                            onClick={handleOpenCancelModal}
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

      {/* Cancel Reason Modal */}
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
                  {t("cancelOrderTitle") || "إلغاء الطلب"}
                </h3>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  {t("cancelOrderDesc") ||
                    "برجاء اختيار سبب الإلغاء قبل المتابعة"}
                </p>

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
                      {t("noReasonsAvailable") || "لا توجد أسباب متاحة"}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {t("back") || "تراجع"}
                  </button>
                  <button
                    onClick={handleCancelOrderSubmit}
                    disabled={updatingOrderStatus || !selectedReasonId}
                    className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-red-600/10 flex items-center justify-center gap-2"
                  >
                    {updatingOrderStatus ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      t("confirmCancel") || "تأكيد الإلغاء"
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