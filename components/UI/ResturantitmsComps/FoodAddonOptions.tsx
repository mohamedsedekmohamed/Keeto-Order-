"use client";

export interface AddonItem {
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

interface FoodAddonOptionsProps {
  addons: AddonItem[];
  selectedAddons: string[];
  isRtl: boolean;
  compact?: boolean;
  onToggle: (addonId: string) => void;
}

export default function FoodAddonOptions({
  addons,
  selectedAddons,
  isRtl,
  compact = false,
  onToggle,
}: FoodAddonOptionsProps) {
  if (compact) {
    return (
      <div>
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
          {isRtl ? "الإضافات" : "Add-ons"}
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {addons.map((addon) => {
            const isSelected = selectedAddons.includes(addon.id);
            return (
              <label
                key={`rec-addon-${addon.id}`}
                className={`flex items-center justify-between px-3 py-2 border rounded-xl cursor-pointer transition-all select-none ${
                  isSelected
                    ? "border-yellow-400 bg-yellow-50/20 dark:bg-yellow-400/5 ring-1 ring-yellow-400"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(addon.id)}
                    className="w-4 h-4 accent-yellow-400"
                  />
                  <span
                    className={`text-xs ${
                      isSelected
                        ? "font-black text-zinc-950 dark:text-zinc-50"
                        : "font-semibold text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {isRtl ? addon.nameAr : addon.name}
                  </span>
                </div>
                {parseFloat(addon.price) > 0 && (
                  <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">
                    + {addon.price} E£
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
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
        {addons.map((addon) => {
          const isSelected = selectedAddons.includes(addon.id);
          return (
            <label
              key={`addon-option-${addon.id}`}
              className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-300 ease-out select-none active:scale-[0.99] group ${
                isSelected
                  ? "border-yellow-400 bg-yellow-50/20 dark:bg-yellow-400/5 shadow-md shadow-yellow-400/5 ring-1 ring-yellow-400"
                  : "border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(addon.id)}
                  className="w-5 h-5 accent-yellow-400 rounded-lg border-zinc-300 dark:border-zinc-700 transition-transform duration-200 group-hover:scale-105"
                />
                <span
                  className={`text-sm transition-all duration-200 ${
                    isSelected
                      ? "font-black text-zinc-950 dark:text-zinc-50"
                      : "font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                  }`}
                >
                  {isRtl ? addon.nameAr : addon.name}
                </span>
              </div>
              {parseFloat(addon.price) > 0 && (
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-xl transition-all duration-300 ${
                    isSelected
                      ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100/40 dark:bg-yellow-400/10 scale-105"
                      : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-850"
                  }`}
                >
                  + {addon.price} E£
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
