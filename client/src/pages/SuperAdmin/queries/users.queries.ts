import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  fetchAdminUsers,
  deleteAdminUser,
  updateAdminUser,
  onboardUser,
  impersonateUser,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface UsersParams {
  page: number;
  search: string;
  per?: number;
}

export function useAdminUsers(params: UsersParams) {
  return useQuery({
    queryKey: adminQueryKeys.users.list(params),
    queryFn: () =>
      fetchAdminUsers({
        page: String(params.page),
        per: String(params.per ?? 25),
        ...(params.search ? { q: params.search } : {}),
      }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAdminUser(id),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries(adminQueryKeys.users.all());
    },
    onError: () => toast.error("Failed to delete user"),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateAdminUser(id, data),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries(adminQueryKeys.users.all());
    },
    onError: () => toast.error("Failed to update user"),
  });
}

export function useOnboardUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => onboardUser(id),
    onSuccess: () => {
      toast.success("User onboarded");
      queryClient.invalidateQueries(adminQueryKeys.users.all());
    },
    onError: () => toast.error("Failed to onboard user"),
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: (id: number) => impersonateUser(id).then((r) => r.data),
    onSuccess: (data) => {
      localStorage.setItem("impersonateToken", data.token);
      toast.success("Impersonating user — open a new tab");
    },
    onError: () => toast.error("Failed to impersonate user"),
  });
}
