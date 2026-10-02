import { describe, expect, it } from "vitest";
import { deviceDetailsMetadata, validateDeviceDetails } from "./deviceDetails";

const noAddress = { address_line_1: "", city: "", state: "", zip_code: "" };
const EID = "89049032007108888100137471946359";

describe("validateDeviceDetails", () => {
  it("accepts IMEI and EID grouped with spaces, as phones display them", () => {
    const { errors, details } = validateDeviceDetails(
      { imei: "35 092338 941642 0", eid: "8904 9032 0071 0888 8100 1374 7194 6359", address: noAddress },
      true,
    );
    expect(errors).toEqual({});
    expect(details).toEqual({ imei: "350923389416420", eid: EID });
  });

  it("requires a 15-digit IMEI and a 32-digit EID when the plan needs one", () => {
    const { errors, details } = validateDeviceDetails({ imei: "1234", eid: "", address: noAddress }, true);
    expect(details).toBeUndefined();
    expect(errors).toEqual({ imei: "IMEI must be exactly 15 digits", eid: "EID must be exactly 32 digits" });
  });

  it("skips EID for plans that do not need it (Moxee)", () => {
    const { details } = validateDeviceDetails({ imei: "350923389416420", eid: "", address: noAddress }, false);
    expect(details).toEqual({ imei: "350923389416420" });
  });

  it("requires the 911 address when the plan takes one", () => {
    const { errors, details } = validateDeviceDetails({ imei: "350923389416420", eid: EID, address: noAddress }, true, true);

    expect(details).toBeUndefined();
    expect(Object.keys(errors).sort()).toEqual(["address_line_1", "city", "state", "zip_code"]);
  });

  it("validates the 911 address when one is entered", () => {
    const bad = validateDeviceDetails(
      { imei: "350923389416420", eid: EID, address: { address_line_1: "Teal Ct", city: "D", state: "Delaware", zip_code: "1990" } },
      true,
    );
    expect(Object.keys(bad.errors).sort()).toEqual(["address_line_1", "city", "state", "zip_code"]);

    const good = validateDeviceDetails(
      { imei: "350923389416420", eid: EID, address: { address_line_1: "35 Teal Ct", city: "Dover", state: "de", zip_code: "19904" } },
      true,
    );
    expect(good.details?.address).toEqual({ address_line_1: "35 Teal Ct", city: "Dover", state: "DE", zip_code: "19904" });
  });
});

describe("deviceDetailsMetadata", () => {
  it("builds the order metadata the backend expects", () => {
    expect(deviceDetailsMetadata({ imei: "350923389416420", eid: EID })).toEqual({ imei: "350923389416420", eid: EID });
    expect(deviceDetailsMetadata(undefined)).toEqual({});
  });
});
