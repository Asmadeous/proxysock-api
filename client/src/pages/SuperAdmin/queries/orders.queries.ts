import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminOrders,
  rescueOrder,
  refundOrder,
  renewOrder,
  reorderOrder,
  fetchOrderCredentials,
  updateProxyCredentials,
  rotateProxyIp,
  changeProxyProtocol,
  whitelistAdd,
  whitelistDelete,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface OrdersParams {
  page: number;
  search: string;
  status: string;
  entityType: string;
  productType: string;
  per?: number;
}

export function useAdminOrders(params: OrdersParams) {
  return useQuery({
    queryKey: adminQueryKeys.orders.list(params),
    queryFn: () => {
      const p: Record<string, string> = {
        page: String(params.page),
        per: String(params.per ?? 25),
      };
      if (params.search) p.q = params.search;
      if (params.status) p.status = params.status;
      if (params.entityType) p.entity_type = params.entityType;
      if (params.productType) p.product_type = params.productType;
      return fetchAdminOrders(p).then((r) => r.data);
    },
    keepPreviousData: true,
  });
}

export function useOrderCredentials(orderId: number | null) {
  return useQuery({
    queryKey: adminQueryKeys.orders.credentials(orderId!),
    queryFn: () => fetchOrderCredentials(orderId!).then((r) => r.data),
    enabled: orderId !== null,
  });
}

export function useRescueOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rescueOrder(id),
    onSuccess: () => {
      toast.success("Rescue triggered");
      queryClient.invalidateQueries(adminQueryKeys.orders.all());
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Rescue failed"),
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      method,
    }: {
      id: number;
      method: "wallet" | "original";
    }) => refundOrder(id, { refund_method: method }),
    onSuccess: (_data, { method }) => {
      toast.success(
        `Refunded via ${method === "original" ? "original payment" : "wallet"}`
      );
      queryClient.invalidateQueries(adminQueryKeys.orders.all());
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Refund failed"),
  });
}

export function useUpdateProxyCredentials(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { username?: string; password?: string }) =>
      updateProxyCredentials(orderId, data),
    onSuccess: () => {
      toast.success("Credentials updated");
      queryClient.invalidateQueries(adminQueryKeys.orders.credentials(orderId));
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Action failed"),
  });
}

export function useRotateProxyIp(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rotateProxyIp(orderId),
    onSuccess: () => {
      toast.success("IP rotation triggered");
      queryClient.invalidateQueries(adminQueryKeys.orders.credentials(orderId));
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Action failed"),
  });
}

export function useChangeProxyProtocol(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (protocol: string) => changeProxyProtocol(orderId, protocol),
    onSuccess: (_data, protocol) => {
      toast.success(`Protocol changed to ${protocol}`);
      queryClient.invalidateQueries(adminQueryKeys.orders.credentials(orderId));
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Action failed"),
  });
}

export function useWhitelistAdd(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ip: string) => whitelistAdd(orderId, ip),
    onSuccess: () => {
      toast.success("IP added to whitelist");
      queryClient.invalidateQueries(adminQueryKeys.orders.credentials(orderId));
      queryClient.invalidateQueries(adminQueryKeys.orders.all());
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Action failed"),
  });
}

export function useWhitelistDelete(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ip: string) => whitelistDelete(orderId, ip),
    onSuccess: () => {
      toast.success("IP removed from whitelist");
      queryClient.invalidateQueries(adminQueryKeys.orders.credentials(orderId));
      queryClient.invalidateQueries(adminQueryKeys.orders.all());
    },
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Action failed"),
  });
}

export function useRenewOrder(orderId: number) {
  return useMutation({
    mutationFn: () => renewOrder(orderId),
    onSuccess: () => toast.success("Order renewed"),
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Action failed"),
  });
}

export function useReorderOrder(orderId: number) {
  return useMutation({
    mutationFn: () => reorderOrder(orderId),
    onSuccess: () => toast.success("Reorder created"),
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Action failed"),
  });
}
