import { describe, expect, it } from "vitest";
import { isPhoneLine, mapMeisimPackage } from "./useESIMPackages";

const base = { id: "p1", slug: "meisim-p1", name: "Plan", price: "19.19", currency: "USD", provider: "meisim", meisim_line: "travel" };

describe("mapMeisimPackage", () => {
  it("maps a single-country MeiSIM plan", () => {
    const pkg = mapMeisimPackage({ ...base, countries: ["JP"], regions: [], data_limit: "1", data_unit: "GB", validity_days: 7, network: "4G/LTE" });
    expect(pkg).toMatchObject({
      price: 19.19, scope: "country", location_code: "JP", location_name: "JP",
      volume: 1024 ** 3, data_type: 1, duration: 7, network: "4G/LTE",
    });
  });

  it("treats multi-country plans as regional and 50+ countries as global", () => {
    expect(mapMeisimPackage({ ...base, countries: ["FR", "DE"], regions: ["Europe"] })).toMatchObject({
      scope: "regional", location_code: "FR,DE", location_name: "Europe",
    });
    const world = Array.from({ length: 60 }, (_, i) => `C${i}`);
    expect(mapMeisimPackage({ ...base, countries: world, regions: [] }).scope).toBe("global");
  });

  it("marks unlimited or unknown data as having no fixed volume", () => {
    expect(mapMeisimPackage({ ...base, countries: ["US"], data_limit: "Unlimited" })).toMatchObject({ volume: 0, data_type: 0 });
  });
});

describe("isPhoneLine", () => {
  it("keeps US and UK phone-number lines out of the data-only list", () => {
    expect(isPhoneLine({ meisim_line: "us_prepaid" })).toBe(true);
    expect(isPhoneLine({ meisim_line: "uk_prepaid" })).toBe(true);
    expect(isPhoneLine({ meisim_line: "travel" })).toBe(false);
    expect(isPhoneLine({})).toBe(false);
  });
});

describe("MeiSIM travel data amounts", () => {
  it("reads the unit from MeiSIM's text allowance", () => {
    expect(mapMeisimPackage({ ...base, countries: ["KR"], data_limit: "1.95 GB" }).volume).toBeCloseTo(1.95 * 1024 ** 3);
    expect(mapMeisimPackage({ ...base, countries: ["AE"], data_limit: "1000 MB" }).volume).toBe(1000 * 1024 ** 2);
    expect(mapMeisimPackage({ ...base, countries: ["JP"], data_limit: "1", data_unit: "GB" }).volume).toBe(1024 ** 3);
  });
});
