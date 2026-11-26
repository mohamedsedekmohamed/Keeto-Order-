"use client";

import { Heart, Loader2 } from "lucide-react";
import ProfileAccordion from "./ProfileAccordion";

type Translate = (key: string) => string | undefined;

interface FavoriteFood {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  description: string;
  price: string;
}

interface ProfileFavoritesProps {
  isOpen: boolean;
  favorites: FavoriteFood[];
  isLoading: boolean;
  isArabic: boolean;
  t: Translate;
  onToggle: () => void;
  onRemove: (foodId: string) => void;
}

export default function ProfileFavorites({
  isOpen,
  favorites,
  isLoading,
  isArabic,
  t,
  onToggle,
  onRemove,
}: ProfileFavoritesProps) {
  return (
    <ProfileAccordion
      icon={<Heart size={18} />}
      label={t("favorites") || "المفضلة"}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="p-6 sm:p-8 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t("favorites") || "المفضلة"}
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-zinc-400">
            <Heart className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
            <p>{t("noFavorites") || "لا توجد عناصر مفضلة حالياً."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="p-4 transition bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-yellow-400/50"
              >
                <div className="relative w-full h-40 mb-4 overflow-hidden rounded-xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="object-cover w-full h-full"
                  />
                </div>

                <h4 className="mb-1 font-bold text-gray-900 dark:text-white">
                  {isArabic ? item.nameAr : item.name}
                </h4>

                <p className="mb-3 text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-black text-yellow-500">
                    {item.price} E£
                  </span>

                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 transition bg-red-100 rounded-full cursor-pointer dark:bg-red-500/10 hover:scale-110"
                  >
                    <Heart
                      size={16}
                      className="text-red-500 fill-red-500"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileAccordion>
  );
}
