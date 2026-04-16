"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";

import Image from "next/image";

import { StaticImageData } from "next/image";
import { useParams } from "next/navigation";

export default function LogoNav({ logo }: { logo: string | StaticImageData }) {
  const { t } = useLanguage();
  const params = useParams();
const id = params?.id;
  return (
    <header className="w-full font-sans shadow-sm dark:shadow-md dark:shadow-yellow-400/5 dark:border-b dark:border-gray-800">
      
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-950">
        
        {/* logo + links */}
        <div className="flex items-center gap-12">
          <Link href={`/home/restaurants/${id}`}>
            <Image
              src={logo}
              alt="Logo"
              className="w-16 h-auto dark:drop-shadow-[0_0_6px_rgba(253,224,71,0.8)]"
            />
          </Link>

          
        </div>

       
      </div>
    </header>
  );
}