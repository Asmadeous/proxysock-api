import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminTickets,
  replyToTicket,
  rescueTicketOrder,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface TicketsParams {
  statusFilter: string;
}

export function useAdminTickets(params: TicketsParams) {
  return useQuery({
    queryKey: adminQueryKeys.tickets.list(params),
    queryFn: () =>
      fetchAdminTickets(
        params.statusFilter ? { status: params.statusFilter } : {}
      ).then((r) => r.data),
    keepPreviousData: true,
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      replyToTicket(id, message),
    onSuccess: () => {
      toast.success("Reply sent");
      queryClient.invalidateQueries(adminQueryKeys.tickets.all());
    },
    onError: () => toast.error("Failed to send reply"),
  });
}

export function useRescueTicketOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rescueTicketOrder(id),
    onSuccess: () => {
      toast.success("Order rescue triggered");
      queryClient.invalidateQueries(adminQueryKeys.tickets.all());
    },
    onError: () => toast.error("Failed to rescue order"),
  });
}
