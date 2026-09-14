// Small shared helpers used by any component that needs to localize API
// content (Ar/Fr/base-English fields) or normalize an image value that may
// come back as a raw base64 string, a data URI, or a plain URL.
//
// Pulled out of restaurant page.tsx so RestaurantOffers.tsx can reuse the
// exact same logic instead of a second, slightly-different copy.

// useLanguage()'s `language` isn't an ISO code — elsewhere in the app it's
// compared as `language === "العربية"` (a display name, not "ar").
// Normalize whatever it gives us (display name or code) into "ar" | "fr" | "en".
export function normalizeLang(
  rawLang: string | undefined | null,
): "ar" | "fr" | "en" {
  const value = (rawLang || "").trim().toLowerCase();
  if (rawLang === "العربية" || value === "ar" || value === "arabic")
    return "ar";
  if (
    value === "fr" ||
    value === "french" ||
    value === "français" ||
    value === "francais"
  )
    return "fr";
  return "en";
}

// Generic localized-field getter: works for any object that has
// `<field>`, `<field>Ar`, `<field>Fr` keys (Title/description/image/name/...).
export function localizedField<T extends Record<string, any>>(
  obj: T,
  field: string,
  lang: "ar" | "fr" | "en",
): string {
  if (lang === "ar") return obj[`${field}Ar`] || obj[field] || "";
  if (lang === "fr") return obj[`${field}Fr`] || obj[field] || "";
  return obj[field] || "";
}

// Images may come back as raw base64, a data URI, or a ready-to-use URL —
// normalize so <img src> always gets something renderable.
export function toImageSrc(value?: string) {
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("http")) return value;
  return `data:image/png;base64,${value}`;
}
