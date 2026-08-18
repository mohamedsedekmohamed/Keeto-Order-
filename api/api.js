import axios from "axios";

const api = axios.create({
  baseURL: "https://Keetobcknd.keeto.org",
});

function getCurrentSlug() {
  if (typeof window === "undefined") return null;
  // Prefer the path segment (e.g. /restaurant/[slug]/...)
  const pathMatch = window.location.pathname.match(/^\/([^/]+)/);
  const pathSlug = pathMatch?.[1];

  // Fall back to ?callbackSlug=... just like TokenContext does
  const searchParams = new URLSearchParams(window.location.search);
  const callbackSlug = searchParams.get("callbackSlug");

  return pathSlug || callbackSlug || null;
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const slug = getCurrentSlug();
      const key = slug ? `token_${slug}` : "token";
      const token = localStorage.getItem(key) || localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
