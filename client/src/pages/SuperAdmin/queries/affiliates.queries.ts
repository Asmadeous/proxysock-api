import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAffiliates,
  deleteAffiliate,
  configureAffiliate,
  createAffiliate,
  fetchAffiliatePayouts,
  processAffiliatePayout,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface AffiliatesParams {
  search: string;
}

export function useAdminAffiliates(params: AffiliatesParams) {
  return useQuery({
    queryKey: adminQueryKeys.affiliates.list(params),
    queryFn: () =>
      fetchAffiliates(params.search ? { q: params.search } : {}).then(
        (r) => r.data
      ),
    keepPreviousData: true,
  });
}

export function useAdminAffiliatePayouts() {
  return useQuery({
    queryKey: adminQueryKeys.affiliatePayouts.list(),
    queryFn: () => fetchAffiliatePayouts().then((r) => r.data),
  });
}

export function useCreateAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createAffiliate(data),
    onSuccess: () => {
      toast.success("Affiliate created");
      queryClient.invalidateQueries(adminQueryKeys.affiliates.all());
    },
    onError: () => toast.error("Failed to create affiliate"),
  });
}

export function useDeleteAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAffiliate(id),
    onSuccess: () => {
      toast.success("Affiliate deleted");
      queryClient.invalidateQueries(adminQueryKeys.affiliates.all());
    },
    onError: () => toast.error("Failed to delete affiliate"),
  });
}

export function useConfigureAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Record<string, unknown>;
    }) => configureAffiliate(id, data),
    onSuccess: () => {
      toast.success("Affiliate configured");
      queryClient.invalidateQueries(adminQueryKeys.affiliates.all());
    },
    onError: () => toast.error("Failed to configure affiliate"),
  });
}

export function useProcessAffiliatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => processAffiliatePayout(id),
    onSuccess: () => {
      toast.success("Payout processed");
      queryClient.invalidateQueries(adminQueryKeys.affiliatePayouts.all());
    },
    onError: () => toast.error("Failed to process payout"),
  });
}
