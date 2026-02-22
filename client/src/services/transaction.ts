
import { fetchUserRole } from "./user";
import { Transaction } from "../types/index";

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


export const fetchTransactions = async (): Promise<Transaction[] | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found");

    const role = await fetchUserRole();
    if (!role) throw new Error("User role not found");

    let query = supabase
      .from('transactions')
      .select(`
        id,
        order_id,
        user_id,
        payment_id,
        amount,
        currency,
        payment_status,
        payment_method,
        created_at,
        updated_at
      `);

    if (role === 'user') {
      query = query.eq('user_id', user.id); // Filter by user ID for 'user' role
    }
    // For 'admin' role, no filter is applied, fetching all transactions

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error instanceof Error ? error.message : String(error));
    return null;
  }
};