type QuantityItem = {
  productType: string;
  quantity?: number;
  usaEsimPlan?: { moq?: unknown } | null;
};

export function getMinimumQuantity(item: QuantityItem): number {
  const minimum = Number(item.productType === 'usa-esim' ? item.usaEsimPlan?.moq : 1);
  return Number.isFinite(minimum) && minimum > 0 ? Math.ceil(minimum) : 1;
}

export function normalizeEsimQuantity(item: QuantityItem): number {
  const quantity = Number(item.quantity);
  return Math.max(
    getMinimumQuantity(item),
    Number.isFinite(quantity) ? Math.floor(quantity) : 1,
  );
}
