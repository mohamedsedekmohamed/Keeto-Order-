import api from "@/api/api";

type StoredWeightRequest = {
  status?: unknown;
  requestId?: unknown;
};

const asStoredWeightRequest = (value: unknown): StoredWeightRequest | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as StoredWeightRequest)
    : null;

export const cancelStoredWeightRequest = async (
  restaurantId: string,
  reason: string,
) => {
  const storageKey = `weight-request-${restaurantId}`;
  const storedValue = localStorage.getItem(storageKey);
  if (!storedValue) return;

  const storedRequest = asStoredWeightRequest(JSON.parse(storedValue));
  if (
    !storedRequest ||
    (storedRequest.status !== "pending" && storedRequest.status !== "accepted")
  ) {
    return;
  }

  if (
    (typeof storedRequest.requestId !== "string" &&
      typeof storedRequest.requestId !== "number") ||
    !String(storedRequest.requestId).trim()
  ) {
    throw new Error("Cannot cancel the weight request without its ID.");
  }

  await api.post(
    `/api/user/weight-requests/${encodeURIComponent(String(storedRequest.requestId))}/cancel`,
    { reason },
  );
  localStorage.setItem(
    storageKey,
    JSON.stringify({ ...storedRequest, status: "cancelled" }),
  );
};
