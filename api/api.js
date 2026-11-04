import axios from "axios";

const api = axios.create({
  baseURL: "https://Keetobcknd.keeto.org",
});

// Kept in sync by TokenContext (which resolves the slug via Next's own
// useParams()/useSearchParams()). We previously re-derived the slug here
// by regex-parsing window.location.pathname independently — that could
// disagree with the router's resolved params for a beat during
// client-side navigations (e.g. right after the post-login redirect),
// which is why the profile call only worked after a hard refresh.
let activeSlug = null;
export function setActiveSlug(slug) {
  activeSlug = slug || null;
}

/**
 * Checks whether a JWT is expired (if exp claim is present).
 */
export function isJwtExpired(token) {
  if (!token || typeof token !== "string") return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";

    let jsonStr = "";
    if (typeof atob === "function") {
      jsonStr = decodeURIComponent(
        Array.prototype.map
          .call(atob(b64), (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } else if (typeof Buffer !== "undefined") {
      jsonStr = Buffer.from(b64, "base64").toString("utf8");
    } else {
      return false;
    }

    const payload = JSON.parse(jsonStr);
    if (payload.exp && typeof payload.exp === "number") {
      return Date.now() >= payload.exp * 1000;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Completely purges dead/invalid tokens from localStorage and notifies app.
 */
export function clearAuthTokens(slug) {
  if (typeof window === "undefined") return;
  try {
    if (slug) {
      localStorage.removeItem(`token_${slug}`);
    }
    localStorage.removeItem("token");

    // Clean any other token_* keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key === "token" || key.startsWith("token_"))) {
        localStorage.removeItem(key);
      }
    }

    window.dispatchEvent(
      new CustomEvent("auth:invalid-token", { detail: { slug: slug || activeSlug } })
    );
  } catch (err) {
    console.error("Failed to clear auth tokens:", err);
  }
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const key = activeSlug ? `token_${activeSlug}` : "token";
      let token = localStorage.getItem(key) || localStorage.getItem("token");

      if (token === "undefined" || token === "null" || !token?.trim()) {
        clearAuthTokens(activeSlug);
        token = null;
      } else if (isJwtExpired(token)) {
        clearAuthTokens(activeSlug);
        token = null;
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const errorData = error?.response?.data;
    const errorMsg = (
      errorData?.error?.message ||
      errorData?.message ||
      error?.message ||
      ""
    ).toLowerCase();

    const isInvalidToken =
      status === 401 ||
      errorMsg.includes("invalid token") ||
      errorMsg.includes("jwt expired") ||
      errorMsg.includes("token expired") ||
      errorMsg.includes("jwt malformed") ||
      errorMsg.includes("invalid signature") ||
      errorMsg.includes("jwt must be provided");

    if (isInvalidToken) {
      clearAuthTokens(activeSlug);
    }

    return Promise.reject(error);
  }
);

export default api;
