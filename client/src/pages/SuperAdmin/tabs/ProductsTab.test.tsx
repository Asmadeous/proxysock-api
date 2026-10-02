import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductsTab from "./ProductsTab";

const updateMutate = vi.fn();
const syncMutate = vi.fn();
const mutation = { mutate: vi.fn(), mutateAsync: vi.fn(), isLoading: false };

const products = [
  { id: 1, name: "Lycamobile · $22.50 international Plan", product_type: "esim", provider: "meisim", active: true, stock_status: "in_stock", metadata: {} },
  { id: 2, name: "Ghana 1GB/Day", product_type: "esim", provider: "esim_access", active: false, stock_status: "in_stock", metadata: {} },
];

vi.mock("../queries/products.queries", () => ({
  useAdminProducts: () => ({ data: { products }, isLoading: false }),
  useCreateProduct: () => mutation,
  useUpdateProduct: () => ({ ...mutation, mutate: updateMutate }),
  useDeleteProduct: () => mutation,
  useSyncProducts: () => ({ ...mutation, mutate: syncMutate }),
}));
vi.mock("./AdminPurchaseView", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(cleanup);

const openEsims = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<ProductsTab />);
  await user.click(screen.getByText("Product Management"));
  await user.click(await screen.findByText("Global eSIM"));
  // The catalogue animates out before the product list mounts.
  await screen.findByRole("button", { name: /Sync MeiSIM/ }, { timeout: 3000 });
};

it("switches a plan off and on from its row", async () => {
  const user = userEvent.setup();
  await openEsims(user);

  const lyca = screen.getByRole("switch", { name: `Deactivate ${products[0].name}` });
  expect(lyca).toHaveAttribute("aria-checked", "true");
  await user.click(lyca);
  expect(updateMutate).toHaveBeenCalledWith({ id: 1, data: { active: false } });

  await user.click(screen.getByRole("switch", { name: `Activate ${products[1].name}` }));
  expect(updateMutate).toHaveBeenCalledWith({ id: 2, data: { active: true } });
});

it("syncs MeiSIM and eSIM Access separately", async () => {
  const user = userEvent.setup();
  await openEsims(user);

  await user.click(screen.getByRole("button", { name: /Sync MeiSIM/ }));
  expect(syncMutate).toHaveBeenCalledWith("meisim");

  await user.click(screen.getByRole("button", { name: /Sync eSIM Access/ }));
  expect(syncMutate).toHaveBeenCalledWith("esims");
});

it("filters the list by provider", async () => {
  const user = userEvent.setup();
  await openEsims(user);

  await user.selectOptions(screen.getByRole("combobox", { name: "Filter by provider" }), "meisim");
  expect(screen.getByText(products[0].name)).toBeInTheDocument();
  expect(screen.queryByText(products[1].name)).not.toBeInTheDocument();
});
