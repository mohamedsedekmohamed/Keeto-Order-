export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://keetobcknd.keeto.org";

export const MAIN_HOSTS = [
  "orderfood.keeto.org",
  "localhost",
  "127.0.0.1",
];

export interface Tenant {
  mode: "path" | "custom" | "notfound";
  slug: string | null;
  name: string | null;
  id: string | null;
}

/**
 * Returns the hostname without port and lowercased.
 * Supports ?__custom_host=... for development/testing overrides.
 */
export function getCleanHost(): string {
  if (typeof window === "undefined") return "";

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const testHost = urlParams.get("__custom_host");
    if (testHost) {
      return testHost.toLowerCase().split(":")[0].trim();
    }
  } catch {}

  return window.location.hostname.toLowerCase().split(":")[0].trim();
}

/**
 * Resolves the tenant from the hostname.
 * - If hostname is in MAIN_HOSTS (e.g. orderfood.keeto.org or localhost), mode is 'path'.
 * - Otherwise mode is 'custom', calls GET {API_BASE}/api/resolve-domain?host=<hostname>.
 * - 404: mode is 'notfound'.
 * - Network error: throws Error so UI shows retry screen.
 */
export async function resolveTenant(hostOverride?: string): Promise<Tenant> {
  const host = hostOverride || getCleanHost();

  if (!host || MAIN_HOSTS.includes(host)) {
    return { mode: "path", slug: null, name: null, id: null };
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/resolve-domain?host=${encodeURIComponent(host)}`,
    );

    if (res.status === 404) {
      return { mode: "notfound", slug: null, name: null, id: null };
    }

    if (!res.ok) {
      throw new Error(`Resolve failed with status ${res.status}`);
    }

    const json = await res.json();
    const data = json?.data?.data || json?.data || json;

    return {
      mode: "custom",
      slug: data.restaurantSlug || data.slug || null,
      name: data.name || null,
      id: data.id || null,
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Single function for every internal link across path mode and custom mode.
 * - Mode custom: / -> restaurant page, /cart, /checkout, etc.
 * - Mode path: /home/restaurants/:slug/restaurant, etc.
 */
export function buildLink(
  tenant: { mode: "path" | "custom" | "notfound"; slug?: string | null },
  page: string = "",
): string {
  const cleanPage = page.replace(/^\/+/, "");

  if (tenant.mode === "custom") {
    if (!cleanPage || cleanPage === "restaurant") return "/";
    return `/${cleanPage}`;
  }

  const slug = tenant.slug || "";
  if (!slug) return cleanPage ? `/${cleanPage}` : "/";

  if (!cleanPage || cleanPage === "restaurant") {
    return `/home/restaurants/${slug}/restaurant`;
  }

  return `/home/restaurants/${slug}/${cleanPage}`;
}

