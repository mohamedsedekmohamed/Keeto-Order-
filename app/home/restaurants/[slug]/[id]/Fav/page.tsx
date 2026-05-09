"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Heart } from "lucide-react";
import Loading from "@/components/Loading";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import usePost from "@/app/hooks/usePost";

interface FavoriteFood {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();
  const { postData: toggleFav } = usePost("/api/user/favlist/toggle");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (token) {
      fetchFavorites();
    }
  }, [token]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "https://keetobcknd.keeto.org/api/user/favlist",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setFavorites(res?.data?.data?.data?.foods || []);
    } catch (error) {
      console.error(error);
      toast.error("فشل تحميل المفضلة");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (foodId: string) => {
    try {
      await toggleFav({ foodId }, null, t("removed From Favorites"));

      // تحديث UI فورًا
      setFavorites((prev) => prev.filter((item) => item.id !== foodId));
    } catch (error) {
      toast.error("حدث خطأ أثناء الإزالة");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen px-4 py-6 bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="text-red-500 fill-red-500" />
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            {t("favorites")}
          </h1>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart
              size={60}
              className="mb-4 text-gray-300 dark:text-zinc-700"
            />
            <p className="text-lg font-bold text-gray-400">
              لا يوجد عناصر في المفضلة
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="p-4 transition bg-white border border-gray-100 shadow-sm dark:bg-zinc-900 rounded-3xl dark:border-zinc-800 hover:shadow-md"
              >
                <div className="relative w-full h-52 mb-4 overflow-hidden rounded-2xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="object-cover w-full h-full"
                  />
                </div>

                <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                  {item.name}
                </h2>

                <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-black text-yellow-500">
                    {item.price} E£
                  </span>

                  <button
                    onClick={() => handleRemoveFavorite(item.id)}
                    className="p-2 transition bg-red-100 rounded-full cursor-pointer dark:bg-red-500/10 hover:scale-110"
                  >
                    <Heart size={18} className="text-red-500 fill-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
