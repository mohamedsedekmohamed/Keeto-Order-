"use client";

import React, { useState, useEffect, useMemo } from "react";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
import usePut from "@/app/hooks/usePut";
import useDelete from "@/app/hooks/useDelete";
import { useLanguage } from "@/context/LanguageContext";
import { useToken } from "@/context/TokenContext";
import { useParams, useRouter } from "next/navigation";
import { useRestaurant } from "@/context/RestaurantContext";
import Loading from "@/components/Loading";
import { ChevronLeft, Navigation, Loader2, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";

type Zone = { id: string; name: string; nameAr: string; cityId: string; };
type Address = { id: string; title: string; street: string; number: string; floor: string; type: "home" | "work" | "other"; zoneId: string; lat: number | null; lng: number | null; };

const AddressPage = () => {
  const { t, language } = useLanguage();
  const { token, isReady } = useToken();
  const params = useParams();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationErrorType, setLocationErrorType] = useState<"ios" | "android" | "generic" | "facebook" | null>(null);

  const isArabic = String(language).toLowerCase() === "ar";
  const restaurantName = params.slug as string;
  const basePath = `/home/restaurants/${restaurantName}`;

  const { data: addressesRes, loading: loadingAddresses, refetch } = useGet<any>("/api/user/address");
  const { data: zonesRes, loading: loadingZones } = useGet<any>("/api/user/address/zone");
  const { postData, loading: posting } = usePost("/api/user/address");
  const { putData, loading: putting } = usePut();
  const { deleteData, loading: deleting } = useDelete("");

  const addresses: Address[] = addressesRes?.data?.data || [];
  const zones: Zone[] = zonesRes?.data?.data || [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [form, setForm] = useState({ title: "", zoneId: "", type: "home", street: "", number: "", floor: "", lat: null as number | null, lng: null as number | null });

  const cities = useMemo(() => {
    const uniqueCitiesMap = new Map<string, { id: string; name: string; nameAr: string }>();
    zones.forEach((zone: any) => {
      if (zone.cityId && !uniqueCitiesMap.has(zone.cityId)) {
        uniqueCitiesMap.set(zone.cityId, {
          id: zone.cityId,
          name: zone.cityId === "2cf2d384-9467-4d79-a269-d9527cdc66e2" ? "Alexandria" : "Cairo",
          nameAr: zone.cityId === "2cf2d384-9467-4d79-a269-d9527cdc66e2" ? "الإسكندرية" : "القاهرة",
        });
      }
    });
    return Array.from(uniqueCitiesMap.values());
  }, [zones]);

  const filteredZones = useMemo(() => zones.filter((z) => z.cityId === selectedCityId), [selectedCityId, zones]);

  const handleGetCurrentLocation = () => {
    const ua = navigator.userAgent;
    const isFB = /FBAN|FBAV/i.test(ua);
    
    if (isFB) { setLocationErrorType("facebook"); return; }
    if (!navigator.geolocation) { setLocationErrorType("generic"); return; }

    setIsLocating(true);
    setLocationErrorType(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        const isiOS = /iPad|iPhone|iPod/.test(ua);
        const isAndroid = /Android/i.test(ua);
        setLocationErrorType(isiOS ? "ios" : isAndroid ? "android" : "generic");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="p-4 mx-auto max-w-7xl">
      <button onClick={() => router.back()} className="mb-4 p-2 bg-yellow-400 rounded-full"><ChevronLeft /></button>
      
      <div className="bg-white p-6 rounded-3xl border border-zinc-200">
        <button type="button" onClick={handleGetCurrentLocation} className="w-full py-3 mb-4 bg-zinc-100 rounded-xl font-bold flex justify-center gap-2">
          {isLocating ? <Loader2 className="animate-spin" /> : <Navigation size={18} />}
          {isLocating ? t("loading") : (isArabic ? "استخدام موقعي الحالي (GPS)" : "Use Current Location")}
        </button>

        {locationErrorType && (
          <div className="mb-4 p-4 border rounded-2xl bg-amber-50 border-amber-200 text-amber-900">
            <p className="font-bold mb-1">⚠️ {isArabic ? "صلاحية الموقع محجوبة" : "Location Access Blocked"}</p>
            {locationErrorType === "facebook" && (
              <ul className="list-decimal ps-5 text-sm space-y-1">
                <li>{isArabic ? "اضغط على القائمة (⋮) بالأعلى." : "Tap menu (⋮) at top."}</li>
                <li>{isArabic ? "اختر «فتح في المتصفح»." : "Select 'Open in Browser'."}</li>
              </ul>
            )}
            {locationErrorType === "ios" && <p className="text-sm">{isArabic ? "يرجى تفعيل خدمات الموقع والسماح لـ Safari." : "Please enable location for Safari."}</p>}
            {locationErrorType === "android" && <p className="text-sm">{isArabic ? "يرجى تفعيل الـ GPS والسماح للمتصفح." : "Please enable GPS and browser permission."}</p>}
            {locationErrorType === "generic" && <p className="text-sm">{isArabic ? "تعذر الوصول للموقع." : "Unable to access location."}</p>}
          </div>
        )}
        
        {/* باقي الفورم وعرض العناوين كما في الكود السابق */}
      </div>
    </div>
  );
};

export default AddressPage;