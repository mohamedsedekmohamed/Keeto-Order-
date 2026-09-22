// ─────────────────────────────────────────────
// Menu pricing / discount helpers
// Pure functions (no component state), shared by FoodCard, the item
// detail modal, and the recommended-foods modal so all three price a
// food item identically.
// ─────────────────────────────────────────────

export const hasDiscount = (item: any) => {
  return (
    !!item &&
    item.discountValue !== null &&
    item.discountValue !== undefined &&
    item.discountValue !== ""
  );
};

export const getEffectivePrice = (item: any) => {
  return parseFloat(
    hasDiscount(item) ? item.discountPrice : (item?.price ?? "0"),
  );
};

export const getDiscountBadge = (item: any) => {
  if (!hasDiscount(item)) return null;
  return item.discountType === "percentage"
    ? `-${item.discountValue}%`
    : `-${item.discountValue} E£`;
};
