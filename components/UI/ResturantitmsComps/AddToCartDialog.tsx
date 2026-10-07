"use client";

import { FileText, Minus, Plus, X } from "lucide-react";
import type { MenuItem, Variation, VariationOption } from "@/context/RestaurantContext";
import type { AddonItem } from "./FoodAddonOptions";
import FoodAddonOptions from "./FoodAddonOptions";
import FoodVariationOptions from "./FoodVariationOptions";
import { getDiscountBadge, hasDiscount } from "./menuPricing";

interface AddToCartDialogProps {
  item: MenuItem & { addons?: AddonItem[] };
  isRtl: boolean;
  selectedOptions: Record<string, string[]>;
  selectedAddons: string[];
  quantity: number;
  note: string;
  totalPrice: number;
  loading: boolean;
  addToCartLabel: string;
  onClose: () => void;
  onSelectVariation: (variation: Variation, option: VariationOption) => void;
  onToggleAddon: (addonId: string) => void;
  onQuantityChange: (quantity: number) => void;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
}

export default function AddToCartDialog({
  item,
  isRtl,
  selectedOptions,
  selectedAddons,
  quantity,
  note,
  totalPrice,
  loading,
  addToCartLabel,
  onClose,
  onSelectVariation,
  onToggleAddon,
  onQuantityChange,
  onNoteChange,
  onSubmit,
}: AddToCartDialogProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/70 backdrop-blur-md transition-all duration-500 animate-in fade-in">
      <div className="relative w-full max-w-xl overflow-hidden bg-white dark:bg-zinc-900 border-t sm:border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-500 ease-out overscroll-behavior-contain">
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none">
          <button
            onClick={onClose}
            className="pointer-events-auto p-2.5 rounded-full shadow-lg bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700 backdrop-blur-md text-zinc-800 dark:text-zinc-100 transition-all active:scale-90 hover:scale-105"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative w-full h-56 sm:h-72 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={item.image}
            alt={item.name}
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
                {isRtl ? item.nameAr : item.name}
              </h2>
              <div className="text-left shrink-0 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/40">
                {hasDiscount(item) ? (
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-yellow-500">
                        {item.discountPrice}
                      </span>
                      <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                        E£
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-400 line-through dark:text-zinc-500">
                        {item.price} E£
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-black text-white bg-red-500 rounded-md">
                        {getDiscountBadge(item)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-2xl font-black text-yellow-500">
                      {item.price}
                    </span>
                    <span
                      className={`text-xs font-bold text-zinc-400 dark:text-zinc-500 ${
                        isRtl ? "mr-1" : "ml-1"
                      }`}
                    >
                      E£
                    </span>
                  </>
                )}
              </div>
            </div>
            {item.description && (
              <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50/40 dark:bg-zinc-800/10 p-3.5 rounded-2xl border border-zinc-100/50 dark:border-zinc-800/20">
                {isRtl ? item.descriptionAr : item.description}
              </p>
            )}
          </div>

          {Array.isArray(item.variations) && item.variations.length > 0 && (
            <FoodVariationOptions
              variations={item.variations}
              selectedOptions={selectedOptions}
              isRtl={isRtl}
              onSelect={onSelectVariation}
            />
          )}

          {Array.isArray(item.addons) && item.addons.length > 0 && (
            <FoodAddonOptions
              addons={item.addons}
              selectedAddons={selectedAddons}
              isRtl={isRtl}
              onToggle={onToggleAddon}
            />
          )}

          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            <div className="flex items-center gap-2 mb-3">
              <FileText
                size={18}
                className="text-zinc-400 dark:text-zinc-500"
              />
              <h4 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                {isRtl ? "ملاحظات الطلب" : "Order Notes"}
              </h4>
            </div>
            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={
                isRtl
                  ? "مثال: بدون بصل، زيادة صوص..."
                  : "E.g. No onions, extra sauce..."
              }
              rows={3}
              className="w-full p-4 text-sm text-zinc-800 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl outline-none resize-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200"
            />
          </div>
        </div>

        <div className="p-6 bg-white border-t border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 shadow-[0_-12px_30px_rgba(0,0,0,0.03)] shrink-0 space-y-4 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                {isRtl ? "الإجمالي النهائي" : "Total Price"}
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight transition-all duration-300 transform">
                  {totalPrice.toFixed(2)}
                </span>
                <span
                  className={`text-xs font-bold text-yellow-500 ${
                    isRtl ? "mr-1" : "ml-1"
                  }`}
                >
                  E£
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/10 rounded-2xl shadow-inner">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="flex items-center justify-center w-9 h-9 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-700 hover:bg-zinc-50 rounded-xl transition-all shadow-sm active:scale-90"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="w-6 text-base font-black text-center text-zinc-800 dark:text-zinc-100 tabular-nums animate-in fade-in zoom-in-75 duration-200">
                {quantity}
              </span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="flex items-center justify-center w-9 h-9 text-zinc-900 dark:text-zinc-900 bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-all shadow-md active:scale-90"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <button
            disabled={loading}
            onClick={onSubmit}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:hover:bg-yellow-400 text-zinc-950 disabled:text-zinc-400 font-black text-base py-4 rounded-2xl shadow-xl shadow-yellow-400/10 hover:shadow-yellow-400/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              addToCartLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
