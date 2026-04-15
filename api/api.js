import axios from "axios";

const api = axios.create({
  baseURL: "https://keetobcknd.keeto.org",
});

export default api;