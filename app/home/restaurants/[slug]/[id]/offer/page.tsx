"use client";
import useGet from "../../../../../hooks/useGet"; // Assuming this is the hook used in your project
import { Tag, BadgePercent, AlertCircle, ChevronLeft } from "lucide-react";
import Loading from "@/components/Loading";
import { useParams, useRouter } from "next/navigation";

interface Offer {
  foodId: string;
  foodName: string;
  originalPrice: string;
  discountId: string;
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
}

const RestaurantOffers = () => {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id;
  const { data, loading } = useGet(
    `/api/user/offers/restaurant/${restaurantId}/offers`,
  );

  if (loading) return <Loading />;

  const offers: Offer[] = data?.data || [];

  return (
    <div className="p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center justify-center w-10 h-10 transition-transform bg-yellow-400 rounded-full shadow-md active:scale-95 text-white"
      >
        <ChevronLeft className="w-6 h-6 transform rotate-0 rtl:rotate-180" />
      </button>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Tag className="text-indigo-600" />
        Current Offers
      </h2>

      {offers.length === 0 ? (
        <>
          <div className="text-center py-10 text-slate-400">
            No offers available
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            // Calculate discounted price
            const price = parseFloat(offer.originalPrice);
            const discount = parseFloat(offer.discountValue);
            const finalPrice =
              offer.discountType === "percentage"
                ? price - price * (discount / 100)
                : price - discount;

            return (
              <div
                key={offer.foodId}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-slate-800">
                    {offer.foodName}
                  </h3>
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-lg flex items-center gap-1">
                    <BadgePercent size={14} />
                    {offer.discountValue}
                    {offer.discountType === "percentage" ? "%" : " OFF"}
                  </span>
                </div>

                <div className="text-sm text-slate-500 mb-4">
                  Deal:{" "}
                  <span className="font-medium text-slate-700">
                    {offer.discountName}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 line-through text-sm">
                    ${offer.originalPrice}
                  </span>
                  <span className="text-xl font-bold text-yellow-400">
                    ${finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RestaurantOffers;
