// Device details MeiSIM needs for US phone-number lines. Rules mirror the
// backend's MeisimDeviceDetails so customers see errors before paying.

export interface DeviceAddress {
  address_line_1: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface DeviceDetails {
  imei: string;
  eid?: string;
  address?: DeviceAddress;
}

export type DeviceDetailsErrors = Partial<Record<"imei" | "eid" | keyof DeviceAddress, string>>;

// Phones display these grouped with spaces, e.g. "35 092338 941642 0".
export const normalizeDigits = (value: string) => value.replace(/[\s-]/g, "");

export function validateDeviceDetails(
  input: { imei: string; eid: string; address: DeviceAddress },
  requiresEid: boolean,
  requiresAddress = false,
): { errors: DeviceDetailsErrors; details?: DeviceDetails } {
  const errors: DeviceDetailsErrors = {};
  const imei = normalizeDigits(input.imei);
  const eid = normalizeDigits(input.eid);

  if (!/^\d{15}$/.test(imei)) errors.imei = "IMEI must be exactly 15 digits";
  if (requiresEid && !/^\d{32}$/.test(eid)) errors.eid = "EID must be exactly 32 digits";

  const address = {
    address_line_1: input.address.address_line_1.trim(),
    city: input.address.city.trim(),
    state: input.address.state.trim().toUpperCase(),
    zip_code: input.address.zip_code.trim(),
  };
  const hasAddress = Object.values(address).some(Boolean);
  if (hasAddress || requiresAddress) {
    if (!/^\d+\s+\S/.test(address.address_line_1)) errors.address_line_1 = "Start with the street number, e.g. 120 Main St";
    else if (/\b(P\.?\s*O\.?\s*Box|Post\s+Office\s+Box|PMB)\b/i.test(address.address_line_1)) errors.address_line_1 = "A PO Box or mailbox can't be used for 911; enter a street address";
    if (address.city.length < 2) errors.city = "Enter the city";
    if (!/^[A-Z]{2}$/.test(address.state)) errors.state = "Use the 2-letter state code, e.g. AZ";
    if (!/^\d{5}(-?\d{4})?$/.test(address.zip_code)) errors.zip_code = "ZIP code must be 5 digits";
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    details: {
      imei,
      ...(requiresEid ? { eid } : {}),
      ...(hasAddress || requiresAddress ? { address } : {}),
    },
  };
}

// Order metadata the backend expects for US lines.
export const deviceDetailsMetadata = (details?: DeviceDetails): Record<string, unknown> =>
  details ? { imei: details.imei, ...(details.eid ? { eid: details.eid } : {}), ...(details.address ? { address: details.address } : {}) } : {};
