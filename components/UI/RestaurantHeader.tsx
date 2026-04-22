"use client";

import Image from 'next/image';
import { ChevronLeft } from "lucide-react";
// لو عندك مسار احتياطي (Placeholder) في حالة المطعم ملوش Cover
import placeholderBg from '../../public/background.jpeg'; 

export default function RestaurantHeader({ cover }: { cover?: string }) {
  return (
    <div className="relative w-full h-[200px] md:h-[320px]">
      <Image
        src={cover || placeholderBg}
        alt="Restaurant Cover"
        fill
        className="object-cover"
        priority
        // يمكنك استخدام unoptimized لو الصور جاية من روابط خارجية غير مسجلة في next.config.js
        unoptimized 
      />
        
      {/* زر الرجوع */}
      <button className="absolute flex items-center justify-center w-10 h-10 bg-yellow-400 rounded-full shadow-md md:hidden top-4 left-4">
        <ChevronLeft className="h-6 w-6 text-white pr-0.5" />
      </button>
    </div>
  );
}