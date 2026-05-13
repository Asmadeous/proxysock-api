import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardAnalytics,
  fetchRevenueAnalytics,
  fetchProductAnalytics,
  fetchConversionAnalytics,
  fetchGeolocationAnalytics,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface AnalyticsParams {
  startDate: string;
}

export interface DashboardMetrics {
  total_revenue: number;
  total_orders: number;
  new_users: number;
  avg_order_value: number;
}
export interface DashboardAnalyticsResponse {
  metrics: DashboardMetrics;
}
export interface TopProduct extends Record<string, unknown> { name: string; revenue: number }
export interface TypeBreakdown extends Record<string, unknown> { type: string; revenue: number }
export interface ProductAnalyticsResponse {
  top_products: TopProduct[];
  type_breakdown: TypeBreakdown[];
}
export interface RevenuePeriod { period: string; total: number }
export interface RevenueAnalyticsResponse {
  data: RevenuePeriod[];
}
export interface FunnelStage { stage: string; count: number }
export interface ConversionAnalyticsResponse {
  funnel: FunnelStage[];
  conversion_rate: number;
  repeat_rate: number;
}
export interface GeoCountry { country: string; users: number }
export interface GeolocationAnalyticsResponse {
  countries: GeoCountry[];
  total_countries: number;
}

export function useDashboardAnalytics(params: AnalyticsParams) {
  return useQuery<DashboardAnalyticsResponse>({
    queryKey: adminQueryKeys.analytics.dashboard(params),
    queryFn: () =>
      fetchDashboardAnalytics({ start_date: params.startDate }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRevenueAnalytics(params: AnalyticsParams) {
  return useQuery<RevenueAnalyticsResponse>({
    queryKey: adminQueryKeys.analytics.revenue(params),
    queryFn: () =>
      fetchRevenueAnalytics({ start_date: params.startDate }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProductAnalytics(params: AnalyticsParams) {
  return useQuery<ProductAnalyticsResponse>({
    queryKey: adminQueryKeys.analytics.products(params),
    queryFn: () =>
      fetchProductAnalytics({ start_date: params.startDate }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useConversionAnalytics(params: AnalyticsParams) {
  return useQuery<ConversionAnalyticsResponse>({
    queryKey: adminQueryKeys.analytics.conversions(params),
    queryFn: () =>
      fetchConversionAnalytics({ start_date: params.startDate }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useGeolocationAnalytics() {
  return useQuery<GeolocationAnalyticsResponse>({
    queryKey: adminQueryKeys.analytics.geolocation(),
    queryFn: () => fetchGeolocationAnalytics().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });
}
