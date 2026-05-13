import { useQuery } from "@tanstack/react-query";
import {
  fetchAuditLogs,
  fetchSystemLogs,
  fetchErrorLogs,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface SystemLogParams {
  search: string;
  source: string;
  lineCount: string;
}

interface AuditLogParams {
  page: number;
  per: number;
  actionFilter: string;
  typeFilter: string;
}

interface ErrorLogParams {
  lines: string;
}

export function useSystemLogs(params: SystemLogParams, refetchInterval?: number | false) {
  return useQuery({
    queryKey: adminQueryKeys.logs.system(params),
    queryFn: () => {
      const p: Record<string, string> = { lines: params.lineCount, source: params.source };
      if (params.search) p.search = params.search;
      return fetchSystemLogs(p).then((r) => r.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 30,
    refetchInterval: refetchInterval ?? false,
  });
}

export function useAuditLogs(params: AuditLogParams) {
  return useQuery({
    queryKey: adminQueryKeys.logs.audit(params),
    queryFn: () => {
      const p: Record<string, string> = {
        page: String(params.page),
        per: String(params.per),
      };
      if (params.actionFilter) p.action_filter = params.actionFilter;
      if (params.typeFilter) p.auditable_type = params.typeFilter;
      return fetchAuditLogs(p).then((r) => r.data);
    },
    keepPreviousData: true,
    staleTime: 1000 * 30,
  });
}

export function useErrorLogs(params: ErrorLogParams) {
  return useQuery({
    queryKey: adminQueryKeys.logs.errors(params),
    queryFn: () => fetchErrorLogs({ lines: params.lines }).then((r) => r.data),
    keepPreviousData: true,
    staleTime: 1000 * 30,
  });
}
