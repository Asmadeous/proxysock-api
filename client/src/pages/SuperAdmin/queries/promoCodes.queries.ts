import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import adminApi from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface PromoCodePayload {
  code?: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  expires_at: string | null;
  active: boolean;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  description: string | null;
}

interface PromoCodesParams {
  search: string;
}

export function useAdminPromoCodes(params: PromoCodesParams) {
  return useQuery({
    queryKey: adminQueryKeys.promoCodes.list(params),
    queryFn: () =>
      adminApi
        .get("/promo_codes", { params: params.search ? { q: params.search } : {} })
        .then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useCreatePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PromoCodePayload) => adminApi.post("/promo_codes", data),
    onSuccess: () => {
      toast.success("Promo code created");
      queryClient.invalidateQueries(adminQueryKeys.promoCodes.all());
    },
    onError: (err: { response?: { data?: { errors?: string[] } } }) =>
      toast.error(err.response?.data?.errors?.join(", ") ?? "Failed to create"),
  });
}

export function useUpdatePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PromoCodePayload }) =>
      adminApi.patch(`/promo_codes/${id}`, data),
    onSuccess: () => {
      toast.success("Promo code updated");
      queryClient.invalidateQueries(adminQueryKeys.promoCodes.all());
    },
    onError: (err: { response?: { data?: { errors?: string[] } } }) =>
      toast.error(err.response?.data?.errors?.join(", ") ?? "Failed to update"),
  });
}

export function useDeletePromoCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.delete(`/promo_codes/${id}`),
    onSuccess: () => {
      toast.success("Promo code deleted");
      queryClient.invalidateQueries(adminQueryKeys.promoCodes.all());
    },
    onError: () => toast.error("Failed to delete promo code"),
  });
}
