"use client";

import { createContext, useContext } from "react";
import { useParams } from "next/navigation";
import useGet from "@/hooks/useGet";

// ==========================================
// 1. الأنواع (Types & Interfaces)
// ==========================================
export interface Restaurant {
  id: string;
  name: string;
  logo: string;
  cover: string;
  address: string;
  minDeliveryTime: string;
  maxDeliveryTime: string;
}

// إضافة Types للـ Variations والـ Options الخاصة بها
export interface VariationOption {
  id: string;
  name: string;
  additionalPrice: string;
}

export interface Variation {
  id: string;
  name: string;
  isRequired: boolean;
  selectionType: "single" | "multiple" | string;
  min: number | null;
  max: number | null;
  options: VariationOption[];
}

// تحديث MenuItem ليتطابق مع الـ JSON الجديد
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  variations: Variation[];
}

export type Menu = Record<string, MenuItem[]>;

// ==========================================
// 2. إنشاء الـ Contexts منفصلين
// ==========================================
const RestaurantContext = createContext<{
  restaurant: Restaurant | null;
  isLoading: boolean;
  isError: boolean;
}>({ restaurant: null, isLoading: true, isError: false });

const MenuContext = createContext<{
  menu: Menu | null;
  isLoading: boolean;
  isError: boolean;
}>({ menu: null, isLoading: true, isError: false });

// ==========================================
// 3. إنشاء Custom Hooks منفصلة لكل Context
// ==========================================
export const useRestaurant = () => useContext(RestaurantContext);
export const useMenu = () => useContext(MenuContext);

// ==========================================
// 4. الـ Provider الموحد
// ==========================================
export default function RestaurantAndMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const restaurantId = params?.id as string;

  // جلب البيانات مرة واحدة فقط
  const { data, loading, refetch, error } = useGet<any>(
    `/api/user/home/restaurants/${restaurantId}`
  );

  // استخراج البيانات (المسار لا يزال مطابقاً للـ JSON الجديد)
  const restaurant = data?.data?.data?.restaurant || null;
  const menu = data?.data?.data?.menu || null;

  return (
    <RestaurantContext.Provider
      value={{ restaurant, isLoading: loading || false, isError: !!error }}
    >
      <MenuContext.Provider
        value={{ menu, isLoading: loading || false, isError: !!error }}
      >
        {children}
      </MenuContext.Provider>
    </RestaurantContext.Provider>
  );
}