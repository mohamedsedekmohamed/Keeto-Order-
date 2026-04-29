"use client";
import React from 'react';
import { FaFacebook, FaInstagram, FaTwitter, FaHeart } from 'react-icons/fa';
import { useLanguage } from "../context/LanguageContext";
import { useRestaurant } from "@/context/RestaurantContext";
import Link from "next/link";
import { useParams } from "next/navigation";

const Footer = () => {
    const {  t } = useLanguage();
  const { restaurant } = useRestaurant();

  const currentYear = new Date().getFullYear();
const params = useParams();

  const restaurantId = (params?.id as string) || restaurant?.id;
  const restaurantName =params.slug as string;
  const basePath = `/home/restaurants/${restaurantName}/${restaurantId}`;

  return (
    <footer className="transition-colors duration-300 bg-white border-t border-gray-100 dark:bg-zinc-950 dark:border-zinc-900">
      <div className="max-w-4xl px-6 py-10 mx-auto">
        
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          
          {/* الجانب الأيمن: البراند والوصف */}
          <div className="text-center md:text-right">
                      <Link href={`${basePath}`}>

            <h2 className="mb-2 text-2xl font-black tracking-tight text-yellow-400">
              
              {restaurant?.name }
            </h2>
                      </Link>

            <p className="max-w-xs text-sm text-gray-500 dark:text-zinc-400">
              {t('description')}
            </p>
          </div>

          {/* الجانب الأوسط: روابط سريعة */}
          <div className="flex gap-6 text-sm font-medium text-gray-600 dark:text-zinc-300">
            <a href="#" className="transition-colors hover:text-yellow-400">{t('aboutUs')}</a>
            <a href="#" className="transition-colors hover:text-yellow-400">{t('contactUs')}</a>
            <a href="#" className="transition-colors hover:text-yellow-400">{t('terms')}</a>
          </div>

          {/* الجانب الأيسر: السوشيال ميديا */}
          <div className="flex items-center gap-4">
            <a href="https://facebook.com/keetoapp" target="_blank" className="p-3 text-gray-600 transition-all rounded-full shadow-sm bg-gray-50 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
              <FaFacebook size={20} />
            </a>
            <a href="https://instagram.com/keeto_app" target="_blank" className="p-3 text-gray-600 transition-all rounded-full shadow-sm bg-gray-50 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-900/20">
              <FaInstagram size={20} />
            </a>
            <a href="#" className="p-3 text-gray-600 transition-all rounded-full shadow-sm bg-gray-50 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-sky-900/20">
              <FaTwitter size={20} />
            </a>
          </div>
        </div>

        {/* الخط السفلي وحقوق النشر */}
        <div className="flex flex-col items-center gap-2 pt-8 mt-10 border-t border-gray-100 dark:border-zinc-900">
          <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
            {t('madeWith')} <FaHeart size={12} className="text-red-500 fill-red-500" /> {t('by')}
          </p>
          <p className="text-gray-400 dark:text-zinc-600 text-[10px] uppercase tracking-widest">
            © {currentYear} Keeto App. {t('rights')}
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;