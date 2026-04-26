import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchResellers,
  fetchResellerDetail,
  createReseller,
  updateReseller,
  deleteReseller,
  onboardReseller,
  configureReseller,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface ResellersParams {
  page: number;
  search: string;
  typeFilter: string;
  per?: number;
}

export function useAdminResellers(params: ResellersParams) {
  return useQuery({
    queryKey: adminQueryKeys.resellers.list(params),
    queryFn: () => {
      const p: Record<string, string> = {
        page: String(params.page),
        per: String(params.per ?? 25),
      };
      if (params.search) p.q = params.search;
      if (params.typeFilter) p.type = params.typeFilter;
      return fetchResellers(p).then((r) => r.data);
    },
    keepPreviousData: true,
  });
}

export function useResellerDetail(id: string | number | null) {
  return useQuery({
    queryKey: adminQueryKeys.resellers.detail(id!),
    queryFn: () => fetchResellerDetail(id!).then((r) => r.data),
    enabled: id !== null,
  });
}

const apiError = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string; error?: string; errors?: Record<string, string[]> } } };
  const data = e?.response?.data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.errors) return Object.values(data.errors).flat().join(", ");
  return fallback;
};

export function useCreateReseller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createReseller(data),
    onSuccess: () => {
      toast.success("Reseller created");
      queryClient.invalidateQueries(adminQueryKeys.resellers.all());
    },
    onError: (err) => toast.error(apiError(err, "Failed to create reseller")),
  });
}

export function useUpdateReseller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: Record<string, unknown>;
    }) => updateReseller(id, data),
    onSuccess: () => {
      toast.success("Reseller updated");
      queryClient.invalidateQueries(adminQueryKeys.resellers.all());
    },
    onError: (err) => toast.error(apiError(err, "Failed to update reseller")),
  });
}

export function useDeleteReseller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteReseller(id),
    onSuccess: () => {
      toast.success("Reseller deleted");
      queryClient.invalidateQueries(adminQueryKeys.resellers.all());
    },
    onError: (err) => toast.error(apiError(err, "Failed to delete reseller")),
  });
}

export function useOnboardReseller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => onboardReseller(id),
    onSuccess: () => {
      toast.success("Reseller onboarded");
      queryClient.invalidateQueries(adminQueryKeys.resellers.all());
    },
    onError: (err) => toast.error(apiError(err, "Failed to onboard reseller")),
  });
}

export function useConfigureReseller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: Record<string, unknown>;
    }) => configureReseller(id, data),
    onSuccess: (_data, { id }) => {
      toast.success("Reseller configured");
      queryClient.invalidateQueries(adminQueryKeys.resellers.detail(id));
      queryClient.invalidateQueries(adminQueryKeys.resellers.all());
    },
    onError: (err) => toast.error(apiError(err, "Failed to configure reseller")),
  });
}
