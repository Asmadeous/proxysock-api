import { expect, it } from "vitest";
import { matchesDataAmount, matchesValidity } from "./EsimPackages";

const GB = 1024 ** 3;
const pkg = (extra: object) => ({ volume: 3 * GB, data_type: 1, duration: 7, duration_unit: "day", ...extra }) as any;

it("puts eSIM Access and MeiSIM plans in the right data range", () => {
  expect(matchesDataAmount(pkg({}), "under5")).toBe(true);
  expect(matchesDataAmount(pkg({ volume: 10 * GB }), "5to20")).toBe(true);
  expect(matchesDataAmount(pkg({ volume: 50 * GB }), "over20")).toBe(true);
  expect(matchesDataAmount(pkg({ volume: 0, data_type: 0 }), "unlimited")).toBe(true);
});

it("keeps daily-reset plans out of the total-data ranges", () => {
  const daily = pkg({ volume: GB, data_type: 2, duration: 1 });
  expect(matchesDataAmount(daily, "daily")).toBe(true);
  expect(matchesDataAmount(daily, "under5")).toBe(false);
});

it("reads eSIM Access DAY units and month units for validity", () => {
  expect(matchesValidity(pkg({ duration: 7, duration_unit: "day" }), "upto7")).toBe(true);
  expect(matchesValidity(pkg({ duration: 30, duration_unit: "day" }), "8to30")).toBe(true);
  expect(matchesValidity(pkg({ duration: 3, duration_unit: "month" }), "over30")).toBe(true);
});
