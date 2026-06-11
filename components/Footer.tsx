"use client";
import React from "react";
import { FaFacebook, FaInstagram, FaTiktok, FaHeart } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";
import { useRestaurant } from "@/context/RestaurantContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

const Footer = () => {
  const { t } = useLanguage();
  const { restaurant } = useRestaurant();

  const currentYear = new Date().getFullYear();
  const params = useParams();

  //const restaurantId = (params?.id as string) || restaurant?.id;
  const restaurantName = params.slug as string;
  const basePath = `/home/restaurants/${restaurantName}`;

  return (
    <footer className="transition-colors duration-300 bg-white border-t border-gray-100 dark:bg-zinc-950 dark:border-zinc-900">
      <div className="max-w-4xl px-6 py-10 mx-auto">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* الجانب الأيمن: البراند والوصف */}
          <div className="text-center md:text-right">
            <Link
              href="https://keeto.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/main.webp"
                alt="KeeTo Logo"
                width={128} // تعادل w-32
                height={128} // تعادل h-32
                className="mx-auto"
              />
            </Link>

            <div className="relative pl-4 border-l-2 border-yellow-400/50">
              <p className="max-w-sm text-sm leading-relaxed text-gray-500 dark:text-zinc-400 font-medium italic">
                {t("description")}
              </p>
            </div>
          </div>

          {/* الجانب الأوسط: روابط سريعة */}
          <div className="flex gap-8 text-sm font-semibold text-gray-500 dark:text-zinc-400">
            {[
              { name: t("aboutUs"), href: "#" },
              { name: t("contactUs"), href: "#" },
              { name: t("terms"), href: "#" },
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative pb-1 transition-colors hover:text-yellow-500 group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* الجانب الأيسر: السوشيال ميديا */}
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com/keetoapp"
              target="_blank"
              className="p-3 text-gray-600 transition-all rounded-full shadow-sm bg-gray-50 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
            >
              <FaFacebook size={20} />
            </a>
            <a
              href="https://instagram.com/keeto_app"
              target="_blank"
              className="p-3 text-gray-600 transition-all rounded-full shadow-sm bg-gray-50 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-900/20"
            >
              <FaInstagram size={20} />
            </a>
            <a
              href="#"
              className="p-3 text-gray-600 transition-all rounded-full shadow-sm bg-gray-50 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <FaTiktok size={20} />
            </a>
          </div>
        </div>

        {/* الخط السفلي وحقوق النشر */}
        <div className="flex flex-col items-center gap-2 pt-8 mt-10 border-t border-gray-100 dark:border-zinc-900">
          <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
            {t("madeWith")}{" "}
            <FaHeart size={12} className="text-red-500 fill-red-500" />{" "}
            {t("by")}
          </p>
          <p className="text-gray-400 dark:text-zinc-600 text-[10px] uppercase tracking-widest">
            © {currentYear} Keeto . {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
