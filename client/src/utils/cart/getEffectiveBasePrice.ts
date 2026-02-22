import { CartItem } from "@/pages/UserDashboard/Cart"

export const getEffectiveBasePrice = (item: CartItem): number => {
    if (item.productType === "vps" && item.vpsPlan) {
      if (item.location?.country === "Canada" || item.location?.countryCode === "CA") {
        const canadaPrice = item.vpsPlan.country_pricing?.Canada ?? item.vpsPlan.country_pricing?.CA
        if (canadaPrice !== undefined) {
          return Number(canadaPrice)
        }
      }
      return item.vpsPlan.price
    } else if (item.productType === "rdp" && item.rdpPlan) {
      if (item.location?.country === "Canada" || item.location?.countryCode === "CA") {
        const canadaPrice = item.rdpPlan.country_pricing?.Canada ?? item.rdpPlan.country_pricing?.CA
        if (canadaPrice !== undefined) {
          return Number(canadaPrice)
        }
      }
      return item.rdpPlan.price
    }
    return 0
  }