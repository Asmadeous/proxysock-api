export const VPN_PLAN_IDS = [141, 142, 143, 144, 145, 146, 147];

export const isVPNPlan = (planId: number): boolean => {
  return VPN_PLAN_IDS.includes(planId);
};
