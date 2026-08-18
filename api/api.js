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

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const key = activeSlug ? `token_${activeSlug}` : "token";
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
