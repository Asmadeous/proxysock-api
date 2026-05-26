import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminTickets,
  replyToTicket,
  rescueTicketOrder,
  updateTicketStatus,
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

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateTicketStatus(id, status),
    onSuccess: () => {
      toast.success("Ticket status updated");
      queryClient.invalidateQueries(adminQueryKeys.tickets.all());
      window.dispatchEvent(new Event('refreshAdminCounts'));
    },
    onError: () => toast.error("Failed to update ticket status"),
  });
}
