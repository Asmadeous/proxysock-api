import railsApi from "../lib/railsApi";
import { Order } from "../types/index";

// Fetch orders
export const fetchOrders = async (searchTerm: string = ""): Promise<Order[] | null> => {
  try {
    const params = searchTerm ? { search: searchTerm } : {};
    const response = await railsApi.get<{ orders: Order[] } | Order[]>("/orders", { params });

    // Handle both array and object responses
    const data = response.data;
    return Array.isArray(data) ? data : data.orders || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return null;
  }
};

// Fetch single order
export const fetchOrder = async (orderId: number): Promise<Order | null> => {
  try {
    const response = await railsApi.get<{ order: Order } | Order>(`/orders/${orderId}`);
    const data = response.data;
    return "order" in data ? data.order : data;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
};

// Fetch order credentials
export const fetchOrderCredentials = async (orderId: number): Promise<any | null> => {
  try {
    const response = await railsApi.get(`/orders/${orderId}/credentials`);
    return response.data;
  } catch (error) {
    console.error("Error fetching order credentials:", error);
    return null;
  }
};

// Fetch completed orders total (for analytics)
export const fetchCompletedOrdersTotal = async (): Promise<{
  orderTotal: number | null;
  error: string | null;
}> => {
  try {
    const response = await railsApi.get<{ orders: Order[] } | Order[]>("/orders", {
      params: { status: "active" },
    });

    const data = response.data;
    const orders = Array.isArray(data) ? data : data.orders || [];

    const orderTotal = orders.reduce(
      (sum: number, order: Order) => sum + (parseFloat(String(order.total_amount)) || 0),
      0
    );

    return { orderTotal, error: null };
  } catch (error) {
    console.error("Error calculating completed orders total:", error);
    return {
      orderTotal: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};