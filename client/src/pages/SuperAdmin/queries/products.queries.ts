import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  syncAdminProxies,
  syncAdminEsims,
  syncAdminVPS,
  syncAdminVPN,
  syncAdminRDP,
  fetchAdminProductCategories,
  createAdminOrder,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

export function useAdminProducts() {
  return useQuery({
    queryKey: adminQueryKeys.products.list(),
    queryFn: () => fetchAdminProducts().then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminProductCategories() {
  return useQuery({
    queryKey: adminQueryKeys.settings.categories(),
    queryFn: () => fetchAdminProductCategories().then((r) => r.data),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createAdminProduct(data),
    onSuccess: () => {
      toast.success("Product created");
      queryClient.invalidateQueries(adminQueryKeys.products.all());
    },
    onError: () => toast.error("Failed to create product"),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: Record<string, unknown>;
    }) => updateAdminProduct(id, data),
    onSuccess: () => {
      toast.success("Product updated");
      queryClient.invalidateQueries(adminQueryKeys.products.all());
    },
    onError: () => toast.error("Failed to update product"),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteAdminProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries(adminQueryKeys.products.all());
    },
    onError: () => toast.error("Failed to delete product"),
  });
}

type SyncType = "proxies" | "esims" | "vps" | "vpn" | "rdp";

const SYNC_FNS: Record<SyncType, () => Promise<unknown>> = {
  proxies: syncAdminProxies,
  esims: syncAdminEsims,
  vps: syncAdminVPS,
  vpn: syncAdminVPN,
  rdp: syncAdminRDP,
};

export function useSyncProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: SyncType) => SYNC_FNS[type](),
    onSuccess: (_data, type) => {
      toast.success(`${type.toUpperCase()} sync complete`);
      queryClient.invalidateQueries(adminQueryKeys.products.all());
    },
    onError: (_err, type) => toast.error(`Failed to sync ${type}`),
  });
}

export function useAdminPurchaseProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { product_id: number; customer_email: string; quantity?: number; metadata?: Record<string, unknown> }) =>
      createAdminOrder(data),
    onSuccess: () => {
      toast.success("Order created and provisioning started");
      queryClient.invalidateQueries(adminQueryKeys.orders.all());
    },
    onError: (err: any) => toast.error(err.message || "Purchase failed"),
  });
}
