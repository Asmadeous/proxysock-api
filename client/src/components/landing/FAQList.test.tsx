import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FAQList } from "./FAQList";

it("opens only one answer, supports keyboard toggling, and tracks openings only", async () => {
  const user = userEvent.setup();
  const onOpen = vi.fn();
  render(<FAQList items={[{ question: "First question?", answer: "First answer." }, { question: "Second question?", answer: "Second answer." }]} onOpen={onOpen} />);
  const first = screen.getByRole("button", { name: "First question?" });
  const second = screen.getByRole("button", { name: "Second question?" });
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  await user.click(first);
  expect(first).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("region", { name: "First question?" })).toHaveAttribute("id", first.getAttribute("aria-controls"));
  await user.click(second);
  expect(first).toHaveAttribute("aria-expanded", "false");
  expect(second).toHaveAttribute("aria-expanded", "true");
  expect(screen.getAllByRole("region")).toHaveLength(1);
  await user.keyboard("{Enter}");
  expect(second).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  expect(onOpen).toHaveBeenCalledTimes(2);
});
