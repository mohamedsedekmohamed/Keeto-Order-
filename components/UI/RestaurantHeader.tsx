"use client";

import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import placeholderBg from "../../public/background.jpeg";

export default function RestaurantHeader({ cover }: { cover?: string }) {
  const router = useRouter();

  return (
    <div className="relative w-full h-[200px] md:h-[320px]">
      <Image
        src={cover || placeholderBg}
        alt="Restaurant Cover"
        fill
        className="object-cover"
        priority
        unoptimized
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* زر الرجوع */}
      <button
        onClick={() => router.back()}
        className="absolute z-20 flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md md:hidden top-4 left-4 active:scale-95"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
