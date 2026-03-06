import api from "./api";

// proxyService.ts — only exposes routes that actually exist in routes.rb.
// /proxies and /proxies/stats do not exist; removed to prevent dead API calls.

export const proxyService = {
  // Proxy products are fetched via the products API, filtered by product_type.
  getProxies: async (productType?: string) => {
    const params = productType ? { product_type: productType } : {};
    const response = await api.get("/web/api/products", { params });
    return response.data;
  },

  purchaseProxy: async (planId: string) => {
    const response = await api.post("/web/api/orders", { product_id: planId });
    return response.data;
  },
};

// For development/testing — mock only, never reaches the API.
export const getMockProxies = () => {
  return [
    {
      id: "1",
      ip: "192.168.1.1",
      port: 8080,
      type: "mobile_proxy",
      status: "active",
      country: "US",
    },
  ];
};
