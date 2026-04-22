// useRestaurantRoute.ts
"use client";

import { useParams } from "next/navigation";

export const useRestaurantRoute = () => {
  const params = useParams();
  const id = params?.id as string | undefined;

  const withId = (path: string) => {
    if (!id) return path;
    return `/home/restaurants/${id}${path}`;
  };

  return { id, withId };
};