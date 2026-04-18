import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  fetchAdminProductCategories,
  createAdminProductCategory,
  fetchSystemInfo,
  adminCreditWallet,
  adminDebitWallet,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

export function useAdminProductCategories() {
  return useQuery({
    queryKey: adminQueryKeys.settings.categories(),
    queryFn: () => fetchAdminProductCategories().then((r) => r.data),
  });
}

export function useSystemInfo() {
  return useQuery({
    queryKey: adminQueryKeys.settings.systemInfo(),
    queryFn: () => fetchSystemInfo().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug?: string }) =>
      createAdminProductCategory(data),
    onSuccess: () => {
      toast.success("Category created");
      queryClient.invalidateQueries(adminQueryKeys.settings.categories());
    },
    onError: () => toast.error("Failed to create category"),
  });
}

interface WalletPayload {
  entity_type: string;
  email?: string;
  entity_id?: number;
  amount: number;
  description?: string;
}

export function useCreditWallet() {
  return useMutation({
    mutationFn: (data: WalletPayload) => adminCreditWallet(data),
    onSuccess: () => toast.success("Wallet credited successfully"),
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Failed to credit wallet"),
  });
}

export function useDebitWallet() {
  return useMutation({
    mutationFn: (data: WalletPayload) => adminDebitWallet(data),
    onSuccess: () => toast.success("Wallet debited successfully"),
    onError: (err: { response?: { data?: { error?: string } } }) =>
      toast.error(err.response?.data?.error ?? "Failed to debit wallet"),
  });
}
