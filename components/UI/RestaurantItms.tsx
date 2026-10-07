"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Plus, X, Minus, LayoutGrid } from "lucide-react";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import useGet from "@/app/hooks/useGet";
import usePost from "@/app/hooks/usePost";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import AddAddressPopup from "./ResturantitmsComps/AddAddressPopup";
import CartConflictDialog from "./ResturantitmsComps/CartConflictDialog";
import FoodAddonOptions, {
  type AddonItem,
} from "./ResturantitmsComps/FoodAddonOptions";
import FoodCard from "./ResturantitmsComps/FoodCard";
import AddToCartDialog from "./ResturantitmsComps/AddToCartDialog";
import FoodVariationOptions from "./ResturantitmsComps/FoodVariationOptions";
import FulfillmentDialog from "./ResturantitmsComps/FulfillmentDialog";
import SubCategoryCard from "./ResturantitmsComps/SubCategoryCard";
import {
  hasDiscount,
  getEffectivePrice,
} from "./ResturantitmsComps/menuPricing";
import { useLanguage } from "@/context/LanguageContext";
import { useAppDispatch } from "@/redux/hooks";
import { clearCartLocal } from "@/redux/cartSlice";
import {
  MenuItem,
  Variation,
  VariationOption,
  MenuCategory,
  useRestaurant,
  useRestaurantSettings,
} from "@/context/RestaurantContext";
import api from "@/api/api";
import useDelete from "@/app/hooks/useDelete";
import { useToken } from "@/context/TokenContext";

interface DerivedSubCategory {
  id: string; // subcategory id OR "__no_sub__"
  name: string;
  nameAr: string;
  orderLevel: number;
  image: string | null;
  foods: MenuItem[];
}

interface DerivedCategory {
  id: string;
  name: string;
  nameAr: string;
  subCategories: DerivedSubCategory[];
  totalFoods: number;
  coverImage: string;
}

type ViewMode = "menu";

export default function RestaurantItms({
  menu,
  restaurantId,
  onCartUpdated,
  focusTarget,
}: {
  menu: MenuCategory[] | null;
  restaurantId: string;
  onCartUpdated: () => void;
  // Set by the parent (e.g. promo popup) to ask this component to scroll to
  // a subcategory or a product. Pass a NEW object each time.
  focusTarget?: { type: "subcategory" | "product"; id: string } | null;
}) {
  const { language, t } = useLanguage();
  const isRtl = language === "العربية";
  const router = useRouter();
  const { postData: toggleFav } = usePost("/api/user/favlist/toggle");
  const dispatch = useAppDispatch();
  const params = useParams();
  const restaurantSlug = params?.slug as string;

  // ── Restaurant context ────────────────────────────────────────────
  const { restaurant } = useRestaurant();
  const { firstColor, textFirstColor } = useRestaurantSettings();

  // ── Auth ──────────────────────────────────────────────────────────
  const { getToken } = useToken();
  const token = getToken(restaurantSlug);

  // ── Favorites ─────────────────────────────────────────────────────
  const [favoritesList, setFavoritesList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) fetchFavorites();
  }, [token]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "https://keetobcknd.keeto.org/api/user/favlist",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const foods = res?.data?.data?.data?.foods;
      setFavoritesList(
        Array.isArray(foods)
          ? foods.map((f: any) => f?.id).filter(Boolean)
          : [],
      );
    } catch (e) {
      console.error("Error fetching favorites:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Navigation state ──────────────────────────────────────────────
  const [viewMode] = useState<ViewMode>("menu");
  const [activeCategoryTab, setActiveCategoryTab] = useState("");
  const [activeSubCategoryTab, setActiveSubCategoryTab] = useState<
    string | null
  >("all");

  // ── Scroll-spy state ──────────────────────────────────────────────
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const subCategoryMenuRef = useRef<HTMLDivElement | null>(null);
  const isManualClick = useRef(false);
  const manualClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentActiveSectionRef = useRef<string>("");
  const lastActiveIdRef = useRef<string>("");

  // ── Search ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedFoodId, setHighlightedFoodId] = useState<string | null>(
    null,
  );
  const handledFocusRef = useRef<unknown>(null);
  const { deleteData } = useDelete("/users");

  // ── Item modal & Cart conflict states ─────────────────────────────
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingCartPayload, setPendingCartPayload] = useState<any | null>(
    null,
  );

  // ── Recommended foods popup states ────────────────────────────────
  const [recommendedFoods, setRecommendedFoods] = useState<any[]>([]);
  const [showRecommendedModal, setShowRecommendedModal] = useState(false);
  const [addingRecommendedId, setAddingRecommendedId] = useState<string | null>(
    null,
  );
  // Per-item selection state for the upselling ("You might also like")
  // dialog — each recommended food gets its own quantity / variations /
  // addons so the whole thing can be configured and added to cart right
  // there, without opening the separate item modal.
  const [recommendedSelections, setRecommendedSelections] = useState<
    Record<
      string,
      {
        quantity: number;
        selectedOptions: Record<string, string[]>;
        selectedAddons: string[];
      }
    >
  >({});

  // ── Fulfillment states ────────────────────────────────────────────
  const [showFulfillmentDialog, setShowFulfillmentDialog] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<
    "delivery" | "takeaway" | null
  >(null);
  const [selectedFulfillmentId, setSelectedFulfillmentId] =
    useState<string>("");
  const [showAddAddressPopup, setShowAddAddressPopup] = useState(false);

  // ─────────────────────────────────────────────────────────────────
  // DERIVED DATA — group flat foods into DerivedCategory[]
  // ─────────────────────────────────────────────────────────────────
  const derivedMenu = useMemo<DerivedCategory[]>(() => {
    if (!Array.isArray(menu)) return [];
    return menu.map((cat) => {
      const subMap = new Map<string, DerivedSubCategory>();
      (cat.foods || []).forEach((food: any) => {
        const sub = food.subcategory;
        const key = sub?.id ? sub.id : "__no_sub__";
        if (!subMap.has(key)) {
          subMap.set(key, {
            id: key,
            name: sub?.id ? sub.name : cat.name,
            nameAr: sub?.id ? sub.nameAr : cat.nameAr,
            orderLevel:
              sub?.id && typeof sub.order_level === "number"
                ? sub.order_level
                : 999,
            image: sub?.id && sub.image ? sub.image : null,
            foods: [],
          });
        }
        subMap.get(key)!.foods.push(food as MenuItem);
      });

      const subCategories = Array.from(subMap.values()).sort(
        (a, b) => a.orderLevel - b.orderLevel,
      );

      return {
        id: cat.id,
        name: cat.name,
        nameAr: cat.nameAr,
        subCategories,
        totalFoods: subCategories.reduce((n, s) => n + s.foods.length, 0),
        coverImage:
          subCategories[0]?.image ||
          subCategories[0]?.foods[0]?.image ||
          "/placeholder.jpg",
      };
    });
  }, [menu]);

  const dynamicSubCategories = useMemo(() => {
    const subs: {
      id: string;
      rawId: string;
      name: string;
      nameAr: string;
      catId: string;
      orderLevel: number;
      totalFoods: number;
      coverImage: string;
      foods: MenuItem[];
    }[] = [];
    derivedMenu.forEach((cat) => {
      cat.subCategories.forEach((sub) => {
        const uniqueId =
          sub.id === "__no_sub__" ? `${cat.id}__no_sub__` : sub.id;
        subs.push({
          id: uniqueId,
          rawId: sub.id,
          name: sub.name,
          nameAr: sub.nameAr,
          catId: cat.id,
          orderLevel: sub.orderLevel,
          totalFoods: sub.foods.length,
          coverImage: sub.image || sub.foods[0]?.image || "/placeholder.jpg",
          foods: sub.foods,
        });
      });
    });
    return subs.sort((a, b) => a.orderLevel - b.orderLevel);
  }, [derivedMenu]);

  useEffect(() => {
    if (dynamicSubCategories.length > 0 && !activeCategoryTab) {
      const first = dynamicSubCategories[0];
      setActiveCategoryTab(first.catId);
      setActiveSubCategoryTab("all");
    }
  }, [dynamicSubCategories, activeCategoryTab]);

  const dynamicItems = useMemo(() => {
    const itms: (MenuItem & { categoryId: string; subCategoryId: string })[] =
      [];
    derivedMenu.forEach((cat) => {
      cat.subCategories.forEach((sub) => {
        sub.foods.forEach((food) =>
          itms.push({ ...food, categoryId: cat.id, subCategoryId: sub.id }),
        );
      });
    });
    return itms;
  }, [derivedMenu]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return dynamicItems.filter(
      (f) =>
        (f.name ?? "").toLowerCase().includes(q) ||
        (f.nameAr ?? "").toLowerCase().includes(q),
    );
  }, [dynamicItems, searchQuery]);

  const getSectionKey = (catId: string, subId: string) => `${catId}||${subId}`;

  const centerActiveTab = (targetId: string) => {
    if (lastActiveIdRef.current === targetId) return;
    lastActiveIdRef.current = targetId;

    // Defer the layout reads (getBoundingClientRect/offsetWidth) and the
    // scrollTo write to the next animation frame. This callback runs from
    // the IntersectionObserver while the user is actively touch-scrolling
    // the page, so doing synchronous layout work here forces the browser
    // to interrupt the scroll gesture to recalculate layout ("layout
    // thrashing"), which is a common cause of stuttery mobile scrolling.
    requestAnimationFrame(() => {
      const subTab = document.getElementById(targetId);
      if (subTab && subCategoryMenuRef.current) {
        const container = subCategoryMenuRef.current;
        const tabRect = subTab.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const containerWidth = container.offsetWidth;
        const tabWidth = subTab.offsetWidth;

        const tabOffsetLeft =
          tabRect.left - containerRect.left + container.scrollLeft;
        const centerPos = tabOffsetLeft - containerWidth / 2 + tabWidth / 2;

        container.scrollTo({
          left: centerPos,
          behavior: "smooth",
        });
      }
    });
  };

  const getOrderSource = () => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem(`login_source_${restaurantSlug}`) ||
        "online_order_web"
      );
    }
    return "online_order_web";
  };

  // ── Remembered fulfillment choice (address/branch) ─────────────────
  // Persisted per-restaurant so the fulfillment dialog doesn't have to
  // ask again on every add-to-cart. It's only reused when the stored
  // address/branch is still valid for the item being added — otherwise
  // it's discarded and the dialog asks again.
  const fulfillmentStorageKey = `fulfillment_choice_${restaurantSlug}`;

  const getStoredFulfillment = (): {
    mode: "delivery" | "takeaway";
    id: string;
  } | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(fulfillmentStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        (parsed.mode === "delivery" || parsed.mode === "takeaway") &&
        typeof parsed.id === "string" &&
        parsed.id
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  };

  const setStoredFulfillment = (mode: "delivery" | "takeaway", id: string) => {
    if (typeof window === "undefined" || !id) return;
    sessionStorage.setItem(fulfillmentStorageKey, JSON.stringify({ mode, id }));
  };

  const clearStoredFulfillment = () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(fulfillmentStorageKey);
  };

  const { data: checkoutData, refetch: refetchCheckoutData } = useGet<any>(
    `/api/user/order/select?restaurantId=${params.id}&orderSource=${getOrderSource()}`,
  );

  // api/user/order/select responds with a double-nested "data" object:
  // { success, data: { data: { addresses, branches, zones, ... } } }
  // Reading `checkoutData?.data?.addresses` (single nested) silently
  // returns undefined — the real payload lives one level deeper.
  const selectData = checkoutData?.data?.data;

  // All of the user's saved addresses. We show every one of these in the
  // fulfillment dialog (matching the checkout page's address list) rather
  // than pre-filtering by isDeliverable — filtering here was hiding a
  // just-added address whenever the backend hadn't (yet) flagged it
  // deliverable, even though it existed and the user expected to see it.
  // Deliverability is instead surfaced per-card (red border + warning) and
  // only deliverable addresses are actually selectable.
  const allAddresses = useMemo(() => selectData?.addresses || [], [selectData]);

  // Kept for the "reuse the last remembered choice" logic below, which
  // should only ever silently reuse an address that's actually deliverable.
  const deliverableAddresses = useMemo(
    () => allAddresses.filter((addr: any) => addr.isDeliverable),
    [allAddresses],
  );

  // Exclude branches the selected item is unavailable at, and keep only
  // active branches — this is what the "unavailableBranches" dialog exists
  // to resolve, so a branch it's not available at should never be selectable.
  const availableBranches = useMemo(() => {
    const unavailableIds: string[] = selectedItem?.unavailableBranches || [];
    return (selectData?.branches || []).filter(
      (branch: any) =>
        branch.status === "active" && !unavailableIds.includes(branch.id),
    );
  }, [selectData, selectedItem]);

  useEffect(() => {
    if (
      searchQuery ||
      viewMode !== "menu" ||
      !Array.isArray(menu) ||
      activeSubCategoryTab === "all"
    )
      return;

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (isManualClick.current) return;

      const visibleEntries = entries.filter((e) => e.isIntersecting);

      if (visibleEntries.length > 0) {
        const topEntry = visibleEntries.reduce(
          (max, entry) =>
            entry.intersectionRatio > max.intersectionRatio ? entry : max,
          visibleEntries[0],
        );

        const parentCatId = topEntry.target.getAttribute("data-category");
        const subId = topEntry.target.getAttribute("data-subcategory");

        if (parentCatId && subId) {
          const sectionIdentifier = `${parentCatId}-${subId}`;

          if (currentActiveSectionRef.current !== sectionIdentifier) {
            currentActiveSectionRef.current = sectionIdentifier;

            setActiveCategoryTab(parentCatId);
            setActiveSubCategoryTab(subId === "__no_sub__" ? null : subId);

            const activeId =
              subId === "__no_sub__"
                ? `subtab-${parentCatId}__no_sub__`
                : `subtab-${subId}`;
            centerActiveTab(activeId);
          }
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-160px 0px -40% 0px",
      threshold: [0.1, 0.2, 0.4],
    });

    Object.values(sectionRefs.current).forEach((s) => {
      if (s) observer.observe(s);
    });

    return () => observer.disconnect();
  }, [menu, searchQuery, viewMode, isRtl, activeSubCategoryTab]);

  // ── Navigation actions ────────────────────────────────────────────
  const scrollToSubCategory = (subUniqueId: string) => {
    if (manualClickTimeoutRef.current)
      clearTimeout(manualClickTimeoutRef.current);

    isManualClick.current = true;

    if (subUniqueId === "all") {
      setActiveSubCategoryTab("all");
      lastActiveIdRef.current = "subtab-all";
      currentActiveSectionRef.current = "";
      if (subCategoryMenuRef.current) {
        subCategoryMenuRef.current.scrollTo({
          left: isRtl ? subCategoryMenuRef.current.scrollWidth : 0,
          behavior: "smooth",
        });
      }

      manualClickTimeoutRef.current = setTimeout(() => {
        isManualClick.current = false;
      }, 1000);
      return;
    }

    const found = dynamicSubCategories.find((s) => s.id === subUniqueId);
    if (found) {
      setActiveCategoryTab(found.catId);
      setActiveSubCategoryTab(
        found.rawId === "__no_sub__" ? null : found.rawId,
      );

      const activeId = `subtab-${subUniqueId}`;
      centerActiveTab(activeId);

      const combinedKey = getSectionKey(found.catId, found.rawId);
      currentActiveSectionRef.current = `${found.catId}-${found.rawId}`;

      setTimeout(() => {
        const el = sectionRefs.current[combinedKey];
        if (el) {
          const headerHeight = stickyHeaderRef.current?.offsetHeight || 130;
          const top =
            el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

          window.scrollTo({ top, behavior: "smooth" });
        }

        manualClickTimeoutRef.current = setTimeout(() => {
          isManualClick.current = false;
        }, 1000);
      }, 50);
    }
  };

  useEffect(() => {
    return () => {
      if (manualClickTimeoutRef.current)
        clearTimeout(manualClickTimeoutRef.current);
    };
  }, []);

  // ── Item modal helpers ────────────────────────────────────────────
  // The "recommended foods" (upsell) endpoint returns a lighter summary
  // object per food (no variations/addons, and price fields computed
  // differently than the main menu). To show full item data (variations,
  // addons, description) in the upselling dialog, we look the food up in
  // the already-loaded `menu` (which has the full MenuItem shape) and
  // prefer that over the summary object from the recommended endpoint.
  // Falls back to the summary object if it isn't found there.
  const findFoodInMenu = (foodId: string): MenuItem | undefined => {
    if (!Array.isArray(menu)) return undefined;
    for (const cat of menu) {
      const match = (cat.foods || []).find((f: any) => f.id === foodId);
      if (match) return match as MenuItem;
    }
    return undefined;
  };

  const handleItemClick = (item: MenuItem) => {
    if ((item as any).isOutOfStock) {
      toast.error(
        isRtl ? "هذا المنتج غير متوفر حاليًا" : "This item is out of stock",
      );
      return;
    }
    setSelectedItem(item);
    setQuantity(1);
    setSelectedAddons([]);
    setNote("");
    const init: Record<string, string[]> = {};
    (item.variations || []).forEach((v) => {
      init[v.id] =
        v.selectionType === "single" && v.isRequired && v.options.length > 0
          ? [v.options[0].id]
          : [];
    });
    setSelectedOptions(init);
  };

  // ── Scroll to a product (used by the promo popup) ─────────────────
  const scrollToProduct = (foodId: string) => {
    const entry = dynamicItems.find((i) => i.id === foodId);
    const sub = entry
      ? dynamicSubCategories.find(
          (s) =>
            s.catId === entry.categoryId && s.rawId === entry.subCategoryId,
        )
      : undefined;
    if (!entry || !sub) {
      toast.error(isRtl ? "هذا المنتج غير متاح" : "Product not available");
      return;
    }

    setSearchQuery("");
    if (manualClickTimeoutRef.current)
      clearTimeout(manualClickTimeoutRef.current);
    isManualClick.current = true;

    // Leave the "all" grid so the product sections are rendered.
    setActiveCategoryTab(sub.catId);
    setActiveSubCategoryTab(sub.rawId === "__no_sub__" ? null : sub.rawId);
    centerActiveTab(`subtab-${sub.id}`);
    currentActiveSectionRef.current = `${sub.catId}-${sub.rawId}`;

    setTimeout(() => {
      const el = document.getElementById(`food-${foodId}`);
      if (el) {
        const headerHeight = stickyHeaderRef.current?.offsetHeight || 130;
        const top =
          el.getBoundingClientRect().top + window.scrollY - headerHeight - 24;
        window.scrollTo({ top, behavior: "smooth" });
      }
      setHighlightedFoodId(foodId);
      setTimeout(() => setHighlightedFoodId(null), 2000);

      manualClickTimeoutRef.current = setTimeout(() => {
        isManualClick.current = false;
      }, 1000);
    }, 150);
  };

  // React to a focus request from the parent (popup → subcategory/product)
  useEffect(() => {
    if (!focusTarget || handledFocusRef.current === focusTarget) return;
    // Wait until the menu has been loaded and grouped.
    if (dynamicSubCategories.length === 0) return;
    handledFocusRef.current = focusTarget;

    if (focusTarget.type === "product") {
      scrollToProduct(focusTarget.id);
    } else {
      setSearchQuery("");
      setTimeout(() => scrollToSubCategory(focusTarget.id), 100);
    }
  }, [focusTarget, dynamicSubCategories]);

  const handleOptionSelect = (
    variation: Variation,
    option: VariationOption,
  ) => {
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }
    setSelectedOptions((prev) => {
      const cur = prev[variation.id] || [];

      if (variation.selectionType === "single") {
        if (cur.includes(option.id)) {
          return { ...prev, [variation.id]: [] };
        }
        return { ...prev, [variation.id]: [option.id] };
      }

      if (cur.includes(option.id))
        return {
          ...prev,
          [variation.id]: cur.filter((id) => id !== option.id),
        };
      if (variation.max !== null && cur.length >= variation.max) return prev;
      return { ...prev, [variation.id]: [...cur, option.id] };
    });
  };

  const handleAddonToggle = (addonId: string) => {
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId],
    );
  };

  // ── Discount helpers ────────────────────────────────────────────
  // hasDiscount / getEffectivePrice / getDiscountBadge now live in
  // ./menuPricing so FoodCard and the modals below all price an item
  // identically without duplicating this logic.

  const calculateTotalPrice = () => {
    if (!selectedItem) return 0;
    let total = getEffectivePrice(selectedItem);

    Object.entries(selectedOptions).forEach(([vId, optIds]) => {
      const v = selectedItem.variations?.find((x: any) => x.id === vId);
      if (v)
        optIds.forEach((oId) => {
          const o = v.options.find((x: any) => x.id === oId);
          if (o) total += parseFloat(o.additionalPrice || "0");
        });
    });

    if (Array.isArray(selectedItem.addons)) {
      selectedItem.addons.forEach((addon: AddonItem) => {
        if (selectedAddons.includes(addon.id)) {
          total += parseFloat(addon.price || "0");
        }
      });
    }

    return total * quantity;
  };

  const handleToggleFavorite = async (e: React.MouseEvent, foodId: string) => {
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }
    e.stopPropagation();
    const wasFav = favoritesList.includes(foodId);
    setFavoritesList((p) =>
      wasFav ? p.filter((id) => id !== foodId) : [...p, foodId],
    );
    try {
      await toggleFav(
        { foodId },
        null,
        wasFav ? t("removed From Favorites") : t("added To Favorites"),
      );
      fetchFavorites();
    } catch {
      setFavoritesList((p) =>
        wasFav ? [...p, foodId] : p.filter((id) => id !== foodId),
      );
    }
  };

  // ── Recommended foods ──────────────────────────────────────────────
  // Build the default selection (quantity 1, required single-selection
  // variations pre-picked, no addons) for one recommended food — mirrors
  // handleItemClick's init logic but keyed per-food instead of global.
  const initRecommendedSelection = (food: any) => {
    const init: Record<string, string[]> = {};
    (food.variations || []).forEach((v: Variation) => {
      init[v.id] =
        v.selectionType === "single" && v.isRequired && v.options.length > 0
          ? [v.options[0].id]
          : [];
    });
    return {
      quantity: 1,
      selectedOptions: init,
      selectedAddons: [] as string[],
    };
  };

  const fetchRecommendedFoods = async (foodId: string) => {
    if (!foodId) return;
    try {
      const res = await api.get(`/api/user/recommended-foods/${foodId}`);
      const foods = res?.data?.data?.data;
      if (Array.isArray(foods) && foods.length > 0) {
        // The recommended endpoint returns a lightweight summary (no
        // variations/addons). Prefer the full item from the already
        // loaded menu so the upselling card can show everything and let
        // the user pick variations/addons inline.
        const fullFoods = foods.map((f: any) => findFoodInMenu(f.id) || f);
        setRecommendedFoods(fullFoods);
        setRecommendedSelections((prev) => {
          const next = { ...prev };
          fullFoods.forEach((f: any) => {
            next[f.id] = initRecommendedSelection(f);
          });
          return next;
        });
        setShowRecommendedModal(true);
      }
    } catch (e) {
      console.error("Error fetching recommended foods:", e);
    }
  };

  const handleRecommendedOptionSelect = (
    food: any,
    variation: Variation,
    option: VariationOption,
  ) => {
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }
    setRecommendedSelections((prev) => {
      const sel = prev[food.id] || initRecommendedSelection(food);
      const cur = sel.selectedOptions[variation.id] || [];
      let nextOptions: string[];

      if (variation.selectionType === "single") {
        nextOptions = cur.includes(option.id) ? [] : [option.id];
      } else if (cur.includes(option.id)) {
        nextOptions = cur.filter((id) => id !== option.id);
      } else if (variation.max !== null && cur.length >= variation.max) {
        nextOptions = cur;
      } else {
        nextOptions = [...cur, option.id];
      }

      return {
        ...prev,
        [food.id]: {
          ...sel,
          selectedOptions: {
            ...sel.selectedOptions,
            [variation.id]: nextOptions,
          },
        },
      };
    });
  };

  const handleRecommendedAddonToggle = (food: any, addonId: string) => {
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }
    setRecommendedSelections((prev) => {
      const sel = prev[food.id] || initRecommendedSelection(food);
      const nextAddons = sel.selectedAddons.includes(addonId)
        ? sel.selectedAddons.filter((id) => id !== addonId)
        : [...sel.selectedAddons, addonId];
      return { ...prev, [food.id]: { ...sel, selectedAddons: nextAddons } };
    });
  };

  const handleRecommendedQuantityChange = (foodId: string, delta: number) => {
    setRecommendedSelections((prev) => {
      const sel = prev[foodId];
      if (!sel) return prev;
      return {
        ...prev,
        [foodId]: { ...sel, quantity: Math.max(1, sel.quantity + delta) },
      };
    });
  };

  const calculateRecommendedItemPrice = (food: any) => {
    const sel = recommendedSelections[food.id];
    if (!sel) return getEffectivePrice(food);
    let total = getEffectivePrice(food);

    Object.entries(sel.selectedOptions).forEach(([vId, optIds]) => {
      const v = food.variations?.find((x: any) => x.id === vId);
      if (v)
        optIds.forEach((oId) => {
          const o = v.options.find((x: any) => x.id === oId);
          if (o) total += parseFloat(o.additionalPrice || "0");
        });
    });

    if (Array.isArray(food.addons)) {
      food.addons.forEach((addon: AddonItem) => {
        if (sel.selectedAddons.includes(addon.id)) {
          total += parseFloat(addon.price || "0");
        }
      });
    }

    return total * sel.quantity;
  };

  const handleAddRecommendedToCart = async (food: any) => {
    if (!token) {
      toast.error(t("loginFirst"));
      router.push("/auth/sign-in/?callbackSlug=" + restaurantSlug);
      return;
    }

    const sel =
      recommendedSelections[food.id] || initRecommendedSelection(food);

    const missingRequiredVariation = (food.variations || []).some(
      (variation: Variation) =>
        variation.isRequired &&
        (!sel.selectedOptions[variation.id] ||
          sel.selectedOptions[variation.id].length === 0),
    );
    if (missingRequiredVariation) {
      toast.error(
        isRtl
          ? "يرجى اختيار جميع الخيارات المطلوبة"
          : "Please select all required options",
      );
      return;
    }

    const variations = Object.entries(sel.selectedOptions).flatMap(
      ([vId, optIds]) =>
        optIds.map((oId) => ({ variationId: vId, optionId: oId })),
    );
    const addons = (food.addons || [])
      .filter((addon: AddonItem) => sel.selectedAddons.includes(addon.id))
      .map((addon: AddonItem) => ({
        addonId: addon.id,
        name: addon.name,
        price: addon.price,
      }));

    const payload = {
      foodId: food.id,
      quantity: sel.quantity,
      variations,
      addons,
      note: "",
    };

    try {
      setAddingRecommendedId(food.id);
      await api.post("/api/user/cart", payload);
      const newExpiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("cart-expiry", newExpiry.toString());

      toast.success(t("addedToCart"));
      onCartUpdated();

      // Reset this item's picks back to defaults but keep the upselling
      // dialog open so the user can keep browsing / add more items.
      setRecommendedSelections((prev) => ({
        ...prev,
        [food.id]: initRecommendedSelection(food),
      }));
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409) {
        // Same residual-cart conflict as the main add-to-cart flow. The
        // conflict dialog renders at a lower z-index than this modal, so
        // it needs the upselling dialog out of the way to be visible.
        setPendingCartPayload(payload);
        setShowConflictDialog(true);
        setShowRecommendedModal(false);
      } else if (status === 400) {
        const rawMsg: string = error?.response?.data?.error?.message || "";
        const errorMsg = isRtl
          ? rawMsg.toLowerCase().includes("unavailable")
            ? "هذا المنتج غير متوفر حاليًا في الفرع المحدد."
            : "حدث خطأ ما، حاول مرة أخرى"
          : rawMsg || "Something went wrong";
        toast.error(errorMsg);
      } else if (status === 401) {
        toast.error(t("loginFirst"));
      } else if (error?.response) {
        toast.error(
          isRtl ? "حدث خطأ ما، حاول مرة أخرى" : "Something went wrong",
        );
      } else {
        toast.error(
          isRtl
            ? "تحقق من الاتصال بالإنترنت"
            : "Check your internet connection",
        );
      }
    } finally {
      setAddingRecommendedId(null);
    }
  };

  // Execution function that makes the API call
  const executeAddToCart = async (
    fulfillmentData: { addressId?: string; branchId?: string } = {},
  ) => {
    if (!selectedItem) return;

    const variations = Object.entries(selectedOptions).flatMap(
      ([vId, optIds]) =>
        optIds.map((oId) => ({ variationId: vId, optionId: oId })),
    );

    const addons = (selectedItem.addons || [])
      .filter((addon: AddonItem) => selectedAddons.includes(addon.id))
      .map((addon: AddonItem) => ({
        addonId: addon.id,
        name: addon.name,
        price: addon.price,
      }));

    // addressId / branchId are sent inside the cart body itself.
    const payload = {
      foodId: selectedItem.id,
      quantity,
      variations,
      addons,
      note,
      ...fulfillmentData,
    };

    try {
      setLoading(true);
      await api.post("/api/user/cart", payload);
      const newExpiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("cart-expiry", newExpiry.toString());

      toast.success(t("addedToCart"));
      onCartUpdated();

      // Remember this address/branch choice so the fulfillment dialog
      // doesn't need to ask again next time it's still valid.
      if (fulfillmentData.addressId) {
        setStoredFulfillment("delivery", fulfillmentData.addressId);
      } else if (fulfillmentData.branchId) {
        setStoredFulfillment("takeaway", fulfillmentData.branchId);
      }

      const addedFoodId = selectedItem.id;
      setSelectedItem(null);
      setShowFulfillmentDialog(false);
      setFulfillmentMode(null);
      setSelectedFulfillmentId("");
      fetchRecommendedFoods(addedFoodId);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409) {
        setPendingCartPayload(payload);
        setShowConflictDialog(true);
      } else if (status === 400) {
        const rawMsg: string = error?.response?.data?.error?.message || "";
        const errorMsg = isRtl
          ? rawMsg.toLowerCase().includes("unavailable")
            ? "هذا المنتج غير متوفر حاليًا في الفرع المحدد."
            : "حدث خطأ ما، حاول مرة أخرى"
          : rawMsg || "Something went wrong";
        toast.error(errorMsg);
      } else if (status === 401) {
        toast.error(t("loginFirst"));
      } else if (error?.response) {
        toast.error(
          isRtl ? "حدث خطأ ما، حاول مرة أخرى" : "Something went wrong",
        );
      } else {
        toast.error(
          isRtl
            ? "تحقق من الاتصال بالإنترنت"
            : "Check your internet connection",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit handler attached to the button
  const handleAddToCartSubmit = async () => {
    if (!token) {
      toast.error(t("loginFirst"));
      router.push("/auth/sign-in/?callbackSlug=" + restaurantSlug);
      return;
    }
    if (!selectedItem) return;

    const missingRequiredVariation = selectedItem.variations?.some(
      (variation: Variation) =>
        variation.isRequired &&
        (!selectedOptions[variation.id] ||
          selectedOptions[variation.id].length === 0),
    );

    if (missingRequiredVariation) {
      toast.error(
        isRtl
          ? "يرجى اختيار جميع الخيارات المطلوبة"
          : "Please select all required options",
      );
      return;
    }

    if (
      selectedItem.unavailableBranches &&
      selectedItem.unavailableBranches.length > 0
    ) {
      // Try to reuse a previously chosen address/branch instead of
      // asking again — but only if it's still valid for THIS item
      // (i.e. still deliverable / still an active branch it's sold at).
      const stored = getStoredFulfillment();
      if (stored) {
        if (
          stored.mode === "delivery" &&
          deliverableAddresses.some((a: any) => a.id === stored.id)
        ) {
          await executeAddToCart({ addressId: stored.id });
          return;
        }
        if (
          stored.mode === "takeaway" &&
          availableBranches.some((b: any) => b.id === stored.id)
        ) {
          await executeAddToCart({ branchId: stored.id });
          return;
        }
        // Stored choice no longer applies to this item — drop it and
        // fall through to asking again.
        clearStoredFulfillment();
      }

      setShowFulfillmentDialog(true);
      return;
    }

    await executeAddToCart();
  };

  const handleClearCart = async () => {
    try {
      await deleteData("/api/user/cart");
      dispatch(clearCartLocal());
      localStorage.removeItem("cart-expiry");
    } catch (error) {
      toast.error(t("failedClearCart"));
      throw error;
    }
  };

  const handleClearCartAndAdd = async () => {
    if (!pendingCartPayload) return;

    try {
      setLoading(true);
      await handleClearCart();
      await api.post("/api/user/cart", pendingCartPayload);
      const newExpiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("cart-expiry", newExpiry.toString());

      toast.success(t("addedToCart"));
      onCartUpdated();
      setShowConflictDialog(false);
      setPendingCartPayload(null);

      // Same post-success cleanup as executeAddToCart: this conflict can be
      // reached while the fulfillment dialog is still open behind it (the
      // out-of-stock -> pick address/branch -> 409 residual-cart flow), so
      // it needs to be closed and the choice persisted here too — otherwise
      // it's left open and nothing gets saved to fulfillmentStorageKey.
      if (pendingCartPayload.addressId) {
        setStoredFulfillment("delivery", pendingCartPayload.addressId);
      } else if (pendingCartPayload.branchId) {
        setStoredFulfillment("takeaway", pendingCartPayload.branchId);
      }
      setShowFulfillmentDialog(false);
      setFulfillmentMode(null);
      setSelectedFulfillmentId("");

      const addedFoodId = selectedItem?.id || pendingCartPayload?.foodId;
      setSelectedItem(null);
      if (addedFoodId) fetchRecommendedFoods(addedFoodId);
    } catch {
      toast.error("حدث خطأ أثناء تحديث السلة");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared UI templates ───────────────────────────────────────────
  // ── Shared UI templates ───────────────────────────────────────────
  // FoodCard and SubCategoryCard now live in ./FoodCard and
  // ./SubCategoryCard as standalone, prop-driven components.

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      <div
        className={`px-4 py-6 mx-3 ${isRtl ? "text-right" : "text-left"}`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* ── Search Bar ── */}
        <div className="relative mb-6">
          <div
            className={`absolute inset-y-0 flex items-center pointer-events-none ${
              isRtl ? "right-3" : "left-3"
            }`}
          >
            <Search className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            className={`block w-full py-3 ${
              isRtl ? "pl-4 pr-10" : "pr-4 pl-10"
            } text-gray-900 transition-all bg-white border border-gray-200 outline-none dark:border-zinc-800 rounded-xl dark:bg-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400`}
            placeholder={t("Search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ── Fixed Sticky Navigation Header wrapper ──
            No backdrop-blur here on purpose: a blurred backdrop on a
            `sticky` element has to be recomposited by the browser on
            nearly every scroll frame, which is a common cause of choppy
            touch-scrolling on mid/low-end phones. A solid, high-opacity
            background gives a very similar look without that per-frame
            repaint cost. */}
        <div
          ref={stickyHeaderRef}
          className="sticky top-0 z-40 bg-gray-50/95 dark:bg-zinc-950/95 pb-2 pt-2"
          style={{ willChange: "transform" }}
        >
          {/* SubCategory Card Bar */}
          <div
            ref={subCategoryMenuRef}
            dir={isRtl ? "rtl" : "ltr"}
            className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth mb-2 touch-pan-x touch-pan-y overscroll-x-contain px-0.5 py-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <button
              id="subtab-all"
              onClick={() => scrollToSubCategory("all")}
              className="shrink-0 w-[112px] xs:w-[126px] sm:w-[142px] md:w-[156px] lg:w-[170px] group transition-transform duration-300 ease-out will-change-transform hover:-translate-y-2"
            >
              <div
                className={`flex flex-col overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border-2 shadow-sm group-hover:shadow-xl transition-all duration-300 p-2 ${
                  activeSubCategoryTab === "all"
                    ? "shadow-md scale-[1.03]"
                    : "border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
                }`}
                style={
                  activeSubCategoryTab === "all"
                    ? { borderColor: firstColor }
                    : { borderColor: "transparent" }
                }
              >
                <div className="relative flex items-center justify-center w-full aspect-square overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-800">
                  <LayoutGrid
                    size={30}
                    className="text-gray-400 dark:text-zinc-500 sm:w-8 sm:h-8"
                    style={
                      activeSubCategoryTab === "all"
                        ? { color: firstColor }
                        : undefined
                    }
                  />
                </div>
                <div className="flex items-center justify-center px-1 py-2.5 min-h-[2.75rem]">
                  <span
                    className={`text-[11px] sm:text-xs font-extrabold uppercase tracking-wide text-center leading-tight line-clamp-2 transition-colors ${
                      activeSubCategoryTab === "all"
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-zinc-400"
                    }`}
                  >
                    {isRtl ? "الكل" : "All"}
                  </span>
                </div>
              </div>
            </button>

            {dynamicSubCategories.map((sub) => {
              const isActive =
                activeSubCategoryTab !== "all" &&
                (sub.rawId === "__no_sub__"
                  ? activeCategoryTab === sub.catId &&
                    activeSubCategoryTab === null
                  : activeSubCategoryTab === sub.rawId);
              return (
                <button
                  id={`subtab-${sub.id}`}
                  key={`subtab-btn-${sub.id}`}
                  onClick={() => scrollToSubCategory(sub.id)}
                  className="shrink-0 w-[112px] xs:w-[126px] sm:w-[142px] md:w-[156px] lg:w-[170px] group transition-transform duration-300 ease-out will-change-transform hover:-translate-y-2"
                >
                  <div
                    className={`flex flex-col overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border-2 shadow-sm group-hover:shadow-xl transition-all duration-300 p-2 ${
                      isActive
                        ? "shadow-md scale-[1.03]"
                        : "border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
                    }`}
                    style={
                      isActive
                        ? { borderColor: firstColor }
                        : { borderColor: "transparent" }
                    }
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-50 dark:bg-zinc-800">
                      <img
                        src={sub.coverImage}
                        alt={isRtl ? sub.nameAr : sub.name}
                        className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                      {/* Flash / shine sweep on hover */}
                      <span
                        className="pointer-events-none absolute inset-0 -translate-x-[130%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[130%]"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex items-center justify-center px-1 py-2.5 min-h-[2.75rem]">
                      <span
                        className={`text-[11px] sm:text-xs font-extrabold uppercase tracking-wide text-center leading-tight line-clamp-2 transition-colors ${
                          isActive
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-zinc-400"
                        }`}
                        style={isActive ? { color: firstColor } : undefined}
                      >
                        {isRtl ? sub.nameAr : sub.name}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-12 mt-4">
          {searchQuery.trim() ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                  {isRtl ? "نتائج البحث" : "Search Results"}
                </h2>
                <span className="text-sm text-gray-400 dark:text-zinc-500">
                  ({searchResults.length}) {t("Item")}
                </span>
              </div>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {searchResults.map((item) => (
                    <FoodCard
                      key={`search-item-${item.id}`}
                      item={item}
                      isRtl={isRtl}
                      isFavorite={favoritesList.includes(item.id)}
                      isHighlighted={highlightedFoodId === item.id}
                      firstColor={firstColor}
                      textFirstColor={textFirstColor}
                      onSelect={handleItemClick}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-600">
                  <Search size={48} className="mb-2 opacity-20" />
                  <p>{t("noSearchResults")}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {activeSubCategoryTab === "all" ? (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 mb-6">
                    <LayoutGrid className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-xl font-black text-gray-800 dark:text-zinc-100">
                      {isRtl ? "الأقسام" : "Categories"}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                    {dynamicSubCategories.map((sub) => (
                      <SubCategoryCard
                        key={`grid-sub-${sub.id}`}
                        image={sub.coverImage}
                        name={isRtl ? sub.nameAr : sub.name}
                        count={sub.totalFoods}
                        isRtl={isRtl}
                        onClick={() => scrollToSubCategory(sub.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  {dynamicSubCategories.map((sub) => {
                    if (!sub.foods || sub.foods.length === 0) return null;

                    const uniqueKey = getSectionKey(sub.catId, sub.rawId);

                    return (
                      <div
                        key={`section-${uniqueKey}`}
                        id={uniqueKey}
                        data-category={sub.catId}
                        data-subcategory={sub.rawId}
                        ref={(el) => {
                          sectionRefs.current[uniqueKey] = el;
                        }}
                        className="scroll-mt-40 animate-in fade-in duration-300"
                      >
                        <div
                          className={`flex flex-col mb-4 border-b pb-2 dark:border-zinc-800 ${
                            isRtl ? "text-right" : "text-left"
                          }`}
                        >
                          <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                            {isRtl ? sub.nameAr : sub.name}
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          {sub.foods.map((item) => (
                            <FoodCard
                              key={`food-item-${item.id}`}
                              item={item}
                              isRtl={isRtl}
                              isFavorite={favoritesList.includes(item.id)}
                              isHighlighted={highlightedFoodId === item.id}
                              firstColor={firstColor}
                              textFirstColor={textFirstColor}
                              onSelect={handleItemClick}
                              onToggleFavorite={handleToggleFavorite}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── APP DOWNLOAD BUTTONS (UNDER ALL PRODUCTS) ── */}
          {(restaurant?.iosApp || restaurant?.androidApp) && (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-12 pt-8 border-t border-gray-200 dark:border-zinc-800">
              {restaurant?.iosApp && (
                <a
                  href={restaurant.iosApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 text-white bg-black rounded-2xl shadow-md hover:bg-zinc-800 transition-colors"
                >
                  <FaApple className="w-6 h-6" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] opacity-70">Download on</span>
                    <span className="text-sm font-bold">{t("appStore")}</span>
                  </div>
                </a>
              )}
              {restaurant?.androidApp && (
                <a
                  href={restaurant.androidApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-200 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FaGooglePlay className="w-5 h-5 text-green-500" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] text-gray-500">Get it on</span>
                    <span className="text-sm font-bold dark:text-zinc-300">
                      {t("googlePlay")}
                    </span>
                  </div>
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── FOOD ITEM MODAL ── */}
        {selectedItem && (
          <AddToCartDialog
            item={selectedItem}
            isRtl={isRtl}
            selectedOptions={selectedOptions}
            selectedAddons={selectedAddons}
            quantity={quantity}
            note={note}
            totalPrice={calculateTotalPrice()}
            loading={loading}
            addToCartLabel={t("addToCart")}
            onClose={() => setSelectedItem(null)}
            onSelectVariation={handleOptionSelect}
            onToggleAddon={handleAddonToggle}
            onQuantityChange={setQuantity}
            onNoteChange={setNote}
            onSubmit={handleAddToCartSubmit}
          />
        )}

        <CartConflictDialog
          isOpen={showConflictDialog}
          isRtl={isRtl}
          loading={loading}
          onConfirm={handleClearCartAndAdd}
          onCancel={() => {
            setShowConflictDialog(false);
            setPendingCartPayload(null);
          }}
        />

        <FulfillmentDialog
          isOpen={showFulfillmentDialog}
          isRtl={isRtl}
          loading={loading}
          mode={fulfillmentMode}
          selectedId={selectedFulfillmentId}
          addresses={allAddresses}
          branches={availableBranches}
          onModeChange={(mode) => {
            setFulfillmentMode(mode);
            setSelectedFulfillmentId("");
          }}
          onSelectionChange={setSelectedFulfillmentId}
          onAddAddress={() => setShowAddAddressPopup(true)}
          onConfirm={(mode, selectedId) => {
            const fulfillmentData =
              mode === "delivery"
                ? { addressId: selectedId }
                : { branchId: selectedId };
            executeAddToCart(fulfillmentData);
          }}
          onCancel={() => {
            setShowFulfillmentDialog(false);
            setFulfillmentMode(null);
            setSelectedFulfillmentId("");
          }}
        />

        {/* ── ADD ADDRESS POPUP (opened from the fulfillment dialog) ── */}
        {showAddAddressPopup && (
          <AddAddressPopup
            onClose={() => setShowAddAddressPopup(false)}
            onSuccess={(newAddressId) => {
              refetchCheckoutData();
              if (newAddressId) setSelectedFulfillmentId(newAddressId);
            }}
          />
        )}

        {/* ── RECOMMENDED FOODS POPUP ── */}
        {/* ── RECOMMENDED FOODS POPUP ── */}
        {showRecommendedModal && recommendedFoods.length > 0 && (
          <div className="fixed inset-0 z-[130] flex items-end justify-center p-0 sm:items-center sm:p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
              className="w-full sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
              style={{ ["--brand-color" as any]: firstColor }}
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  {isRtl ? "قد يعجبك أيضاً" : "You might also like"}
                </h3>
                <button
                  onClick={() => setShowRecommendedModal(false)}
                  className="p-2 text-zinc-400 transition-colors bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.300)_transparent] dark:[scrollbar-color:theme(colors.zinc.700)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {recommendedFoods.map((food) => {
                  const price = parseFloat(food.price || "0");
                  const hasDisc = hasDiscount(food);
                  const finalPrice = hasDisc
                    ? food.discountType === "percentage"
                      ? price - (price * parseFloat(food.discountValue)) / 100
                      : price - parseFloat(food.discountValue)
                    : price;

                  const sel =
                    recommendedSelections[food.id] ||
                    initRecommendedSelection(food);
                  const isAdding = addingRecommendedId === food.id;

                  return (
                    <div
                      key={food.id}
                      className={`bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden ${
                        food.isOutOfStock ? "opacity-60" : ""
                      }`}
                    >
                      {/* ── Header: image + name + price ── */}
                      <div className="flex items-center p-3 gap-3">
                        <div className="relative flex-shrink-0 w-16 h-16 overflow-hidden rounded-xl bg-white dark:bg-zinc-800">
                          <img
                            src={food.image}
                            alt={food.name}
                            className={`object-cover w-full h-full ${
                              food.isOutOfStock ? "grayscale opacity-60" : ""
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {isRtl ? food.nameAr || food.name : food.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-sm font-bold"
                              style={{ color: firstColor }}
                            >
                              {finalPrice.toFixed(2)} E£
                            </span>
                            {hasDisc && (
                              <span className="text-xs line-through text-zinc-400">
                                {price.toFixed(2)} E£
                              </span>
                            )}
                          </div>
                          {food.isOutOfStock && (
                            <span className="text-[10px] font-black text-red-500">
                              {isRtl ? "نفذت الكمية" : "Out of Stock"}
                            </span>
                          )}
                        </div>
                      </div>

                      {!food.isOutOfStock && (
                        <div className="px-3 pb-3 space-y-3">
                          {food.description && (
                            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                              {isRtl
                                ? food.descriptionAr || food.description
                                : food.description}
                            </p>
                          )}

                          {/* ── Variations ── */}
                          {Array.isArray(food.variations) &&
                            food.variations.length > 0 && (
                              <FoodVariationOptions
                                variations={food.variations}
                                selectedOptions={sel.selectedOptions}
                                isRtl={isRtl}
                                compact
                                groupId={food.id}
                                onSelect={(variation, option) =>
                                  handleRecommendedOptionSelect(
                                    food,
                                    variation,
                                    option,
                                  )
                                }
                              />
                            )}

                          {/* ── Addons ── */}
                          {Array.isArray(food.addons) &&
                            food.addons.length > 0 && (
                              <FoodAddonOptions
                                addons={food.addons}
                                selectedAddons={sel.selectedAddons}
                                isRtl={isRtl}
                                compact
                                onToggle={(addonId) =>
                                  handleRecommendedAddonToggle(food, addonId)
                                }
                              />
                            )}

                          {/* ── Quantity + Add to cart ── */}
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                              <button
                                onClick={() =>
                                  handleRecommendedQuantityChange(food.id, -1)
                                }
                                className="flex items-center justify-center w-7 h-7 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-all active:scale-90"
                              >
                                <Minus size={14} strokeWidth={2.5} />
                              </button>
                              <span className="w-5 text-sm font-black text-center text-zinc-800 dark:text-zinc-100 tabular-nums">
                                {sel.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleRecommendedQuantityChange(food.id, 1)
                                }
                                className="flex items-center justify-center w-7 h-7 text-zinc-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-all active:scale-90"
                              >
                                <Plus size={14} strokeWidth={2.5} />
                              </button>
                            </div>
                            <button
                              onClick={() => handleAddRecommendedToCart(food)}
                              disabled={isAdding}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                              style={{
                                backgroundColor: firstColor,
                                color: textFirstColor,
                              }}
                            >
                              {isAdding ? (
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Plus size={14} strokeWidth={2.5} />
                                  {(() => {
                                    const label = t("addToCart");
                                    const totalPrice =
                                      calculateRecommendedItemPrice(
                                        food,
                                      ).toFixed(2);
                                    return `${label} · ${totalPrice} E£`;
                                  })()}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setShowRecommendedModal(false)}
                  className="w-full py-3 font-bold transition-colors text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  {isRtl ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
