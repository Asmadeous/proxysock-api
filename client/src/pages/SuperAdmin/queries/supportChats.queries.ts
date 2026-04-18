import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  fetchSupportChats,
  fetchSupportChat,
  replySupportChat,
  assignSupportChat,
  closeSupportChat,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface SupportChatsParams {
  statusFilter: string;
}

export function useSupportChats(params: SupportChatsParams) {
  return useQuery({
    queryKey: adminQueryKeys.supportChats.list(params),
    queryFn: () =>
      fetchSupportChats(
        params.statusFilter ? { status: params.statusFilter } : {}
      ).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useSupportChatDetail(id: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.supportChats.detail(id!),
    queryFn: () => fetchSupportChat(id!).then((r) => r.data),
    enabled: id !== null,
  });
}

export function useReplySupportChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      replySupportChat(id, message),
    onSuccess: (_data, { id }) => {
      toast.success("Reply sent");
      queryClient.invalidateQueries(adminQueryKeys.supportChats.detail(id));
      queryClient.invalidateQueries(adminQueryKeys.supportChats.all());
    },
    onError: () => toast.error("Failed to send reply"),
  });
}

export function useAssignSupportChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      employeeId,
    }: {
      id: string;
      employeeId: string;
    }) => assignSupportChat(id, employeeId),
    onSuccess: (_data, { id }) => {
      toast.success("Chat assigned");
      queryClient.invalidateQueries(adminQueryKeys.supportChats.detail(id));
      queryClient.invalidateQueries(adminQueryKeys.supportChats.all());
    },
    onError: () => toast.error("Failed to assign chat"),
  });
}

export function useCloseSupportChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeSupportChat(id),
    onSuccess: () => {
      toast.success("Chat closed");
      queryClient.invalidateQueries(adminQueryKeys.supportChats.all());
    },
    onError: () => toast.error("Failed to close chat"),
  });
}
