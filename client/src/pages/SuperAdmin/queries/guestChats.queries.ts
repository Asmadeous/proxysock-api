import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  fetchGuestChats,
  fetchGuestChat,
  replyGuestChat,
  assignGuestChat,
  closeGuestChat,
  fetchEmployees,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface GuestChatsParams {
  statusFilter: string;
}

export function useGuestChats(params: GuestChatsParams) {
  return useQuery({
    queryKey: adminQueryKeys.guestChats.list(params),
    queryFn: () =>
      fetchGuestChats(
        params.statusFilter ? { status: params.statusFilter } : {}
      ).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useGuestChatDetail(id: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.guestChats.detail(id!),
    queryFn: () => fetchGuestChat(id!).then((r) => r.data),
    enabled: id !== null,
  });
}

export function useChatEmployees() {
  return useQuery({
    queryKey: adminQueryKeys.employees.list({}),
    queryFn: () => fetchEmployees({}).then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });
}

export function useReplyGuestChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      replyGuestChat(id, message),
    onSuccess: (_data, { id }) => {
      toast.success("Reply sent");
      queryClient.invalidateQueries(adminQueryKeys.guestChats.detail(id));
      queryClient.invalidateQueries(adminQueryKeys.guestChats.all());
    },
    onError: () => toast.error("Failed to send reply"),
  });
}

export function useAssignGuestChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      employeeId,
    }: {
      id: string;
      employeeId: string;
    }) => assignGuestChat(id, employeeId),
    onSuccess: (_data, { id }) => {
      toast.success("Chat assigned");
      queryClient.invalidateQueries(adminQueryKeys.guestChats.detail(id));
      queryClient.invalidateQueries(adminQueryKeys.guestChats.all());
    },
    onError: () => toast.error("Failed to assign chat"),
  });
}

export function useCloseGuestChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeGuestChat(id),
    onSuccess: () => {
      toast.success("Chat closed");
      queryClient.invalidateQueries(adminQueryKeys.guestChats.all());
    },
    onError: () => toast.error("Failed to close chat"),
  });
}
