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

// Plans as the storefront API returns them after a MeiSIM sync.
const usLine = {
  id: "att-35", name: "AT&T Prepaid · $53.04 Unlimited Saver", provider: "meisim", price: "53.04", currency: "USD",
  meisim_line: "us_prepaid", network: "AT&T Prepaid", networks: "AT&T Prepaid", data_limit: "See plan", validity_days: 30,
  voice: "Unlimited", sms: "Unlimited", phone_number: "US number assigned on activation",
  description: "Real US phone number on the AT&T Prepaid network. Calls + texts + data. Activated as eSIM on your device.",
  activation_note: "You will need your device IMEI (15 digits) to activate.",
  requires_imei: true, requires_eid: true, accepts_address: true,
};
const tmo5 = {
  ...usLine, id: "tmo-5", name: "T-Mobile Prepaid · 5GB eSIM", network: "T-Mobile", networks: "T-Mobile (US)",
  voice: "0", sms: "0", price: "42.00",
};
const moxeeSms = {
  ...usLine, id: "moxee-sms", name: "Moxee 2 Prepaid · 100 SMS Only", network: "Moxee 2", networks: "Moxee 2", price: "9.84",
  voice: "0", sms: "0", requires_eid: false, accepts_address: false,
};
const lyca15 = {
  ...usLine, id: "ly-15", name: "Lycamobile · $22.50 international Plan", network: "Lycamobile", networks: "Lycamobile (US)",
  data_limit: "", voice: "", sms: "", description: "international Plan", activation_note: "", price: "22.50",
  requires_eid: false, coverage: "United States + international calling",
};
const mobileX = {
  ...usLine, id: "mx-20", name: "MobileX Prepaid · Mobile X Unlimited 20", network: "MobileX", networks: "MobileX (US)",
  data_limit: "10GB", validity_days: 90, voice: "Unlimited — US, Canada & Mexico", sms: "Unlimited — US, Canada & Mexico",
  warnings: "3-month plan — billed once and valid for 90 days. MobileX has no 1-month option, so this covers 3 months upfront.",
  price: "50.40",
};
const manualAtt = {
  ...usLine, id: "att-6m", name: "AT&T Prepaid · 30GB · Unlimited Talk & Text · 6 months", network: "AT&T", networks: "AT&T",
  data_limit: "30GB per month", validity_days: 180, term_months: 6, voice: "Unlimited US", sms: "Unlimited US",
  phone_number: "", includes_number: "YES", manual_fulfilment: true, price: "200",
};
const ukO2 = {
  id: "uk-o2", name: "O2 UK · 25GB + 50 Intl Mins", provider: "meisim", price: "22.29", currency: "USD",
  meisim_line: "uk_prepaid", number_country: "GB", network: "O2 UK", networks: "O2 (UK)",
  data_limit: "25GB UK · 25GB roaming", validity_days: 30, voice: "Unlimited UK + 50 international", sms: "Unlimited UK",
  phone_number: "UK number assigned on activation", hotspot: "Yes", topup: "Yes — top up monthly via your account page",
  intl_minutes: "50", roaming_free: "Austria, Belgium", intl_call_to: "India, Nigeria",
  activation_note: "Must be activated in the UK before first use.",
  description: "UK number on O2. Unlimited UK + 50 mins to 40+ countries. 25GB UK + 25GB EU roaming.",
  requires_imei: false, requires_eid: false, accepts_address: false,
};
const ukThree = {
  ...ukO2, id: "uk-three", name: "Three UK · Unlimited + EU Roaming", network: "Three UK", networks: "Three (UK)",
  data_limit: "Unlimited UK · 30GB roaming", voice: "Unlimited UK", intl_minutes: "", intl_call_to: "", price: "44.58",
};
const travel = { ...usLine, id: "world-1", name: "World 1 GB", meisim_line: "travel" };

const IMEI = "35 092338 941642 0";
const EID = "89049032007108888100137471946359";

const loadPlans = (...products: object[]) => vi.mocked(api.get).mockResolvedValue({ data: { products } });

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  loadPlans(usLine, tmo5, moxeeSms, lyca15, mobileX, manualAtt, ukO2, ukThree, travel);
});
afterEach(cleanup);

const renderPage = (props = {}) => render(<MemoryRouter><USAESIMPlansPage {...props} /></MemoryRouter>);
const card = async (name: string) => within(await screen.findByRole("article", { name }));
const pills = async (name: string) => (await card(name)).getAllByRole("listitem").map((li) => li.textContent);
const openPlan = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click((await card(name)).getByRole("button", { name: /^Get (US|UK) Number/ }));
  return within(await screen.findByRole("dialog"));
};

it("lists only the chosen country's phone-number lines", async () => {
  renderPage();
  expect(await screen.findByRole("article", { name: usLine.name })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: ukO2.name })).not.toBeInTheDocument();
  expect(screen.queryByRole("article", { name: travel.name })).not.toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith("/web/api/products?product_type=esim&per_page=all");
});

it("shows MeiSIM's card pills: See plan, days, calls and texts", async () => {
  renderPage();
  expect(await pills(usLine.name)).toEqual(["📱 US Number", "📶 See plan", "📅 30 days", "📞 Unlimited", "💬 Unlimited"]);
  expect(await pills(tmo5.name)).toEqual(["📱 US Number", "📶 See plan", "📅 30 days", "📶 Data only"]);
  expect(await pills(lyca15.name)).toEqual(["📱 US Number", "📅 30 days"]);
  expect((await card(usLine.name)).getByText("USD / mo")).toBeInTheDocument();
  expect((await card(mobileX.name)).getByText("USD for 3 months")).toBeInTheDocument();
  expect((await card(manualAtt.name)).getByText("USD for 6 months")).toBeInTheDocument();
});

it("shows UK pills without days and with international minutes", async () => {
  renderPage({ country: "GB" });
  expect(await pills(ukO2.name)).toEqual([
    "📱 UK Number", "📶 25GB UK · 25GB roaming", "📞 Unlimited UK + 50 international", "💬 Unlimited UK", "🌍 50 intl mins",
  ]);
  expect(screen.getByRole("link", { name: "Change country" })).toHaveAttribute("href", "/dashboard/phone-esim");
});

it("asks for IMEI and EID where MeiSIM does, then adds one line to the cart", async () => {
  const user = userEvent.setup();
  const otherItem = { productType: "vpn", quantity: 1 };
  localStorage.setItem("cartItems", JSON.stringify([otherItem]));
  renderPage();

  const dialog = await openPlan(user, usLine.name);
  expect(dialog.getByText("Both IMEI and EID are required by the carrier. Without them, the activation will fail.")).toBeInTheDocument();
  expect(dialog.getByText(/No QR code for this plan/)).toBeInTheDocument();
  expect(dialog.getByText(/This is a United States plan/)).toBeInTheDocument();
  await user.click(dialog.getByRole("button", { name: "Add to Cart" }));
  expect(dialog.getByText("IMEI must be exactly 15 digits")).toBeInTheDocument();
  expect(dialog.getByText("EID must be exactly 32 digits")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("cartItems")!)).toEqual([otherItem]);

  await user.type(dialog.getByLabelText(/Your device IMEI/i), IMEI);
  await user.type(dialog.getByLabelText(/Your device EID/i), EID);
  await user.click(dialog.getByRole("button", { name: "Add to Cart" }));

  const cart = JSON.parse(localStorage.getItem("cartItems")!);
  expect(cart).toHaveLength(2);
  expect(cart[1]).toMatchObject({
    productType: "usa-esim", quantity: 1,
    usaEsimPlan: { id: usLine.id, price: 53.04, requires_eid: true },
    deviceDetails: { imei: "350923389416420", eid: EID },
  });
  expect(screen.getByText("1 line in cart")).toBeInTheDocument();
});

it("asks only for the IMEI on plans MeiSIM marks as needing no EID", async () => {
  const user = userEvent.setup();
  renderPage();

  const lyca = await openPlan(user, lyca15.name);
  expect(lyca.getByText("Your IMEI is required. This plan needs no EID.")).toBeInTheDocument();
  expect(lyca.queryByLabelText(/Your device EID/i)).not.toBeInTheDocument();
  expect(lyca.getByText("📍 Activation address")).toBeInTheDocument();
  await user.click(lyca.getByRole("button", { name: "Cancel" }));

  const moxee = await openPlan(user, moxeeSms.name);
  expect(moxee.getByText(/No EID needed for this plan/)).toBeInTheDocument();
  expect(moxee.queryByLabelText(/Your device EID/i)).not.toBeInTheDocument();
  expect(moxee.queryByText("📍 Activation address")).not.toBeInTheDocument();
});

it("asks MobileX buyers for the second IMEI and shows the plan's restrictions", async () => {
  const user = userEvent.setup();
  renderPage();
  const dialog = await openPlan(user, mobileX.name);
  expect(dialog.getByText("⚠️ Restrictions:")).toBeInTheDocument();
  expect(dialog.getByText("3-month plan — billed once and valid for 90 days")).toBeInTheDocument();
  expect(dialog.getByLabelText(/IMEI2/)).toBeInTheDocument();
  expect(dialog.queryByText(/No QR code for this plan/)).not.toBeInTheDocument();
});

it("sends the device details and optional address through direct purchase", async () => {
  const user = userEvent.setup();
  const purchase = vi.fn().mockResolvedValue(undefined);
  renderPage({ isDirectBuy: true, onDirectBuy: purchase });

  const dialog = await openPlan(user, usLine.name);
  await user.type(dialog.getByLabelText(/Your device IMEI/i), IMEI);
  await user.type(dialog.getByLabelText(/Your device EID/i), EID);
  await user.click(dialog.getByRole("checkbox", { name: "Use default" }));
  await user.type(dialog.getByLabelText("Street address"), "1 Main St");
  await user.type(dialog.getByLabelText("City"), "Austin");
  await user.type(dialog.getByLabelText("State"), "tx");
  await user.type(dialog.getByLabelText("ZIP"), "73301");
  await user.click(dialog.getByRole("button", { name: "Instantly Provision" }));

  expect(purchase).toHaveBeenCalledWith(usLine.id, 1, expect.objectContaining({
    imei: "350923389416420", eid: EID, address: expect.objectContaining({ city: "Austin", zip_code: "73301" }),
  }));
  expect(localStorage.getItem("cartItems")).toBeNull();
});

it("adds a UK line with no device questions and shows its roaming details", async () => {
  const user = userEvent.setup();
  renderPage({ country: "GB" });

  const dialog = await openPlan(user, ukO2.name);
  expect(dialog.getByText("Hotspot")).toBeInTheDocument();
  expect(dialog.getByText("50 minutes/month")).toBeInTheDocument();
  expect(dialog.getByText(/Roaming countries/)).toBeInTheDocument();
  expect(dialog.getByText(/Call these countries/)).toBeInTheDocument();
  expect(dialog.queryByLabelText(/IMEI/)).not.toBeInTheDocument();
  expect(dialog.queryByText(/United States plan/)).not.toBeInTheDocument();
  await user.click(dialog.getByRole("button", { name: "Add to Cart" }));

  const cart = JSON.parse(localStorage.getItem("cartItems")!);
  expect(cart[0]).toMatchObject({ productType: "usa-esim", usaEsimPlan: { id: "uk-o2", country: "GB", requires_imei: false } });
  expect(cart[0].deviceDetails).toBeUndefined();
});

it("shows MeiSIM's plan details in the window", async () => {
  const user = userEvent.setup();
  renderPage();
  const dialog = await openPlan(user, manualAtt.name);
  expect(dialog.getByText("30GB per month · 180 days · United States")).toBeInTheDocument();
  expect(dialog.getByText("📱 US phone number").nextSibling).toHaveTextContent("Yes");
  expect(dialog.getByText("Network").nextSibling).toHaveTextContent("AT&T");
  expect(dialog.getByText(/line is tied to that handset/)).toBeInTheDocument();
});

it("filters US lines by carrier and by what is included", async () => {
  const user = userEvent.setup();
  renderPage();
  await screen.findByRole("article", { name: usLine.name });

  const included = screen.getByRole("group", { name: "What's included" });
  await user.click(within(included).getByRole("button", { name: "SMS only" }));
  expect(screen.getByRole("article", { name: moxeeSms.name })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: usLine.name })).not.toBeInTheDocument();

  await user.click(within(included).getByRole("button", { name: "SMS only" }));
  await user.click(within(screen.getByRole("group", { name: "Length" })).getByRole("button", { name: "6 months" }));
  expect(screen.getByRole("article", { name: manualAtt.name })).toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(1);

  const carriers = screen.getByRole("group", { name: "Carrier" });
  expect(within(carriers).queryByRole("button", { name: "AT&T Prepaid" })).not.toBeInTheDocument();
  await user.click(within(carriers).getByRole("button", { name: "Moxee 2" }));
  expect(screen.getByText("No plans match these filters")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getAllByRole("article")).toHaveLength(6);
});

it("filters UK lines by data amount", async () => {
  const user = userEvent.setup();
  renderPage({ country: "GB" });
  await screen.findByRole("article", { name: ukO2.name });

  await user.click(within(screen.getByRole("group", { name: "UK data" })).getByRole("button", { name: "Unlimited" }));
  expect(screen.getByRole("article", { name: ukThree.name })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: ukO2.name })).not.toBeInTheDocument();
});
