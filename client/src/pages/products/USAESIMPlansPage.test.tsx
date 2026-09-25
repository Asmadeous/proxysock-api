import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import api from "../../services/api";
import USAESIMPlansPage from "./USAESIMPlansPage";

vi.mock("../../services/api", () => ({ default: { get: vi.fn() } }));
vi.mock("@/utils/redditPixel", () => ({
  conversionTracker: { trackAddToCart: vi.fn() },
}));

const usLine = {
  id: "0cf1fe4c-c82b-4a15-9de5-62daf21ea00f", name: "AT&T Prepaid · $35 Unlimited Saver", provider: "meisim",
  price: "53.04", currency: "USD", meisim_line: "us_prepaid", network: "AT&T Prepaid",
  data_limit: "See plan", data_unit: null, validity_days: 30, requires_imei: true, requires_eid: true,
};
const moxee = { ...usLine, id: "moxee-1", name: "Moxee 2 Prepaid · 100 SMS Only", price: "7.87", network: "Moxee 2", requires_eid: false };
const travel = { ...usLine, id: "world-1", name: "World 1 GB", meisim_line: "travel", requires_imei: false, requires_eid: false };

const IMEI = "35 092338 941642 0";
const EID = "89049032007108888100137471946359";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(api.get).mockResolvedValue({ data: { products: [usLine, travel, moxee] } });
});
afterEach(cleanup);

const renderPage = (props = {}) => render(<MemoryRouter><USAESIMPlansPage {...props} /></MemoryRouter>);

const card = async (name: string) => within(await screen.findByRole("article", { name }));
const form = (name: string) => within(screen.getByRole("form", { name: `Phone details for ${name}` }));

it("lists only MeiSIM US phone-number lines", async () => {
  renderPage();
  expect(await screen.findByRole("article", { name: usLine.name })).toBeInTheDocument();
  expect(screen.getByRole("article", { name: moxee.name })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: travel.name })).not.toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/web/api/products?product_type=esim&per_page=all");
});

it("asks for the phone's IMEI and EID before adding a line to the cart", async () => {
  const user = userEvent.setup();
  const otherItem = { productType: "vpn", quantity: 1 };
  localStorage.setItem("cartItems", JSON.stringify([otherItem]));
  renderPage();

  await user.click((await card(usLine.name)).getByRole("button", { name: "Add to Cart" }));
  await user.click(form(usLine.name).getByRole("button", { name: "Add to Cart" }));
  expect(screen.getByText("IMEI must be exactly 15 digits")).toBeInTheDocument();
  expect(screen.getByText("EID must be exactly 32 digits")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("cartItems")!)).toEqual([otherItem]);

  await user.type(form(usLine.name).getByLabelText("IMEI"), IMEI);
  await user.type(form(usLine.name).getByLabelText("EID"), EID);
  await user.click(form(usLine.name).getByRole("button", { name: "Add to Cart" }));

  const cart = JSON.parse(localStorage.getItem("cartItems")!);
  expect(cart).toHaveLength(2);
  expect(cart[0]).toEqual(otherItem);
  expect(cart[1]).toMatchObject({
    productType: "usa-esim", quantity: 1,
    usaEsimPlan: { id: usLine.id, price: 53.04, requires_eid: true },
    deviceDetails: { imei: "350923389416420", eid: EID },
  });
  expect(screen.getByText("1 line in cart")).toBeInTheDocument();
});

it("does not ask for an EID on plans that do not need one", async () => {
  const user = userEvent.setup();
  renderPage();
  await user.click((await card(moxee.name)).getByRole("button", { name: "Add to Cart" }));
  expect(form(moxee.name).getByLabelText("IMEI")).toBeInTheDocument();
  expect(form(moxee.name).queryByLabelText("EID")).not.toBeInTheDocument();
});

it("sends quantity 1 and the device details through direct purchase", async () => {
  const user = userEvent.setup();
  const purchase = vi.fn().mockResolvedValue(undefined);
  renderPage({ isDirectBuy: true, onDirectBuy: purchase });

  await user.click((await card(usLine.name)).getByRole("button", { name: "Instantly Provision" }));
  await user.type(form(usLine.name).getByLabelText("IMEI"), IMEI);
  await user.type(form(usLine.name).getByLabelText("EID"), EID);
  await user.click(form(usLine.name).getByRole("button", { name: "Instantly Provision" }));

  expect(purchase).toHaveBeenCalledWith(usLine.id, 1, { imei: "350923389416420", eid: EID });
  expect(localStorage.getItem("cartItems")).toBeNull();
});

it("shows the full plan details on the card", async () => {
  vi.mocked(api.get).mockResolvedValue({
    data: {
      products: [{
        ...usLine, voice: "Unlimited", sms: "Unlimited", coverage: "United States",
        description: "Real US phone number.\n10GB mobile hotspot included",
        activation_note: "Phone must be unlocked.", warnings: "Billed once for 3 months.",
      }],
    },
  });
  renderPage();

  const plan = await card(usLine.name);
  expect(plan.getByRole("heading", { name: "AT&T" })).toBeInTheDocument();
  expect(plan.getByText("Unlimited Saver")).toBeInTheDocument();
  expect(plan.getByText("Calls").nextSibling).toHaveTextContent("Unlimited");
  expect(plan.getByText("Texts").nextSibling).toHaveTextContent("Unlimited");
  expect(plan.queryByText("Data")).not.toBeInTheDocument();
  expect(plan.queryByText("Coverage")).not.toBeInTheDocument();
  expect(plan.getByText("Real US phone number.")).toBeVisible();
  expect(plan.getByText("10GB mobile hotspot included")).toBeVisible();
  expect(plan.getByText("Billed once for 3 months.")).toBeInTheDocument();
  expect(plan.getByText("Phone must be unlocked.")).toBeInTheDocument();
});

it("reads the data allowance from the plan name when MeiSIM only says See plan", async () => {
  const linkup = { ...usLine, id: "linkup-1", name: "LinkUp Mobile Prepaid · 1GB", network: "LinkUp Mobile" };
  const intl = { ...usLine, id: "ly-1", name: "Lycamobile · $15 international Plan", data_limit: "",
    coverage: "United States + international calling" };
  vi.mocked(api.get).mockResolvedValue({ data: { products: [linkup, intl] } });
  renderPage();

  expect((await card(linkup.name)).getByText("Data").nextSibling).toHaveTextContent("1 GB");
  const lyca = await card(intl.name);
  expect(lyca.queryByText("Data")).not.toBeInTheDocument();
  expect(lyca.getByText("Coverage").nextSibling).toHaveTextContent("United States + international calling");
});

const ukO2 = {
  ...usLine, id: "uk-o2", name: "O2 UK · 8GB + EU Roaming", price: "14.87", network: "O2 UK", meisim_line: "uk_prepaid",
  number_country: "GB", data_limit: "8GB UK · 8GB roaming", voice: "Unlimited UK", requires_imei: false, requires_eid: false,
  activation_note: "Must be activated in the UK before first use.",
};
const ukThree = {
  ...ukO2, id: "uk-three", name: "Three UK · Unlimited + EU Roaming", price: "44.58", network: "Three UK",
  data_limit: "Unlimited UK · 30GB roaming",
};
const smsOnly = { ...usLine, id: "sms-1", name: "Moxee 2 Prepaid · 100 SMS Only", price: "9.84", network: "Moxee 2", requires_eid: false };
const manualAtt = {
  ...usLine, id: "att-6m", name: "AT&T Prepaid · 30GB · Unlimited Talk & Text · 6 months", price: "200", network: "AT&T",
  data_limit: "30GB per month", validity_days: 180, manual_fulfilment: true,
};

const loadPlans = (...products: object[]) =>
  vi.mocked(api.get).mockResolvedValue({ data: { products } });

it("shows only the chosen country's lines", async () => {
  loadPlans(usLine, ukO2, ukThree, travel);
  renderPage({ country: "GB" });

  expect(await screen.findByRole("heading", { name: "UK phone-number eSIM" })).toBeInTheDocument();
  expect(screen.getByRole("article", { name: ukO2.name })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: usLine.name })).not.toBeInTheDocument();
  expect(screen.queryByRole("article", { name: travel.name })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Change country" })).toHaveAttribute("href", "/dashboard/phone-esim");
});

it("adds a UK line to the cart without asking for phone details", async () => {
  const user = userEvent.setup();
  loadPlans(ukO2);
  renderPage({ country: "GB" });

  await user.click((await card(ukO2.name)).getByRole("button", { name: "Add to Cart" }));

  expect(screen.queryByRole("form")).not.toBeInTheDocument();
  const cart = JSON.parse(localStorage.getItem("cartItems")!);
  expect(cart).toHaveLength(1);
  expect(cart[0]).toMatchObject({ productType: "usa-esim", usaEsimPlan: { id: "uk-o2", country: "GB", requires_imei: false } });
  expect(cart[0].deviceDetails).toBeUndefined();
});

it("filters US lines by carrier and by what is included", async () => {
  const user = userEvent.setup();
  loadPlans(usLine, smsOnly, manualAtt);
  renderPage();
  await screen.findByRole("article", { name: usLine.name });

  const included = screen.getByRole("group", { name: "What's included" });
  await user.click(within(included).getByRole("button", { name: "SMS only" }));
  expect(screen.getByRole("article", { name: smsOnly.name })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: usLine.name })).not.toBeInTheDocument();

  await user.click(within(included).getByRole("button", { name: "SMS only" }));
  await user.click(within(screen.getByRole("group", { name: "Length" })).getByRole("button", { name: "6 months" }));
  expect(screen.getByRole("article", { name: manualAtt.name })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: smsOnly.name })).not.toBeInTheDocument();

  const carriers = screen.getByRole("group", { name: "Carrier" });
  expect(within(carriers).queryByRole("button", { name: "AT&T Prepaid" })).not.toBeInTheDocument();
  await user.click(within(carriers).getByRole("button", { name: "Moxee 2" }));
  expect(screen.getByText("No plans match these filters")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getAllByRole("article")).toHaveLength(3);
});

it("filters UK lines by data amount", async () => {
  const user = userEvent.setup();
  loadPlans(ukO2, ukThree);
  renderPage({ country: "GB" });
  await screen.findByRole("article", { name: ukO2.name });

  await user.click(within(screen.getByRole("group", { name: "UK data" })).getByRole("button", { name: "Unlimited" }));
  expect(screen.getByRole("article", { name: ukThree.name })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: ukO2.name })).not.toBeInTheDocument();
});

it("explains manual activation and asks for the EID of the phone that keeps the line", async () => {
  const user = userEvent.setup();
  loadPlans(manualAtt);
  renderPage();

  const plan = await card(manualAtt.name);
  expect(plan.getByText(/Activated by the carrier within 24 hours/)).toBeInTheDocument();
  await user.click(plan.getByRole("button", { name: "Add to Cart" }));
  expect(form(manualAtt.name).getByText(/can't be moved to another one later/)).toBeInTheDocument();
  expect(form(manualAtt.name).queryByText(/US address/)).not.toBeInTheDocument();
});

it("only offers the 911 address on carriers that use it", async () => {
  const user = userEvent.setup();
  loadPlans({ ...usLine, accepts_address: true });
  renderPage();

  await user.click((await card(usLine.name)).getByRole("button", { name: "Add to Cart" }));
  expect(form(usLine.name).getByText(/used for 911 and your number's area code/)).toBeInTheDocument();
});

it("shows the price once, not again inside the plan name", async () => {
  loadPlans({ ...usLine, id: "ly-1", name: "Lycamobile · $22.50-300 MB + 3000 mins&sms-national", price: "22.50", network: "Lycamobile" });
  renderPage();

  const plan = await card("Lycamobile · $22.50-300 MB + 3000 mins&sms-national");
  expect(plan.getByText("300 MB + 3000 mins&sms-national")).toBeInTheDocument();
  expect(plan.getAllByText("$22.50")).toHaveLength(1);
});

it("keeps only what is specific to the plan and says the shared requirements once", async () => {
  loadPlans({
    ...usLine, voice: "Unlimited", sms: "Unlimited",
    description: "Real US phone number on the AT&T Prepaid network. Calls + texts + data. Activated as eSIM on your device.\n10GB mobile hotspot included",
    activation_note: "You will need your device IMEI (15 digits) to activate. Your phone must be unlocked and compatible with the AT&T Prepaid network.",
  });
  renderPage();

  const plan = await card(usLine.name);
  expect(plan.getByText("10GB mobile hotspot included")).toBeInTheDocument();
  expect(plan.queryByText(/Real US phone number/)).not.toBeInTheDocument();
  expect(plan.queryByText(/device IMEI/)).not.toBeInTheDocument();
  expect(screen.getByText(/Your phone must be unlocked/)).toBeInTheDocument();
});

it("reads texts from the plan name when MeiSIM leaves them out", async () => {
  loadPlans(smsOnly, { ...smsOnly, id: "sms-2", name: "Moxee 2 Prepaid · SMS Verification - Incoming SMS Only" });
  renderPage();

  expect((await card(smsOnly.name)).getByText("Texts").nextSibling).toHaveTextContent("100 SMS");
  expect((await card("Moxee 2 Prepaid · SMS Verification - Incoming SMS Only")).getByText("Texts").nextSibling)
    .toHaveTextContent("Incoming SMS only");
});
