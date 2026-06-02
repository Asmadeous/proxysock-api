import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchAdminProfile, updateAdminProfile } from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

export function useAdminProfile() {
  return useQuery({
    queryKey: adminQueryKeys.profile.me(),
    queryFn: () => fetchAdminProfile().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown> | FormData) =>
      updateAdminProfile(data),
    onSuccess: (res) => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries(adminQueryKeys.profile.me());
      // Also update localStorage so sidebar reflects changes
      if (res.data?.employee) {
        const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
        const updated = { ...adminUser, ...res.data.employee };
        localStorage.setItem("adminUser", JSON.stringify(updated));
        window.dispatchEvent(new Event("admin-user-updated"));
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update profile");
    },
  });
}
