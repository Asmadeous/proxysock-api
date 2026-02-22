import { fetchUserRole } from "./user";// Fetch orders based on role
import { Order } from "../types/index"

// Supabase completely removed. Mock object to prevent compile/runtime crash.
const supabase: any = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signInWithOAuth: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    refreshSession: async () => ({ data: { session: null }, error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: async () => ({ data: [], error: null }),
        not: () => ({ order: async () => ({ data: [], error: null }) })
      }),
      order: async () => ({ data: [], error: null }),
      not: () => ({ order: async () => ({ data: [], error: null }) }),
      neq: () => ({ order: async () => ({ data: [], error: null }) })
    }),
    insert: async () => ({ error: null }),
    update: () => ({ eq: async () => ({ error: null }) })
  }),
  functions: { invoke: async () => ({ data: null, error: null }) },
  channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
  removeChannel: async () => {}
};



export const fetchOrders = async (searchTerm: string = ''): Promise<Order[] | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found");

    const role = await fetchUserRole();
    if (!role) throw new Error("User role not found");

    let query = supabase
      .from('orders')
      .select(`
          id,
          user_id,
          proxy_plan_id,
          proxy_id,
          api_order_id,
          amount,
          currency,
          status,
          transaction_id,
          created_at,
          updated_at,
          credentials,
          cart_items
        `);

    if (role === 'user') {
      query = query.eq('user_id', user.id); // Filter by user ID for 'user' role
    } else if (role === 'admin' && searchTerm.trim()) {
      // For admin, apply search filters (e.g., on api_order_id, user_id, or status)
      query = query.or(
        `api_order_id.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%`
      );
    }
    // For admin with no search term, fetch all orders

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

export const fetchCompletedOrdersTotal = async (): Promise<{ orderTotal: number | null, error: string | null }> => {
  try {
    // Query only completed orders and calculate their sum
    const { data, error } = await supabase
      .from('orders')
      .select('amount, currency')
      .eq('status', 'completed');

    if (error) throw error;

    if (!data || data.length === 0) {
      return { orderTotal: 0, error: null }; // Return 0 if no completed orders
    }

    // Sum up the amounts from all completed orders
    const orderTotal = data.reduce((sum: number, order: any) => sum + (Number.parseFloat(order.amount) || 0), 0);

    return { orderTotal, error: null };
  } catch (error) {
    console.error('Error calculating completed orders total:', error instanceof Error ? error.message : String(error));
    return { orderTotal: null, error: error instanceof Error ? error.message : String(error) };
  }
};