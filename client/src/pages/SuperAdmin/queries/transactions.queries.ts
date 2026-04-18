import { useQuery } from "@tanstack/react-query";
import { fetchAdminTransactions } from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface TransactionsParams {
  entityType: string;
  per?: number;
}

export function useAdminTransactions(params: TransactionsParams) {
  return useQuery({
    queryKey: adminQueryKeys.transactions.list(params),
    queryFn: () => {
      const p: Record<string, string> = { page: "1", per: String(params.per ?? 50) };
      if (params.entityType) p.entity_type = params.entityType;
      return fetchAdminTransactions(p).then((r) => r.data);
    },
    keepPreviousData: true,
  });
}
