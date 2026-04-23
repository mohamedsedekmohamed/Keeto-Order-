"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "../../../../context/LanguageContext";
import Image from "next/image";
import useGet from "@/app/hooks/useGet";
import Loading from "@/components/Loading";

interface Restaurant {
  id: string;
  name: string;
  cover: string;
  logo: string;
  address: string;
  minDeliveryTime: string;
}

interface Response {
  success: boolean;
  data: {
    data: Restaurant[];
  };
}

export default function RestaurantsPage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const cuisineId = params.id;

  const { data, loading, error } = useGet<Response>(
    `/api/user/home/cuisines/${cuisineId}/restaurants`
  );

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {t("errorLoading")}
      </div>
    );
  }

  const restaurants = data?.data?.data || [];

  return (
    <div className="min-h-screen px-6 py-10 bg-white dark:bg-zinc-950">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-3xl font-black text-center text-gray-900 dark:text-white"
      >
        {t("restaurants")}
      </motion.h1>

      {/* List */}
      <div className="grid max-w-4xl grid-cols-1 gap-6 mx-auto sm:grid-cols-2">
        {restaurants.map((res, i) => (
          <Link key={res.id} href={`/home/restaurants/${res.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="overflow-hidden transition bg-white border shadow-sm cursor-pointer rounded-3xl dark:bg-zinc-900 dark:border-zinc-800"
            >
              {/* Cover */}
              <div className="relative w-full h-40">
                <Image
                  src={res.cover}
                  alt={res.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 overflow-hidden rounded-xl">
                    <Image
                      src={res.logo}
                      alt={res.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {res.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {res.address}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm font-semibold text-yellow-500">
                  {t("deliveryTime")} : {res.minDeliveryTime} {t("minutes")}
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}