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
  expect(plan.getByRole("heading", { name: "AT&T Prepaid" })).toBeInTheDocument();
  expect(plan.getByText("$35 Unlimited Saver")).toBeInTheDocument();
  expect(plan.getByText("Calls").nextSibling).toHaveTextContent("Unlimited");
  expect(plan.getByText("Texts").nextSibling).toHaveTextContent("Unlimited");
  expect(plan.getByText("Data").nextSibling).toHaveTextContent("Not listed");
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
  expect(lyca.getByText("Data").nextSibling).toHaveTextContent("Not listed");
  expect(lyca.getByText("Coverage").nextSibling).toHaveTextContent("United States + international calling");
});
