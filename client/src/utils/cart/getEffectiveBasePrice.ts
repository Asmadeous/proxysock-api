import { CartItem } from "@/types";

/**
 * Resolves the effective base price for VPS/RDP cart items, applying country-specific
 * pricing when the user selects Canada.
 *
 * country_pricing in metadata can be either:
 *   - Flat:   { "Canada": 40 }                       (legacy — single price)
 *   - Nested: { "Canada": { "reseller": 40, "user": 50 } }  (role-based)
 *
 * For cart display purposes we use the "user" price from nested objects, or the flat
 * number directly. The backend PricingService authoritative calculates the final charge.
 */
const resolveCountryPrice = (entry: any): number | undefined => {
  if (entry === undefined || entry === null) return undefined;
  if (typeof entry === "number") return entry;
  if (typeof entry === "object") {
    // Return user price for display; reseller price is applied server-side
    return entry.user ?? entry.reseller ?? undefined;
  }
  return undefined;
};

export const getEffectiveBasePrice = (item: CartItem): number => {
  if (item.productType === "vps" && item.vpsPlan) {
    if (item.location?.country === "Canada" || item.location?.countryCode === "CA") {
      const canadaEntry =
        item.vpsPlan.country_pricing?.Canada ?? item.vpsPlan.country_pricing?.CA;
      const canadaPrice = resolveCountryPrice(canadaEntry);
      if (canadaPrice !== undefined) return canadaPrice;
    }
    return item.vpsPlan.price;
  } else if (item.productType === "rdp" && item.rdpPlan) {
    if (item.location?.country === "Canada" || item.location?.countryCode === "CA") {
      const canadaEntry =
        item.rdpPlan.country_pricing?.Canada ?? item.rdpPlan.country_pricing?.CA;
      const canadaPrice = resolveCountryPrice(canadaEntry);
      if (canadaPrice !== undefined) return canadaPrice;
    }
    return item.rdpPlan.price;
  }
  return 0;
};