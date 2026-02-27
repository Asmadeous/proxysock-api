import api from "./api";
import { Order } from "../types/index";

export const fetchOrders = async (searchTerm: string = ""): Promise<Order[] | null> => {
  try {
    const params: Record<string, string> = {};
    if (searchTerm.trim()) params.search = searchTerm.trim();

    const { data } = await api.get("/web/api/orders", { params });
    return data.orders || data || [];
  } catch (error) {
    console.error("Error fetching orders:", error instanceof Error ? error.message : String(error));
    return null;
  }
};

export const fetchCompletedOrdersTotal = async (): Promise<{ orderTotal: number | null; error: string | null }> => {
  try {
    const { data } = await api.get("/web/api/orders", { params: { status: "completed" } });
    const orders: any[] = data.orders || data || [];
    const orderTotal = orders.reduce((sum: number, order: any) => sum + (Number.parseFloat(order.amount) || 0), 0);
    return { orderTotal, error: null };
  } catch (error) {
    console.error("Error calculating completed orders total:", error instanceof Error ? error.message : String(error));
    return { orderTotal: null, error: error instanceof Error ? error.message : String(error) };
  }
};