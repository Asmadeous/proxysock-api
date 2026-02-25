import { CartItem } from "@/pages/UserDashboard/Cart";

export const formatDataVolume = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
};

export const formatDuration = (duration: number, unit: string) => {
  if (duration === 1) {
    return `1 ${unit.toLowerCase().slice(0, -1)}`;
  }
  return `${duration} ${unit.toLowerCase()}`;
};

export const formatCartItems = (cartItems: CartItem[]) => {
  return cartItems.map((item) => {
    if (item.productType === "esim" && item.esimPackage) {
      const scaledPrice = Number(item.esimPackage.price);
      return {
        productType: "esim",
        esimPackage: {
          package_code: item.esimPackage.package_code || "",
          slug: item.esimPackage.slug || "",
          price: scaledPrice,
          name: item.esimPackage.name || "Unknown eSIM Plan",
          location_name: item.esimPackage.location_name || "",
          currency_code: item.esimPackage.currency_code || "USD",
        },
        quantity: item.quantity || 1,
      };
    } else if (item.productType === "proxy" && item.plan) {
      const planIdentifier = item.plan.is_owned
        ? item.plan.billing_id || String(item.plan.id)
        : String(item.plan.id);
      return {
        productType: "proxy",
        product: planIdentifier,
        planName:
          item.plan.display_name || item.plan.name || "Unknown Proxy Plan",
        period: item.period || 1,
        protocol: item.protocol || "http",
        locations: item.locations?.city?.id
          ? [String(item.locations.city.id)]
          : item.locations?.isp?.id
            ? [String(item.locations.isp.id)]
            : ["1"],
        billing_plan_id: item.plan.is_owned
          ? item.plan.billing_id || item.plan.id
          : undefined,
        quantity:
          item.plan.is_owned && item.plan.billing_type === "usage_gb"
            ? item.period
            : undefined,
        plan: {
          id: planIdentifier,
          name:
            item.plan.display_name || item.plan.name || "Unknown Proxy Plan",
          price: item.plan.price || 0,
          currency: item.plan.currency || "USD",
          is_owned: item.plan.is_owned || false,
          billing_type: item.plan.billing_type,
          gb_included: item.plan.gb_included,
          price_per_day: item.plan.price_per_day,
          price_per_gb: item.plan.price_per_gb,
          base_price: item.plan.base_price,
          source_table: item.plan.source_table,
          billing_id: item.plan.is_owned
            ? item.plan.billing_id || String(item.plan.id)
            : undefined,
          duration_days: item.plan.duration_days,
          gb_limit: item.plan.gb_limit,
          features: item.plan.features,
          description: item.plan.description,
          gb_min: item.plan.gb_min,
          gb_max: item.plan.gb_max,
          ips_included: item.plan.ips_included,
        },
      };
    } else if (item.productType === "residential" && item.plan) {
      return {
        productType: "residential",
        product: String(item.plan.id),
        planName:
          item.plan.display_name || item.plan.name || "Residential Rotating",
        period: item.period || 1,
        protocol: item.protocol || "http",
        locations: ["1"],
        quantity: item.period || 1,
        plan: {
          id: String(item.plan.id),
          name:
            item.plan.display_name || item.plan.name || "Residential Rotating",
          price: item.plan.price || 0,
          currency: item.plan.currency || "USD",
          billing_type: "usage_gb",
          gb_min: item.plan.gb_min,
          gb_max: item.plan.gb_max,
        },
      };
    } else if (item.productType === "vps" && item.vpsPlan) {
      return {
        productType: "vps",
        vpsPlan: {
          plan_id: item.vpsPlan.plan_id || 0,
          id: item.vpsPlan.id || "",
          name: item.vpsPlan.name || "Unknown VPS Plan",
          price: item.vpsPlan.price || 0,
          currency_code: item.vpsPlan.currency_code || "USD",
        },
        os_template: item.osTemplate || "ubuntu-20.04",
        hostname:
          item.hostname || `vps-${Math.random().toString(36).substring(2, 8)}`,
        duration: item.duration || 1,
        management_type: item.managementType || "unmanaged",
        location: item.location || null,
        plan_id: item.vpsPlan.plan_id || 0,
        effective_base_price: item.effective_base_price,
      };
    } else if (item.productType === "rdp" && item.rdpPlan) {
      return {
        productType: "rdp",
        plan_id: item.rdpPlan.plan_id || 0,
        price: item.rdpPlan.price || 0,
        service_type: item.rdpPlan.service_type || "standard",
        os_template: item.osTemplate || "windows-2019",
        hostname:
          item.hostname || `rdp-${Math.random().toString(36).substring(2, 8)}`,
        rdp_username: item.rdpUsername || "Administrator",
        duration: item.duration || 1,
        management_type: item.managementType || "unmanaged",
        location: item.location || null,
        rdpPlan: {
          id: item.rdpPlan.id || "",
          name: item.rdpPlan.name || "Unknown RDP Plan",
          currency_code: item.rdpPlan.currency_code || "USD",
          plan_id: item.rdpPlan.plan_id || 0,
          price: item.rdpPlan.price || 0,
          service_type: item.rdpPlan.service_type || "standard",
        },
        effective_base_price: item.effective_base_price,
      };
    } else if (item.productType === "usa-esim" && item.usaEsimPlan) {
      return {
        productType: "usa-esim",
        usaEsimPlan: {
          id: item.usaEsimPlan.id,
          provider: item.usaEsimPlan.provider,
          name: item.usaEsimPlan.name,
          price: item.usaEsimPlan.price / 100,
          currency_code: item.usaEsimPlan.currency_code,
        },
        quantity: item.quantity || 1,
      };
    } else if (item.productType === "vpn" && item.vpnPlan) {
      return {
        productType: "vpn",
        vpnPlan: {
          id: item.vpnPlan.id,
          plan_id: item.vpnPlan.plan_id,
          name: item.vpnPlan.name,
          price: item.vpnPlan.price,
          currency_code: item.vpnPlan.currency_code,
        },
        period: item.period,
        locations: item.locations?.city?.id || item.locationId || "1",
      };
    }
  });
};
