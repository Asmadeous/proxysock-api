import api from "./api";

export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

export const markAsRead = async (notificationId: string) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// For development/testing
export const getMockNotifications = () => {
  return [
    {
      _id: "1",
      title: "Proxy Status Alert",
      message: "Your proxy 192.168.1.1 is running low on bandwidth",
      type: "warning",
      read: false,
      createdAt: new Date().toISOString(),
    },
    // Add more mock notifications as needed
  ];
};
