"use client";

import React from "react";

interface SubCategoryCardProps {
  image: string;
  name: string;
  count: number;
  isRtl: boolean;
  onClick: () => void;
}

export default function SubCategoryCard({
  image,
  name,
  count,
  isRtl,
  onClick,
}: SubCategoryCardProps) {
  return (
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
}
