type QuantityItem = {
  productType: string;
  quantity?: number;
  deviceDetails?: unknown;
  usaEsimPlan?: { requires_imei?: boolean };
};

// A phone-number line (US or UK) is activated on one phone, so its quantity is always 1.
export const isFixedQuantity = (item: QuantityItem) => item.productType === 'usa-esim';

export function normalizeEsimQuantity(item: QuantityItem): number {
  if (isFixedQuantity(item)) return 1;
  const quantity = Number(item.quantity);
  return Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1;
}

// Lines that need the phone's IMEI/EID can't be ordered without them (e.g. US lines
// saved before device details were required). UK lines need none.
export const isOrderableCartItem = (item: QuantityItem) =>
  item.productType !== 'usa-esim' || !!item.deviceDetails || item.usaEsimPlan?.requires_imei === false;
