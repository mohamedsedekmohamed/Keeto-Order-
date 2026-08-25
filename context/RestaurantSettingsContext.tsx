"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/api/api";
import { getRestaurantId, setRestaurantId as storeRestaurantId } from "./Restaurantid";

export interface RestaurantSettings {
  firstColor?: string;
  secondColor?: string;
  firstTextColor?: string;
  secondTextColor?: string;
  textFirstColor?: string;
  textSecondColor?: string;
  text_first_color?: string;
  text_second_color?: string;
  [key: string]: any;
}

export interface RestaurantSettingsApiResponse {
  success: boolean;
  data: {
    message?: string;
    data: RestaurantSettings;
  };
}

export interface RestaurantSettingsContextType {
  settings: RestaurantSettings | null;
  firstColor: string;
  secondColor: string;
  firstTextColor: string;
  secondTextColor: string;
  textFirstColor: string;
  textSecondColor: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  themeStyles: {
    primaryBg: { backgroundColor: string };
    hoverBg: { backgroundColor: string };
    primaryText: { color: string };
    secondaryText: { color: string };
    firstTextColor: { color: string };
    secondTextColor: { color: string };
    textFirstColor: { color: string };
    textSecondColor: { color: string };
    mainButton: { backgroundColor: string; color: string };
    accentBorder: { borderColor: string };
  };
}

// Fallback defaults if API hasn't loaded or settings are missing
const DEFAULT_FIRST_COLOR = "#facc15"; // Main theme color
const DEFAULT_SECOND_COLOR = "#eab308"; // Hover color
const DEFAULT_FIRST_TEXT_COLOR = "#000000"; // Main text color
const DEFAULT_SECOND_TEXT_COLOR = "#ffffff"; // Secondary / Hover text color

const RestaurantSettingsContext = createContext<
  RestaurantSettingsContextType | undefined
>(undefined);

export function RestaurantSettingsProvider({
  children,
  restaurantId: explicitRestaurantId,
}: {
  children: React.ReactNode;
  restaurantId?: string;
}) {
  const params = useParams();
  const searchParams = useSearchParams();

  // Try to resolve restaurant slug or ID from various sources
  const paramSlug = (params?.slug as string) || "";
  const paramId = (params?.id as string) || "";
  const querySlug = (searchParams?.get("callbackSlug") as string) || "";
  const queryId = (searchParams?.get("restaurantId") as string) || "";

  const slug = paramSlug || querySlug;
  const storedId = getRestaurantId(slug);

  const activeRestaurantId =
    explicitRestaurantId ||
    paramId ||
    queryId ||
    storedId ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("restaurantId") || localStorage.getItem("restaurant_id")
      : null);

  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(
    async (idToFetch: string) => {
      if (!idToFetch) return;
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get<RestaurantSettingsApiResponse>(
          `/api/user/settings/${idToFetch}`
        );

        const responseData = response?.data?.data?.data || response?.data?.data || response?.data;

        if (responseData && typeof responseData === "object") {
          setSettings(responseData as RestaurantSettings);
        }
      } catch (err: any) {
        console.warn("Could not fetch restaurant settings:", err?.message || err);
        setError(err?.message || "Failed to fetch restaurant settings");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeRestaurantId) {
      fetchSettings(activeRestaurantId);
    }
  }, [activeRestaurantId, fetchSettings]);

  // Helper to make a color heavier/darker for rich hover states
  function darkenColor(color: string, percent: number = 15): string {
    if (!color || typeof color !== "string") return color;
    let hex = color.trim().replace(/^#/, "");

    // Handle 3-character hex (#RGB -> #RRGGBB)
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }

    if (hex.length === 6) {
      const num = parseInt(hex, 16);
      if (isNaN(num)) return color;

      let r = (num >> 16) & 0xff;
      let g = (num >> 8) & 0xff;
      let b = num & 0xff;

      const factor = Math.max(0, (100 - percent) / 100);
      r = Math.max(0, Math.min(255, Math.floor(r * factor)));
      g = Math.max(0, Math.min(255, Math.floor(g * factor)));
      b = Math.max(0, Math.min(255, Math.floor(b * factor)));

      const toHex = (n: number) => n.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    return color;
  }

  // Extract keys with fallbacks
  const isValidColor = (c?: string | null) =>
    Boolean(
      c &&
      typeof c === "string" &&
      c.trim() !== "" &&
      c.toLowerCase() !== "transparent" &&
      c.toLowerCase() !== "none" &&
      c.toLowerCase() !== "rgba(0,0,0,0)" &&
      c.toLowerCase() !== "rgba(0, 0, 0, 0)"
    );

  const firstColor = isValidColor(settings?.firstColor)
    ? (settings?.firstColor as string)
    : DEFAULT_FIRST_COLOR;

  // In all restaurants, the hover color is ALWAYS the firstColor made heavier / darker
  const secondColor = darkenColor(firstColor, 18);


  const rawFirstTextColor =
    settings?.textFirstColor ??
    settings?.firstTextColor ??
    settings?.text_first_color ??
    settings?.first_text_color;

  const firstTextColor = isValidColor(rawFirstTextColor)
    ? (rawFirstTextColor as string)
    : DEFAULT_FIRST_TEXT_COLOR;

  const rawSecondTextColor =
    settings?.textSecondColor ??
    settings?.secondTextColor ??
    settings?.text_second_color ??
    settings?.second_text_color;

  const secondTextColor = isValidColor(rawSecondTextColor)
    ? (rawSecondTextColor as string)
    : firstTextColor; // Fallback to firstTextColor

  // Apply CSS variables dynamically to the document root
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.style.setProperty("--theme-first-color", firstColor);
    root.style.setProperty("--theme-second-color", secondColor);
    root.style.setProperty("--theme-first-text-color", firstTextColor);
    root.style.setProperty("--theme-second-text-color", secondTextColor);
    root.style.setProperty("--theme-text-first-color", firstTextColor);
    root.style.setProperty("--theme-text-second-color", secondTextColor);

    // Common aliases for flexible usage
    root.style.setProperty("--theme-main-color", firstColor);
    root.style.setProperty("--theme-hover-color", secondColor);
    root.style.setProperty("--theme-main-text", firstTextColor);
    root.style.setProperty("--theme-hover-text", secondTextColor);
    root.style.setProperty("--color-theme-first", firstColor);
    root.style.setProperty("--color-theme-second", secondColor);
    root.style.setProperty("--color-theme-first-text", firstTextColor);
    root.style.setProperty("--color-theme-second-text", secondTextColor);
    root.style.setProperty("--color-theme-text-first", firstTextColor);
    root.style.setProperty("--color-theme-text-second", secondTextColor);
  }, [firstColor, secondColor, firstTextColor, secondTextColor]);

  const themeStyles = useMemo(
    () => ({
      primaryBg: { backgroundColor: firstColor },
      hoverBg: { backgroundColor: secondColor },
      primaryText: { color: firstTextColor },
      secondaryText: { color: secondTextColor },
      firstTextColor: { color: firstTextColor },
      secondTextColor: { color: secondTextColor },
      textFirstColor: { color: firstTextColor },
      textSecondColor: { color: secondTextColor },
      mainButton: {
        backgroundColor: firstColor,
        color: firstTextColor,
      },
      accentBorder: { borderColor: firstColor },
    }),
    [firstColor, secondColor, firstTextColor, secondTextColor]
  );

  const refetch = useCallback(async () => {
    if (activeRestaurantId) {
      await fetchSettings(activeRestaurantId);
    }
  }, [activeRestaurantId, fetchSettings]);

  const value = useMemo(
    () => ({
      settings,
      firstColor,
      secondColor,
      firstTextColor,
      secondTextColor,
      textFirstColor: firstTextColor,
      textSecondColor: secondTextColor,
      isLoading,
      error,
      refetch,
      themeStyles,
    }),
    [
      settings,
      firstColor,
      secondColor,
      firstTextColor,
      secondTextColor,
      isLoading,
      error,
      refetch,
      themeStyles,
    ]
  );

  return (
    <RestaurantSettingsContext.Provider value={value}>
      {children}
    </RestaurantSettingsContext.Provider>
  );
}

export function useRestaurantSettings() {
  const context = useContext(RestaurantSettingsContext);
  if (!context) {
    // Return default fallback object if used outside provider
    return {
      settings: null,
      firstColor: DEFAULT_FIRST_COLOR,
      secondColor: DEFAULT_FIRST_COLOR,
      firstTextColor: DEFAULT_FIRST_TEXT_COLOR,
      secondTextColor: DEFAULT_FIRST_TEXT_COLOR,
      textFirstColor: DEFAULT_FIRST_TEXT_COLOR,
      textSecondColor: DEFAULT_FIRST_TEXT_COLOR,
      isLoading: false,
      error: null,
      refetch: async () => {},
      themeStyles: {
        primaryBg: { backgroundColor: DEFAULT_FIRST_COLOR },
        hoverBg: { backgroundColor: DEFAULT_FIRST_COLOR },
        primaryText: { color: DEFAULT_FIRST_TEXT_COLOR },
        secondaryText: { color: DEFAULT_FIRST_TEXT_COLOR },
        firstTextColor: { color: DEFAULT_FIRST_TEXT_COLOR },
        secondTextColor: { color: DEFAULT_FIRST_TEXT_COLOR },
        textFirstColor: { color: DEFAULT_FIRST_TEXT_COLOR },
        textSecondColor: { color: DEFAULT_FIRST_TEXT_COLOR },
        mainButton: {
          backgroundColor: DEFAULT_FIRST_COLOR,
          color: DEFAULT_FIRST_TEXT_COLOR,
        },
        accentBorder: { borderColor: DEFAULT_FIRST_COLOR },
      },
    };
  }
  return context;
}

// Alias for convenience
export const useThemeSettings = useRestaurantSettings;

export default RestaurantSettingsProvider;

