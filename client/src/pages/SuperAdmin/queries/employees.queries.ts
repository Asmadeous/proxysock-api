import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  assignTickets,
  revokeEmployeeTokens,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface EmployeesParams {
  search: string;
}

export function useAdminEmployees(params: EmployeesParams) {
  return useQuery({
    queryKey: adminQueryKeys.employees.list(params),
    queryFn: () =>
      fetchEmployees(params.search ? { q: params.search } : {}).then(
        (r) => r.data
      ),
    keepPreviousData: true,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createEmployee(data),
    onSuccess: () => {
      toast.success("Employee created");
      queryClient.invalidateQueries(adminQueryKeys.employees.all());
    },
    onError: () => toast.error("Failed to create employee"),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Record<string, unknown> | FormData;
    }) => updateEmployee(id, data),
    onSuccess: (_data, { id }) => {
      toast.success("Employee updated");
      queryClient.invalidateQueries(adminQueryKeys.employees.all());
      return id;
    },
    onError: () => toast.error("Failed to update employee"),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      toast.success("Employee deactivated");
      queryClient.invalidateQueries(adminQueryKeys.employees.all());
    },
    onError: () => toast.error("Failed to deactivate employee"),
  });
}

export function useAssignTickets() {
  return useMutation({
    mutationFn: ({ id, ticketIds }: { id: number; ticketIds: number[] }) =>
      assignTickets(id, ticketIds),
    onSuccess: () => toast.success("Tickets assigned"),
    onError: () => toast.error("Failed to assign tickets"),
  });
}

export function useRevokeEmployeeTokens() {
  return useMutation({
    mutationFn: (id: number) => revokeEmployeeTokens(id),
    onSuccess: () => toast.success("Tokens revoked"),
    onError: () => toast.error("Failed to revoke tokens"),
  });
}
