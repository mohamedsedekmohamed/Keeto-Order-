"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "../../../../context/LanguageContext";
import Image from "next/image";
import useGet from "@/app/hooks/useGet";
import Loading from "@/components/Loading";

interface Item {
  foodId: string;
  foodName: string;
  foodImage: string;
  price: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo: string;
}

interface Response {
  success: boolean;
  data: {
    data: Item[];
  };
}

export default function ItemsPage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const categoryId = params.id;

  const { data, loading, error } = useGet<Response>(
    `/api/user/home/categories/${categoryId}/items`
  );

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {t("errorLoading")}
      </div>
    );
  }

  const items = data?.data?.data || [];

  return (
    <div className="min-h-screen px-6 py-10 bg-white dark:bg-zinc-950">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-3xl font-black text-center text-gray-900 dark:text-white"
      >
        {t("menu")}
      </motion.h1>

      {/* Items */}
      <div className="grid max-w-4xl grid-cols-1 gap-6 mx-auto sm:grid-cols-2">
        {items.map((item, i) => (
                      <Link key={item.restaurantId} 
                      href={`/home/restaurants/${item.restaurantId}`}>

          <motion.div
            key={item.foodId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="overflow-hidden transition bg-white border shadow-sm rounded-3xl dark:bg-zinc-900 dark:border-zinc-800"
          >
            {/* Image */}
            <div className="relative w-full h-40">
              <Image
                src={item.foodImage}
                alt={item.foodName}
                fill
                className="object-cover"
              />
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {item.foodName}
              </h3>

              <p className="mt-1 font-semibold text-yellow-500">
                {item.price} {t("currency")}
              </p>

              {/* Restaurant Info */}
              <div className="flex items-center gap-2 mt-4">
                <div className="relative w-8 h-8 overflow-hidden rounded-lg">
                  <Image
                    src={item.restaurantLogo}
                    alt={item.restaurantName}
                    fill
                    className="object-cover"
                  />
                </div>

                <Link
                  href={`/restaurant/${item.restaurantId}`}
                  className="text-sm text-gray-500 hover:text-yellow-500"
                >
                  {item.restaurantName}
                </Link>
              </div>
            </div>
          </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}