"use client";

import { createContext, useContext } from "react";
import { useParams } from "next/navigation";
import useGet from "@/app/hooks/useGet";

// ==========================================
// 1. الأنواع (Types & Interfaces)
// ==========================================
export interface Restaurant {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  logo: string;
  cover: string;
  email?: string;
  address: string;
  addressAr: string;
  addressFr?: string;
  ownerPhone: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  minDeliveryTime: string;
  maxDeliveryTime: string;
  deliveryTimeUnit?: string;
  status?: string;
  isFavorite?: boolean;
  lat?: string | null;
  lng?: string | null;
}

export interface VariationOption {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  additionalPrice: string;
}

export interface Variation {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  isRequired: boolean;
  selectionType: "single" | "multiple" | string;
  min: number | null;
  max: number | null;
  options: VariationOption[];
}

// ── The subcategory reference embedded inside each food item ──
// Matches: food.subcategory = { id, name, nameAr, nameFr } | null
export interface FoodSubCategoryRef {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  order_level: number;
}

// ── The category reference embedded inside each food item ──
// Matches: food.category = { id, name, nameAr, nameFr }
export interface FoodCategoryRef {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
}

// ── A single food item as returned by the API ──
// The API returns foods flat inside category.foods[],
// each food carries its own category + subcategory refs.
export interface MenuItem {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  description: string;
  descriptionAr: string;
  descriptionFr?: string;
  price: string;
  image: string;
  isFavorite?: boolean;
  variations: Variation[];
  // Embedded refs from the API response
  category?: FoodCategoryRef | null;
  subcategory?: FoodSubCategoryRef | null;  // null when food has no sub-category
  addon?: any | null;
}

// ── API shape: category holds a flat foods[] array ──
// SubCategories do NOT come from the API directly;
// they are derived at runtime by grouping foods on food.subcategory.
export interface MenuCategory {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  foods: MenuItem[];          // flat list — group by food.subcategory client-side
}

export type Menu = MenuCategory[];

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

  const { data, loading, error } = useGet<any>(
    `/api/user/home/restaurants/${restaurantId}`,
  );

  const restaurant: Restaurant | null = data?.data?.data?.restaurant || null;
  const menu: Menu | null = data?.data?.data?.menu || null;

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
