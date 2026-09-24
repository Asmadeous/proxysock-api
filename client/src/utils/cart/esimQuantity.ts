type QuantityItem = {
  productType: string;
  quantity?: number;
  deviceDetails?: unknown;
};

// A US phone-number line is activated on one phone, so its quantity is always 1.
export const isFixedQuantity = (item: QuantityItem) => item.productType === 'usa-esim';

export function normalizeEsimQuantity(item: QuantityItem): number {
  if (isFixedQuantity(item)) return 1;
  const quantity = Number(item.quantity);
  return Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1;
}

// US lines saved before device details were required cannot be ordered.
export const isOrderableCartItem = (item: QuantityItem) =>
  item.productType !== 'usa-esim' || !!item.deviceDetails;
