"use client";

import type {
  Variation,
  VariationOption,
} from "@/context/RestaurantContext";

interface FoodVariationOptionsProps {
  variations: Variation[];
  selectedOptions: Record<string, string[]>;
  isRtl: boolean;
  compact?: boolean;
  groupId?: string;
  onSelect: (variation: Variation, option: VariationOption) => void;
}

export default function FoodVariationOptions({
  variations,
  selectedOptions,
  isRtl,
  compact = false,
  groupId = "",
  onSelect,
}: FoodVariationOptionsProps) {
  if (compact) {
    return (
      <>
        {variations.map((variation) => (
          <div key={`rec-variation-${variation.id}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {isRtl ? variation.nameAr : variation.name}
              </span>
              {variation.isRequired && (
                <span className="px-1.5 py-0.5 text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100/40 dark:border-red-900/30">
                  {isRtl ? "مطلوب" : "Required"}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {Array.isArray(variation.options) &&
                variation.options.map((option) => {
                  const isSelected = (
                    selectedOptions[variation.id] || []
                  ).includes(option.id);
                  const selectedCount = (selectedOptions[variation.id] || []).length;
                  const maxAllowed = variation.max ?? (variation.selectionType === "multiple" ? Infinity : 1);
                  const isAtMax = variation.selectionType === "multiple" && !isSelected && selectedCount >= maxAllowed;
                  return (
                    <label
                      key={`rec-option-${option.id}`}
                      onClick={() => !isAtMax && onSelect(variation, option)}
                      className={`flex items-center justify-between px-3 py-2 border rounded-xl transition-all select-none ${
                        isAtMax
                          ? "cursor-not-allowed opacity-40 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          : isSelected
                            ? "cursor-pointer border-yellow-400 bg-yellow-50/20 dark:bg-yellow-400/5 ring-1 ring-yellow-400"
                            : "cursor-pointer border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type={
                            variation.selectionType === "single"
                              ? "radio"
                              : "checkbox"
                          }
                          name={`rec-${groupId}-${variation.id}`}
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 accent-yellow-400"
                        />
                        <span
                          className={`text-xs ${
                            isSelected
                              ? "font-black text-zinc-950 dark:text-zinc-50"
                              : "font-semibold text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {isRtl ? option.nameAr : option.name}
                        </span>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
      {variations.map((variation) => (
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
                  {isRtl ? "مطلوب" : "Required"}
                </span>
              )}
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/10">
              {variation.selectionType === "single"
                ? isRtl
                  ? "اختر واحد"
                  : "Select One"
                : (() => {
                    const min = variation.min ?? 0;
                    const max = variation.max ?? 0;
                    if (min > 0 && max > 0 && min === max) {
                      return isRtl ? `اختر ${min}` : `Select ${min}`;
                    }
                    if (min > 0 && max > 0) {
                      return isRtl ? `اختر من ${min} إلى ${max}` : `Select ${min}–${max}`;
                    }
                    if (max > 0) {
                      return isRtl ? `حد أقصى ${max}` : `Max ${max}`;
                    }
                    if (min > 0) {
                      return isRtl ? `اختر ${min} على الأقل` : `Select at least ${min}`;
                    }
                    return isRtl ? "اختياري" : "Optional";
                  })()}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {Array.isArray(variation.options) &&
              variation.options.map((option) => {
                const isSelected = (
                  selectedOptions[variation.id] || []
                ).includes(option.id);
                const selectedCount = (selectedOptions[variation.id] || []).length;
                const maxAllowed = variation.max ?? (variation.selectionType === "multiple" ? Infinity : 1);
                const isAtMax = variation.selectionType === "multiple" && !isSelected && selectedCount >= maxAllowed;
                return (
                  <div
                    key={`option-${option.id}`}
                    onClick={() => !isAtMax && onSelect(variation, option)}
                    className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-300 ease-out select-none group ${
                      isAtMax
                        ? "cursor-not-allowed opacity-40 border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/40"
                        : isSelected
                          ? "cursor-pointer active:scale-[0.99] border-yellow-400 bg-yellow-50/20 dark:bg-yellow-400/5 shadow-md shadow-yellow-400/5 ring-1 ring-yellow-400"
                          : "cursor-pointer active:scale-[0.99] border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
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
                        readOnly
                        className="w-5 h-5 accent-yellow-400 rounded-full border-zinc-300 dark:border-zinc-700 transition-transform duration-200 group-hover:scale-105"
                      />
                      <span
                        className={`text-sm transition-all duration-200 ${
                          isSelected
                            ? "font-black text-zinc-950 dark:text-zinc-50"
                            : "font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                        }`}
                      >
                        {isRtl ? option.nameAr : option.name}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
