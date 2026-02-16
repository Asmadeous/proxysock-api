import api from "./api";

export const proxyService = {
  getProxies: async () => {
    const response = await api.get("/proxies");
    return response.data;
  },

  getProxyStats: async () => {
    const response = await api.get("/proxies/stats");
    return response.data;
  },

  purchaseProxy: async (planId: string) => {
    const response = await api.post("/proxies/purchase", { planId });
    return response.data;
  },

  getProxyHealth: async () => {
    const response = await api.get("/proxies/health");
    return response.data;
  },
};

// For development/testing
export const getMockProxies = () => {
  return [
    {
      id: "1",
      ip: "192.168.1.1",
      port: 8080,
      type: "http",
      location: "US",
      isActive: true,
      speed: 85,
      bandwidth: {
        used: 5 * 1024 * 1024 * 1024, // 5 GB
        limit: 50 * 1024 * 1024 * 1024, // 50 GB
      },
    },
    // Add more mock proxies as needed
  ];
};
