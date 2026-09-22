"use client";

import React from "react";
import { Heart, Plus } from "lucide-react";
import { MenuItem } from "@/context/RestaurantContext";
import { hasDiscount, getDiscountBadge } from "./menuPricing";

interface FoodCardProps {
  item: MenuItem;
  isRtl: boolean;
  isFavorite: boolean;
  isHighlighted: boolean;
  firstColor: string;
  textFirstColor: string;
  onSelect: (item: MenuItem) => void;
  onToggleFavorite: (e: React.MouseEvent, foodId: string) => void;
}

export default function FoodCard({
  item,
  isRtl,
  isFavorite,
  isHighlighted,
  firstColor,
  textFirstColor,
  onSelect,
  onToggleFavorite,
}: FoodCardProps) {
  const outOfStock = Boolean((item as any).isOutOfStock);

  return (
    <div
      onClick={() => {
        if (outOfStock) return;
        onSelect(item);
      }}
      id={`food-${item.id}`}
      aria-disabled={outOfStock}
      className={`relative flex items-center p-3 transition-all bg-white border border-gray-100 shadow-sm dark:bg-zinc-900 rounded-2xl dark:border-zinc-800 group ${
        isHighlighted ? "ring-4 ring-yellow-400/60 " : ""
      }${
        outOfStock
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:shadow-md"
      }`}
    >
      <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden rounded-xl">
        <img
          src={item.image}
          alt={item.name}
          className={`object-cover w-full h-full transition-transform ${
            outOfStock ? "grayscale" : "group-hover:scale-110"
          }`}
        />
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="px-2 py-1 text-[10px] font-black tracking-wide text-white uppercase rounded-md bg-black/70">
              {isRtl ? "نفذت الكمية" : "Out of Stock"}
            </span>
          </div>
        )}
      </div>
      <div
        className={`flex flex-col justify-between flex-1 h-full ${
          isRtl ? "mr-4" : "ml-4"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-bold text-gray-900 dark:text-zinc-100 line-clamp-1 ${
                  isRtl ? "ml-6" : "mr-6"
                }`}
              >
                {isRtl ? item.nameAr : item.name}
              </h3>
              {outOfStock && (
                <span className="px-1.5 py-0.5 text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-md">
                  {isRtl ? "غير متوفر" : "Out of Stock"}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500 line-clamp-2">
              {isRtl ? item.descriptionAr : item.description}
            </p>
          </div>
          <button
            onClick={(e) => onToggleFavorite(e, item.id)}
            className={`absolute top-3 p-1.5 transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full z-10 ${
              isRtl ? "left-3" : "right-3"
            }`}
          >
            <Heart
              size={18}
              className={`transition-colors ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400 dark:text-zinc-500"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            {hasDiscount(item) ? (
              <>
                <span className="font-bold text-yellow-500">
                  {item.discountPrice} E£
                </span>
                <span className="text-xs text-gray-400 line-through dark:text-zinc-500">
                  {item.price} E£
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-black text-white bg-red-500 rounded-md">
                  {getDiscountBadge(item)}
                </span>
              </>
            ) : (
              <span className="font-bold text-yellow-500">
                {item.price} E£
              </span>
            )}
          </div>
          {outOfStock ? (
            <div className="p-2 text-gray-400 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-500 rounded-xl cursor-not-allowed">
              <Plus size={18} />
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item);
              }}
              className="p-2 transition-all duration-200 rounded-xl cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
              style={{
                backgroundColor: firstColor,
                color: textFirstColor,
              }}
            >
              <Plus size={18} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
