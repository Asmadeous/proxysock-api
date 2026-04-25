import api from "./api";
import adminApi from "./adminApi";
import resellerApi from "./resellerApi";

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

/**
 * Helper to determine which API client and prefix to use based on location
 */
const getApiClient = () => {
  const path = window.location.pathname;
  const isAdmin = path.startsWith('/admin') || path.startsWith('/sadmin') || path.startsWith('/employee');
  const isReseller = path.startsWith('/reseller');
  
  if (isAdmin) {
    return { client: adminApi, prefix: "" };
  }
  
  if (isReseller) {
    return { client: resellerApi, prefix: "" };
  }
  
  return { client: api, prefix: "/web/api" };
};


export const getNotifications = async (page = 1) => {
  const { client, prefix } = getApiClient();
  const response = await client.get(`${prefix}/notifications`, { params: { page } });
  return response.data;
};

export const getUnreadCount = async () => {
  const { client, prefix } = getApiClient();
  const response = await client.get(`${prefix}/notifications/unread_count`);
  return response.data.unread_count ?? 0;
};

export const markAsRead = async (id: number) => {
  const { client, prefix } = getApiClient();
  const response = await client.put(`${prefix}/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const { client, prefix } = getApiClient();
  const response = await client.put(`${prefix}/notifications/read_all`);
  return response.data;
};

