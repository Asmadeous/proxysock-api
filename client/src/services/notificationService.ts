import railsApi from "../lib/railsApi";

export interface Notification {
  id: number;
  category: "info" | "warning" | "error" | "success" | "system_alert";
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}

// Fetch paginated notifications
export const getNotifications = async (
  page: number = 1,
  perPage: number = 20
): Promise<NotificationsResponse> => {
  const response = await railsApi.get<NotificationsResponse>("/notifications", {
    params: { page, per_page: perPage },
  });
  return response.data;
};

// Get unread count
export const getUnreadCount = async (): Promise<number> => {
  const response = await railsApi.get<{ unread_count: number }>(
    "/notifications/unread_count"
  );
  return response.data.unread_count;
};

// Mark single notification as read
export const markAsRead = async (
  notificationId: number
): Promise<Notification> => {
  const response = await railsApi.put<{ notification: Notification }>(
    `/notifications/${notificationId}/read`
  );
  return response.data.notification;
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<void> => {
  await railsApi.put("/notifications/read_all");
};
