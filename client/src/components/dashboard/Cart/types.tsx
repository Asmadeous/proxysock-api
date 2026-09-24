import { ISP } from "@/types";

export interface ESIMPackage {
  id: string;
  package_code: string;
  slug: string;
  name: string;
  price: number;
  currency_code: string;
  volume: number;
  duration: number;
  duration_unit: string;
  location_code: string;
  location_name: string;
  description: string;
  data_type: number;
  sms_status: number;
  speed?: string;
  network?: string;
  is_active: boolean;
}

export interface VPSPlan {
  id: string;
  plan_id: number;
  name: string;
  slug: string;
  price: number;
  currency_code: string;
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  bandwidth_gb: number;
  service_type: "residential" | "standard";
  is_active: boolean;
  country_pricing?: Record<string, number>;
}

export interface RDPPlan {
  service_type: string;
  id: string;
  plan_id: number;
  name: string;
  slug: string;
  price: number;
  currency_code: string;
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  concurrent_users: number;
  session_duration_hours: number;
  os_templates?: string[];
  features?: string[];
  locations?: string[];
  is_active: boolean;
  country_pricing?: Record<string, number>;
}

export interface VPNPlan {
  id: string;
  plan_id: number;
  name: string;
  price: number;
  currency_code: string;
  features?: string[];
  locations?: string[];
  is_active: boolean;
  isp?: ISP[];
}
