"use client";
import Image from 'next/image'
import background from '../../public/background.jpeg'
import {  ChevronLeft } from "lucide-react";

export default function RestaurantHeader() {
  return (
   <div className="relative w-full h-[200px] md:h-[320px]">
        <Image
          src={background}
          alt={` Background`}
          fill
          className="object-cover"
          priority
        />
        
        {/* زر الرجوع (للشاشات الصغيرة) */}
        <button className="absolute flex items-center justify-center w-10 h-10 bg-yellow-400 rounded-full shadow-md md:hidden top-4 left-4">
          <ChevronLeft className="h-6 w-6 text-white pr-0.5" />
        </button>
      </div>

  )
}