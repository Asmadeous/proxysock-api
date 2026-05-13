import { useQueries } from "@tanstack/react-query";
import {
  fetchAdminUsers,
  fetchAdminOrders,
  fetchAdminTransactions,
  fetchAffiliates,
  fetchAdminTickets,
  fetchSupportChats,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

export function useOverviewStats() {
  const results = useQueries({
    queries: [
      {
        queryKey: adminQueryKeys.users.list({ per: "1" }),
        queryFn: () => fetchAdminUsers({ per: "1" }).then((r) => r.data),
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: adminQueryKeys.orders.list({ per: "5" }),
        queryFn: () => fetchAdminOrders({ per: "5" }).then((r) => r.data),
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: adminQueryKeys.transactions.list({}),
        queryFn: () => fetchAdminTransactions().then((r) => r.data),
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: adminQueryKeys.affiliates.list({ per: "1" }),
        queryFn: () => fetchAffiliates({ per: "1" }).then((r) => r.data),
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: adminQueryKeys.tickets.list({ statusFilter: "open" }),
        queryFn: () => fetchAdminTickets({ status: "open" }).then((r) => r.data),
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: adminQueryKeys.supportChats.list({ statusFilter: "open" }),
        queryFn: () => fetchSupportChats({ status: "open" }).then((r) => r.data),
        staleTime: 1000 * 60 * 2,
      },
    ],
  });

  const [usersQ, ordersQ, txQ, affQ, ticketsQ, supportChatsQ] = results;
  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  const txData = Array.isArray(txQ.data?.transactions)
    ? txQ.data.transactions
    : Array.isArray(txQ.data)
    ? txQ.data
    : [];

  const totalRevenue = txData
    .filter((t: { status: string }) => t.status === "success")
    .reduce((sum: number, t: { amount?: number }) => sum + Number(t.amount ?? 0), 0);

  const ordersData = ordersQ.data ?? { orders: [], stats: {}, total: 0 };

  const ticketsData = Array.isArray(ticketsQ.data?.tickets)
    ? ticketsQ.data.tickets
    : Array.isArray(ticketsQ.data)
    ? ticketsQ.data
    : [];

  const supportChatsData = Array.isArray(supportChatsQ.data?.chats)
    ? supportChatsQ.data.chats
    : Array.isArray(supportChatsQ.data)
    ? supportChatsQ.data
    : [];

  return {
    isLoading,
    isError,
    stats: {
      users: usersQ.data?.total ?? 0,
      orders: ordersData.total ?? 0,
      revenue: totalRevenue,
      transactions: txData.length,
      affiliates: affQ.data?.total ?? 0,
      failedOrders: ordersData.stats?.failed ?? 0,
      pendingOrders: ordersData.stats?.pending ?? 0,
      openTickets: ticketsData.length,
      openSupportChats: supportChatsData.length,
    },
    recentOrders: ordersData.orders ?? [],
  };
}
