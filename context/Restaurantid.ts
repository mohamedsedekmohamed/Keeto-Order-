// utils/restaurantId.ts
//
// Stores/retrieves the *real* restaurant.id (UUID) returned by the
// restaurant/menu API, keyed per restaurant slug — mirrors TokenContext's
// `token_${slug}` pattern exactly.
//
// Why keyed by slug and not a flat "restaurantId" key: the user can visit
// multiple restaurants in the same browser session. A flat key would get
// overwritten every time they open a different restaurant, so any other
// page/tab reading it later could silently pick up the WRONG restaurant's id.

const keyFor = (slug: string) => `restaurant_id_${slug}`;

export function getRestaurantId(slug?: string | null): string | null {
  if (typeof window === "undefined" || !slug) return null;
  return localStorage.getItem(keyFor(slug));
}

export function setRestaurantId(slug?: string | null, id?: string | null) {
  if (typeof window === "undefined" || !slug) return;
  const key = keyFor(slug);
  if (id) {
    localStorage.setItem(key, id);
  } else {
    localStorage.removeItem(key);
  }
}