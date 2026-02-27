import api from "./api";

export interface Notification {
  id: number;
  category: "order" | "system" | "billing" | "ticket" | "vm" | "esim" | "rdp";
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export const getNotifications = async (page = 1) => {
  const response = await api.get("/web/api/notifications", { params: { page } });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get("/web/api/notifications/unread_count");
  return response.data.unread_count ?? 0;
};

export const markAsRead = async (id: number) => {
  const response = await api.put(`/web/api/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.put("/web/api/notifications/read_all");
  return response.data;
};
