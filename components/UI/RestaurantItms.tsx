"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  X,
  Minus,
  Heart,
  LayoutGrid,
  AlertTriangle,
} from "lucide-react";
import usePost from "@/app/hooks/usePost";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearCartLocal } from "@/redux/cartSlice";
import {
  MenuItem,
  Variation,
  VariationOption,
  MenuCategory,
} from "@/context/RestaurantContext";
import api from "@/api/api";
import useDelete from "@/app/hooks/useDelete";

interface AddonItem {
  id: string;
  name: string;
  nameAr: string;
  price: string;
  status: string;
  category?: {
    id: string;
    name: string;
    nameAr: string;
  };
}

interface DerivedSubCategory {
  id: string; // subcategory id OR "__no_sub__"
  name: string;
  nameAr: string;
  orderLevel: number;
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
}: {
  menu: MenuCategory[] | null;
  restaurantId: string;
  onCartUpdated: () => void;
}) {
  const { language, t } = useLanguage();
  const isRtl = language === "العربية";
  const router = useRouter();
  const { postData: toggleFav } = usePost("/api/user/favlist/toggle");
  const dispatch = useAppDispatch();

  // ── Auth ──────────────────────────────────────────────────────────
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") setToken(localStorage.getItem("token"));
  }, []);

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
  const [viewMode, setViewMode] = useState<ViewMode>("menu");
  const [activeCategoryTab, setActiveCategoryTab] = useState("");
  const [activeSubCategoryTab, setActiveSubCategoryTab] = useState<
    string | null
  >("all");

  // ── Scroll-spy state ──────────────────────────────────────────────
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const subCategoryMenuRef = useRef<HTMLDivElement | null>(null);
  const isManualClick = useRef(false);

  // ── Search ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const { deleteData } = useDelete("/users");
  // ── Item modal & Cart conflict states ─────────────────────────────
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // States to handle cart replacement dialog box flow
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingCartPayload, setPendingCartPayload] = useState<any | null>(
    null,
  );

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
        coverImage: subCategories[0]?.foods[0]?.image || "/placeholder.jpg",
      };
    });
  }, [menu]);

  // Flat SubCategories pill bar — sorted by orderLevel ascending
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
          coverImage: sub.foods[0]?.image || "/placeholder.jpg",
          foods: sub.foods,
        });
      });
    });
    return subs.sort((a, b) => a.orderLevel - b.orderLevel);
  }, [derivedMenu]);

  // Initialize active tab to "all" when menu loads
  useEffect(() => {
    if (dynamicSubCategories.length > 0 && !activeCategoryTab) {
      const first = dynamicSubCategories[0];
      setActiveCategoryTab(first.catId);
      setActiveSubCategoryTab("all");
    }
  }, [dynamicSubCategories]);

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

  // Search filter loop
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return dynamicItems.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.nameAr.toLowerCase().includes(q),
    );
  }, [dynamicItems, searchQuery]);

  const getSectionKey = (catId: string, subId: string) => `${catId}||${subId}`;

  // ── Dual Layer Scroll-spy System ──────────────────────────────────
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

      const visible = entries.find((e) => e.isIntersecting);
      if (visible) {
        const parentCatId = visible.target.getAttribute("data-category");
        const subId = visible.target.getAttribute("data-subcategory");

        if (parentCatId && subId) {
          setActiveCategoryTab(parentCatId);
          setActiveSubCategoryTab(subId === "__no_sub__" ? null : subId);

          const activeId =
            subId === "__no_sub__"
              ? `subtab-${parentCatId}__no_sub__`
              : `subtab-${subId}`;
          const subTab = document.getElementById(activeId);
          if (subTab && subCategoryMenuRef.current) {
            const container = subCategoryMenuRef.current;
            const scrollPos =
              subTab.offsetLeft -
              container.offsetWidth / 2 +
              subTab.offsetWidth / 2;
            container.scrollTo({
              left: isRtl
                ? container.scrollWidth - container.clientWidth - scrollPos
                : scrollPos,
              behavior: "smooth",
            });
          }
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-120px 0px -65% 0px",
      threshold: 0,
    });

    Object.values(sectionRefs.current).forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, [menu, searchQuery, viewMode, isRtl, activeSubCategoryTab]);

  // ── Navigation actions ────────────────────────────────────────────
  const scrollToSubCategory = (subUniqueId: string) => {
    if (subUniqueId === "all") {
      isManualClick.current = true;
      setActiveSubCategoryTab("all");

      const subTabAll = document.getElementById("subtab-all");
      if (subTabAll && subCategoryMenuRef.current) {
        subCategoryMenuRef.current.scrollTo({
          left: isRtl ? subCategoryMenuRef.current.scrollWidth : 0,
          behavior: "smooth",
        });
      }

      setTimeout(() => {
        isManualClick.current = false;
      }, 400);
      return;
    }

    const found = dynamicSubCategories.find((s) => s.id === subUniqueId);
    if (found) {
      setActiveCategoryTab(found.catId);
      setActiveSubCategoryTab(
        found.rawId === "__no_sub__" ? null : found.rawId,
      );

      const combinedKey = getSectionKey(found.catId, found.rawId);
      performSmoothScroll(combinedKey);
    }
  };

  const performSmoothScroll = (sectionKey: string) => {
    isManualClick.current = true;
    setTimeout(() => {
      const el = sectionRefs.current[sectionKey];
      if (el) {
        const headerHeight = stickyHeaderRef.current?.offsetHeight || 130;
        const top =
          el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

        window.scrollTo({ top, behavior: "smooth" });
        setTimeout(() => {
          isManualClick.current = false;
        }, 700);
      }
    }, 60);
  };

  // ── Item modal helpers ────────────────────────────────────────────
  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setSelectedAddons([]);
    const init: Record<string, string[]> = {};
    (item.variations || []).forEach((v) => {
      init[v.id] =
        v.selectionType === "single" && v.isRequired && v.options.length > 0
          ? [v.options[0].id]
          : [];
    });
    setSelectedOptions(init);
  };

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
      if (variation.selectionType === "single")
        return { ...prev, [variation.id]: [option.id] };
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

  const calculateTotalPrice = () => {
    if (!selectedItem) return 0;
    let total = parseFloat(selectedItem.price || "0");

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

  const handleAddToCartSubmit = async () => {
    if (!token) {
      toast.error(t("loginFirst"));
      router.push("/auth/sign-in");
      return;
    }
    if (!selectedItem) return;

    const variations = Object.entries(selectedOptions).flatMap(
      ([vId, optIds]) =>
        optIds.map((oId) => ({ variationId: vId, optionId: oId })),
    );

    const payload = {
      foodId: selectedItem.id,
      quantity,
      variations,
      addons: selectedAddons,
    };

    try {
      setLoading(true);
      await api.post("/api/user/cart", payload);
      toast.success(t("addedToCart"));
      onCartUpdated();
      setSelectedItem(null);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409) {
        // Intercept 409 and store selected parameters to launch confirmation modal
        setPendingCartPayload(payload);
        setShowConflictDialog(true);
      } else if (status === 400) {
        toast.error("بيانات غير صحيحة");
      } else if (status === 401) {
        toast.error(t("loginFirst"));
      } else if (error?.response) {
        toast.error("حدث خطأ ما، حاول مرة أخرى");
      } else {
        toast.error("تحقق من الاتصال بالإنترنت");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleClearCart = async () => {
    try {
      await deleteData("/api/user/cart");
      dispatch(clearCartLocal());
    } catch (error) {
      toast.error(t("failedClearCart"));
    }
  };
  // Clears the cart database entirely, then adds the new selection item immediately
  const handleClearCartAndAdd = async () => {
    if (!pendingCartPayload) return;
    try {
      setLoading(true);
      // 1. Send clear cart command to endpoint
      handleClearCart();

      // 2. Post the newly selected product criteria
      handleAddToCartSubmit();

      onCartUpdated();

      // Complete modal routines & reset views
      setShowConflictDialog(false);
      setPendingCartPayload(null);
      setSelectedItem(null);
    } catch (err) {
      toast.error("حدث خطأ أثناء تحديث السلة");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared UI templates ───────────────────────────────────────────
  const FoodCard = ({ item }: { item: MenuItem }) => {
    const isFav = favoritesList.includes(item.id);
    return (
      <div
        onClick={() => handleItemClick(item)}
        className="relative flex items-center p-3 transition-all bg-white border border-gray-100 shadow-sm cursor-pointer dark:bg-zinc-900 rounded-2xl dark:border-zinc-800 hover:shadow-md group"
      >
        <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden rounded-xl">
          <img
            src={item.image}
            alt={item.name}
            className="object-cover w-full h-full transition-transform group-hover:scale-110"
          />
        </div>
        <div className="flex flex-col justify-between flex-1 h-full mr-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="ml-6 font-bold text-gray-900 dark:text-zinc-100 line-clamp-1">
                {isRtl ? item.nameAr : item.name}
              </h3>
              <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500 line-clamp-2">
                {isRtl ? item.descriptionAr : item.description}
              </p>
            </div>
            <button
              onClick={(e) => handleToggleFavorite(e, item.id)}
              className="absolute top-3 left-3 p-1.5 transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full z-10"
            >
              <Heart
                size={18}
                className={`transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-gray-400 dark:text-zinc-500"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="font-bold text-yellow-500">{item.price} E£</span>
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item);
              }}
              className="p-2 text-white transition-colors bg-gray-900 dark:bg-yellow-400 dark:text-zinc-900 rounded-xl"
            >
              <Plus size={18} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SubCategoryCard = ({
    image,
    name,
    count,
    onClick,
  }: {
    image: string;
    name: string;
    count: number;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className="relative p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-center group overflow-hidden cursor-pointer hover:-translate-y-1 duration-300"
    >
      <div className="absolute top-0 right-0 w-12 h-12 rounded-bl-[2rem] bg-yellow-400/5 group-hover:bg-yellow-400 transition-colors duration-500" />
      <div className="relative z-10 flex items-center justify-center w-16 h-16 mx-auto mb-4 overflow-hidden rounded-2xl bg-gray-50 dark:bg-zinc-800">
        <img
          src={image}
          alt={name}
          className="object-cover w-full h-full transition-transform group-hover:scale-110"
        />
      </div>
      <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-yellow-500 transition-colors line-clamp-2">
        {name}
      </h3>
      <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 block">
        {count} {isRtl ? "منتج" : "Items"}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      <div className="px-4 py-6 mx-3 text-right" dir="rtl">
        {/* ── Search Bar ── */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 flex items-center pointer-events-none right-3">
            <Search className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full py-3 pl-4 pr-10 text-gray-900 transition-all bg-white border border-gray-200 outline-none dark:border-zinc-800 rounded-xl dark:bg-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400"
            placeholder={t("Search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ── Fixed Sticky Navigation Header wrapper ── */}
        <div
          ref={stickyHeaderRef}
          className="sticky top-0 z-40 bg-gray-50/80 dark:bg-zinc-950/80 backdrop-blur-md pb-2 pt-2"
        >
          {/* SubCategory Pill Bar */}
          <div
            ref={subCategoryMenuRef}
            dir={isRtl ? "rtl" : "ltr"}
            className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth mb-2"
          >
            <button
              id="subtab-all"
              onClick={() => scrollToSubCategory("all")}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-all duration-300 shrink-0 ${
                activeSubCategoryTab === "all"
                  ? "bg-yellow-400 text-white shadow-md transform scale-105"
                  : "bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
              }`}
            >
              {isRtl ? "الكل" : "All"}
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
                  className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-all duration-300 shrink-0 ${
                    isActive
                      ? "bg-yellow-400 text-white shadow-md transform scale-105"
                      : "bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  {isRtl ? sub.nameAr : sub.name}
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
                  نتائج البحث
                </h2>
                <span className="text-sm text-gray-400 dark:text-zinc-500">
                  ({searchResults.length}) {t("Item")}
                </span>
              </div>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {searchResults.map((item) => (
                    <FoodCard key={`search-item-${item.id}`} item={item} />
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
        </div>

        {/* ── FOOD ITEM MODAL ── */}
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/70 backdrop-blur-md transition-all duration-500 animate-in fade-in">
            <div className="relative w-full max-w-xl overflow-hidden bg-white dark:bg-zinc-900 border-t sm:border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-500 ease-out overscroll-behavior-contain">
              <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="pointer-events-auto p-2.5 rounded-full shadow-lg bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700 backdrop-blur-md text-zinc-800 dark:text-zinc-100 transition-all active:scale-90 hover:scale-105"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <div className="relative w-full h-56 sm:h-72 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  loading="eager"
                  decoding="async"
                  className="object-contain w-full h-full transform transition-transform duration-[1000ms] ease-out hover:scale-105 will-change-transform"
                  style={{
                    imageRendering: "-webkit-optimize-contrast",
                    transform: "translate3d(0,0,0)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900 via-zinc-950/10 to-black/20 pointer-events-none" />
              </div>

              <div
                className="flex-1 px-6 pb-8 overflow-y-auto space-y-6 scroll-smooth overscroll-contain"
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)",
                }}
              >
                <style
                  dangerouslySetInnerHTML={{
                    __html: `div::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }`,
                  }}
                />

                <div className="pt-4 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                      {isRtl ? selectedItem.nameAr : selectedItem.name}
                    </h2>
                    <div className="text-left shrink-0 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/40">
                      <span className="text-2xl font-black text-yellow-500">
                        {selectedItem.price}
                      </span>
                      <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mr-1">
                        E£
                      </span>
                    </div>
                  </div>
                  {selectedItem.description && (
                    <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50/40 dark:bg-zinc-800/10 p-3.5 rounded-2xl border border-zinc-100/50 dark:border-zinc-800/20">
                      {isRtl
                        ? selectedItem.descriptionAr
                        : selectedItem.description}
                    </p>
                  )}
                </div>

                {/* ── VARIATIONS SELECTION ── */}
                {Array.isArray(selectedItem.variations) &&
                  selectedItem.variations.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
                      {selectedItem.variations.map((variation: Variation) => (
                        <div
                          key={`variation-${variation.id}`}
                          className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                                {isRtl ? variation.nameAr : variation.name}
                              </h4>
                              {variation.isRequired && (
                                <span className="px-2 py-0.5 text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100/40 dark:border-red-900/30">
                                  مطلوب
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/10">
                              {variation.selectionType === "single"
                                ? "اختر واحد"
                                : variation.max
                                  ? `حد أقصى ${variation.max}`
                                  : "اختياري"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-2.5">
                            {Array.isArray(variation.options) &&
                              variation.options.map((option) => {
                                const isSelected = (
                                  selectedOptions[variation.id] || []
                                ).includes(option.id);
                                return (
                                  <label
                                    key={`option-${option.id}`}
                                    className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-300 ease-out select-none active:scale-[0.99] group
                                  ${
                                    isSelected
                                      ? "border-yellow-400 bg-yellow-50/20 dark:bg-yellow-400/5 shadow-md shadow-yellow-400/5 ring-1 ring-yellow-400"
                                      : "border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                                  }`}
                                  >
                                    <div className="flex items-center gap-3.5">
                                      <input
                                        type={
                                          variation.selectionType === "single"
                                            ? "radio"
                                            : "checkbox"
                                        }
                                        name={variation.name}
                                        checked={isSelected}
                                        onChange={() =>
                                          handleOptionSelect(variation, option)
                                        }
                                        className="w-5 h-5 accent-yellow-400 rounded-full border-zinc-300 dark:border-zinc-700 transition-transform duration-200 group-hover:scale-105"
                                      />
                                      <span
                                        className={`text-sm transition-all duration-200 ${isSelected ? "font-black text-zinc-950 dark:text-zinc-50" : "font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"}`}
                                      >
                                        {isRtl ? option.nameAr : option.name}
                                      </span>
                                    </div>
                                    {parseFloat(option.additionalPrice) > 0 && (
                                      <span
                                        className={`text-xs font-black px-2.5 py-1 rounded-xl transition-all duration-300 ${isSelected ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100/40 dark:bg-yellow-400/10 scale-105" : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-850"}`}
                                      >
                                        + {option.additionalPrice} E£
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {/* ── ADDONS SELECTION (الإضافات) ── */}
                {Array.isArray(selectedItem.addons) &&
                  selectedItem.addons.length > 0 && (
                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                          {isRtl ? "الإضافات" : "Add-ons"}
                        </h4>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          {isRtl ? "اختياري" : "Optional"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        {selectedItem.addons.map((addon: AddonItem) => {
                          const isAddonSelected = selectedAddons.includes(
                            addon.id,
                          );
                          return (
                            <label
                              key={`addon-option-${addon.id}`}
                              className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-300 ease-out select-none active:scale-[0.99] group
                              ${
                                isAddonSelected
                                  ? "border-yellow-400 bg-yellow-50/20 dark:bg-yellow-400/5 shadow-md shadow-yellow-400/5 ring-1 ring-yellow-400"
                                  : "border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                              }`}
                            >
                              <div className="flex items-center gap-3.5">
                                <input
                                  type="checkbox"
                                  checked={isAddonSelected}
                                  onChange={() => handleAddonToggle(addon.id)}
                                  className="w-5 h-5 accent-yellow-400 rounded-lg border-zinc-300 dark:border-zinc-700 transition-transform duration-200 group-hover:scale-105"
                                />
                                <span
                                  className={`text-sm transition-all duration-200 ${isAddonSelected ? "font-black text-zinc-950 dark:text-zinc-50" : "font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"}`}
                                >
                                  {isRtl ? addon.nameAr : addon.name}
                                </span>
                              </div>
                              {parseFloat(addon.price) > 0 && (
                                <span
                                  className={`text-xs font-black px-2.5 py-1 rounded-xl transition-all duration-300 ${isAddonSelected ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100/40 dark:bg-yellow-400/10 scale-105" : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-850"}`}
                                >
                                  + {addon.price} E£
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>

              <div className="p-6 bg-white border-t border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 shadow-[0_-12px_30px_rgba(0,0,0,0.03)] shrink-0 space-y-4 z-10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                      الإجمالي النهائي
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight transition-all duration-300 transform">
                        {calculateTotalPrice().toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-yellow-500 ml-1">
                        E£
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/10 rounded-2xl shadow-inner">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex items-center justify-center w-9 h-9 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-700 hover:bg-zinc-50 rounded-xl transition-all shadow-sm active:scale-90"
                    >
                      <Minus size={16} strokeWidth={2.5} />
                    </button>
                    <span className="w-6 text-base font-black text-center text-zinc-800 dark:text-zinc-100 tabular-nums animate-in fade-in zoom-in-75 duration-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex items-center justify-center w-9 h-9 text-zinc-900 dark:text-zinc-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-all shadow-md active:scale-90"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <button
                  disabled={loading}
                  onClick={handleAddToCartSubmit}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:hover:bg-yellow-400 text-zinc-950 disabled:text-zinc-400 font-black text-base py-4 rounded-2xl shadow-xl shadow-yellow-400/10 hover:shadow-yellow-400/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    t("addToCart")
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 409 CONFLICT RESIDUAL CART REPLACEMENT DIALOG ── */}
        {showConflictDialog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900/30">
                <AlertTriangle size={28} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {isRtl
                    ? "هل أنت متأكد من رغبتك في إضافة هذا المنتج إلى السلة؟"
                    : "Are you sure you want to add this item to the cart ?"}
                </h3>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClearCartAndAdd}
                  disabled={loading}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-black py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : isRtl ? (
                    "نعم، متأكد"
                  ) : (
                    "Yes, Sure"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowConflictDialog(false);
                    setPendingCartPayload(null);
                  }}
                  disabled={loading}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 font-bold py-3 rounded-xl transition-all active:scale-[0.98] border border-zinc-200/40 dark:border-zinc-700/30"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
