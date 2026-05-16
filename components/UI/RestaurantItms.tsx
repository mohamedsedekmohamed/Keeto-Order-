"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Plus, X, Minus, LayoutGrid, Heart } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import usePost from "@/app/hooks/usePost";
import { useLanguage } from "../../context/LanguageContext";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

import {
  MenuItem,
  Variation,
  VariationOption,
} from "@/context/RestaurantContext";
import api from "@/api/api";
import useGet from "@/app/hooks/useGet";
import { navigate } from "next/dist/client/components/segment-cache/navigation";
import { redirect } from "react-router-dom";

export default function RestaurantItms({
  menu,
  restaurantId,
  onCartUpdated,
}: {
  menu: Record<string, MenuItem[]> | null;
  restaurantId: string;
  onCartUpdated: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  // 1. Add a view state
  // Change initial state
  const [viewMode, setViewMode] = useState<"all" | "menu">("all"); // ← was "menu"
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const token = localStorage.getItem("token");
  const router = useRouter();
  // Create refs for sections and the category container for auto-scrolling the menu bar tabs
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const isManualClick = useRef(false);
  const { postData: toggleFav } = usePost("/api/user/favlist/toggle");
  const [favoritesList, setFavoritesList] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    fetchFavorites();
  }, [token]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "https://keetobcknd.keeto.org/api/user/favlist",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const foods = res?.data.data?.data?.foods || [];
      const ids = foods.map((item: any) => item.id);
      setFavoritesList(ids);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const { dynamicCategories, dynamicItems } = useMemo(() => {
    const cats = [{ id: "all", name: t("All") }];
    const itms: (MenuItem & { categoryId: string })[] = [];

    if (menu) {
      Object.keys(menu).forEach((categoryName) => {
        cats.push({ id: categoryName, name: categoryName });
        menu[categoryName].forEach((item) => {
          itms.push({ ...item, categoryId: categoryName });
        });
      });
    }
    return { dynamicCategories: cats, dynamicItems: itms };
  }, [menu, t]);

  // ScrollSpy logic using IntersectionObserver
  useEffect(() => {
    if (searchQuery || viewMode === "all") return;

    // ✅ Small delay to ensure sections are in DOM after viewMode switches to "menu"
    const timer = setTimeout(() => {
      const handleIntersect = (entries: IntersectionObserverEntry[]) => {
        if (isManualClick.current) return;

        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveCategory(visibleEntry.target.id);

          const activeTab = document.getElementById(
            `tab-${visibleEntry.target.id}`,
          );
          if (activeTab && categoryMenuRef.current) {
            categoryMenuRef.current.scrollTo({
              left:
                activeTab.offsetLeft -
                categoryMenuRef.current.offsetWidth / 2 +
                activeTab.offsetWidth / 2,
              behavior: "smooth",
            });
          }
        }
      };

      const observerOptions = {
        root: null,
        rootMargin: "-120px 0px -70% 0px",
        threshold: 0,
      };

      const observer = new IntersectionObserver(
        handleIntersect,
        observerOptions,
      );

      Object.values(sectionRefs.current).forEach((section) => {
        if (section) observer.observe(section);
      });

      return () => observer.disconnect();
    }, 100); // ✅ Wait for DOM to render sections

    return () => clearTimeout(timer);
  }, [menu, searchQuery, viewMode]);
  // Click handling for ScrollSpy navigation
  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);

    if (catId === "all") {
      setViewMode("all");

      return;
    }

    setViewMode("menu");

    // ✅ Wait for viewMode="menu" to render sections, THEN scroll AND re-check ref
    setTimeout(() => {
      const element = sectionRefs.current[catId];
      if (element) {
        isManualClick.current = true;
        const offset = 140;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const offsetPosition = elementRect - bodyRect - offset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        setTimeout(() => {
          isManualClick.current = false;
        }, 800);
      }
    }, 120); // ✅ slightly more than the observer timer (100ms) to ensure observer is attached first
  };
  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);

    const initialOptions: Record<string, string[]> = {};
    item.variations?.forEach((variation) => {
      if (
        variation.selectionType === "single" &&
        variation.isRequired &&
        variation.options.length > 0
      ) {
        initialOptions[variation.id] = [variation.options[0].id];
      } else {
        initialOptions[variation.id] = [];
      }
    });
    setSelectedOptions(initialOptions);
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
      const currentSelections = prev[variation.id] || [];
      if (variation.selectionType === "single") {
        return { ...prev, [variation.id]: [option.id] };
      } else {
        const isCurrentlySelected = currentSelections.includes(option.id);
        let newSelections = [];
        if (isCurrentlySelected) {
          newSelections = currentSelections.filter((id) => id !== option.id);
        } else {
          if (
            variation.max === null ||
            currentSelections.length < variation.max
          ) {
            newSelections = [...currentSelections, option.id];
          } else {
            newSelections = currentSelections;
          }
        }
        return { ...prev, [variation.id]: newSelections };
      }
    });
  };

  const calculateTotalPrice = () => {
    if (!selectedItem) return 0;
    let totalBase = parseFloat(selectedItem.price || "0");
    Object.entries(selectedOptions).forEach(([variationId, optionIds]) => {
      const variation = selectedItem.variations?.find(
        (v) => v.id === variationId,
      );
      if (variation) {
        optionIds.forEach((optId) => {
          const option = variation.options.find((o) => o.id === optId);
          if (option) totalBase += parseFloat(option.additionalPrice || "0");
        });
      }
    });
    return totalBase * quantity;
  };

  const handleToggleFavorite = async (e: React.MouseEvent, foodId: string) => {
    if (!token) {
      toast.error(t("loginFirst"));
      return;
    }
    e.stopPropagation();
    const isCurrentlyFavorite = favorites.includes(foodId);
    setFavorites((prev) =>
      isCurrentlyFavorite
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId],
    );

    try {
      await toggleFav(
        { foodId },
        null,
        isCurrentlyFavorite
          ? t("removed From Favorites")
          : t("added To Favorites"),
      );
      fetchFavorites();
    } catch (error) {
      setFavorites((prev) =>
        isCurrentlyFavorite
          ? [...prev, foodId]
          : prev.filter((id) => id !== foodId),
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

    try {
      const formattedVariations = Object.entries(selectedOptions).flatMap(
        ([varId, optIds]) =>
          optIds.map((optId) => ({
            variationId: varId,
            optionId: optId,
          })),
      );

      const body = {
        foodId: selectedItem.id,
        quantity: quantity,
        variations: formattedVariations,
      };
      await api.post("/api/user/cart", body);

      toast.success(t("addedToCart"));
      setLoading(false);
      onCartUpdated();
      setSelectedItem(null);
    } catch (error: any) {
      if (error.response) {
        setLoading(false);
        const status = error.response.status;

        if (status === 409) {
          toast.error(t("alreadyInCart"));
        } else if (status === 400) {
          toast.error("بيانات غير صحيحة");
        } else if (status === 401) {
          toast.error(t("loginFirst"));
        } else {
          toast.error("حدث خطأ ما، حاول مرة أخرى");
        }
      } else {
        toast.error("تحقق من الاتصال بالإنترنت");
      }
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-zinc-950">
      <div className="px-4 py-6 mx-3 text-right" dir="rtl">
        {/* شريط البحث */}
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

        {/* Sticky ScrollSpy Categories Menu */}
        <div
          ref={categoryMenuRef}
          className="sticky top-0 z-40 flex gap-2 pb-4 pt-2 mb-6 overflow-x-auto no-scrollbar scroll-smooth bg-gray-50/80 dark:bg-zinc-950/80 backdrop-blur-md"
        >
          {dynamicCategories.map((cat) => (
            <button
              id={`tab-${cat.id}`}
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-yellow-400 text-white shadow-md transform scale-105"
                  : "bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {viewMode === "all" ? (
            // ✅ Category Cards Grid
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 text-2xl font-black text-gray-900 dark:text-white">
                  <LayoutGrid size={24} className="text-yellow-400" />
                  {t("categories")}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
                {dynamicCategories
                  .filter((c) => c.id !== "all")
                  .map((cat) => {
                    const firstItem = dynamicItems.find(
                      (i) => i.categoryId === cat.id,
                    );
                    const itemCount = dynamicItems.filter(
                      (i) => i.categoryId === cat.id,
                    ).length;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        className="relative p-6 bg-white dark:bg-zinc-900 border border-white dark:border-zinc-800 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all text-center group overflow-hidden cursor-pointer hover:-translate-y-2 duration-300"
                      >
                        {/* Top-right decorative corner */}
                        <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-400/5 rounded-bl-[2rem] group-hover:bg-yellow-400 transition-colors duration-500" />

                        {/* Category Image */}
                        <div className="relative z-10 flex items-center justify-center w-16 h-16 mx-auto mb-4 overflow-hidden rounded-2xl bg-gray-50 dark:bg-zinc-800">
                          <img
                            src={firstItem?.image || "/placeholder.jpg"}
                            alt={cat.name}
                            className="object-cover w-full h-full transition-transform group-hover:scale-110"
                          />
                        </div>

                        {/* Category Name */}
                        <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-yellow-500 transition-colors">
                          {cat.name}
                        </h3>

                        {/* Item Count */}
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 block">
                          {itemCount} {t("Item")}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : searchQuery ? (
            // Search Query View
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                  نتائج البحث
                </h2>
                <span className="text-sm text-gray-400 dark:text-zinc-500">
                  (
                  {
                    dynamicItems.filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                    ).length
                  }
                  ){t("Item")}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {dynamicItems
                  .filter((item) =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((item) => {
                    const isFavorite = favoritesList.includes(item.id);
                    return (
                      <div
                        onClick={() => handleItemClick(item)}
                        key={item.id}
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
                            <div>
                              <h3 className="ml-6 font-bold text-gray-900 dark:text-zinc-100">
                                {item.name}
                              </h3>
                              <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500 line-clamp-2">
                                {item.description || item.name}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleToggleFavorite(e, item.id)}
                              className="absolute top-3 left-3 p-1.5 transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full z-10"
                            >
                              <Heart
                                size={18}
                                className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 dark:text-zinc-500"}`}
                              />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-yellow-500">
                              {item.price} E£
                            </span>
                            <div
                              className="p-2 text-white transition-colors bg-gray-900 dark:bg-yellow-400 dark:text-zinc-900 rounded-xl"
                              onClick={handleAddToCartSubmit}
                            >
                              <Plus size={18} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            // Full Menu ScrollSpy View
            dynamicCategories
              .filter((c) => c.id !== "all")
              .map((category) => {
                const categoryItems = dynamicItems.filter(
                  (item) => item.categoryId === category.id,
                );
                if (categoryItems.length === 0) return null;

                return (
                  <div
                    key={category.id}
                    id={category.id}
                    ref={(el) => {
                      sectionRefs.current[category.id] = el;
                    }}
                    className="scroll-mt-36"
                  >
                    <div className="flex items-center justify-between mb-4 border-b pb-2 dark:border-zinc-800">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                        {category.name}
                      </h2>
                      <span className="text-sm text-gray-400 dark:text-zinc-500">
                        ({categoryItems.length}){t("Item")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {categoryItems.map((item) => {
                        const isFavorite = favoritesList.includes(item.id);
                        return (
                          <div
                            onClick={() => handleItemClick(item)}
                            key={item.id}
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
                                <div>
                                  <h3 className="ml-6 font-bold text-gray-900 dark:text-zinc-100">
                                    {item.name}
                                  </h3>
                                  <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500 line-clamp-2">
                                    {item.description || item.name}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) =>
                                    handleToggleFavorite(e, item.id)
                                  }
                                  className="absolute top-3 left-3 p-1.5 transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full z-10"
                                >
                                  <Heart
                                    size={18}
                                    className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 dark:text-zinc-500"}`}
                                  />
                                </button>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <span className="font-bold text-yellow-500">
                                  {item.price} E£
                                </span>
                                <div className="p-2 text-white transition-colors bg-gray-900 dark:bg-yellow-400 dark:text-zinc-900 rounded-xl">
                                  <Plus size={18} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}

          {/* No Search Results Fallback */}
          {searchQuery &&
            dynamicItems.filter((item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()),
            ).length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-600">
                <Search size={48} className="mb-2 opacity-20" />
                <p>{t("noSearchResults")}</p>
              </div>
            )}
        </div>

        {/* Popup */}
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
                  className="object-cover w-full h-full transform transition-transform duration-[1000ms] ease-out hover:scale-105 will-change-transform"
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
                      {selectedItem.name}
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
                      {selectedItem.description}
                    </p>
                  )}
                </div>

                {selectedItem.variations &&
                  selectedItem.variations.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
                      {selectedItem.variations.map((variation) => (
                        <div
                          key={variation.id}
                          className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                                {variation.name}
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
                            {variation.options.map((option) => {
                              const isSelected = (
                                selectedOptions[variation.id] || []
                              ).includes(option.id);
                              return (
                                <label
                                  key={option.id}
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
                                      {option.name}
                                    </span>
                                  </div>
                                  {parseFloat(option.additionalPrice) > 0 && (
                                    <span
                                      className={`text-xs font-black px-2.5 py-1 rounded-xl transition-all duration-300 ${isSelected ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100/40 dark:bg-yellow-400/10 scale-105" : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800"}`}
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
      </div>
    </div>
  );
}
