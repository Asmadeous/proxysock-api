import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import HowToConnect from "./HowToConnect";
import { CodeBlock } from "@/components/landing/help/howtoconnect/CodeBlock";

function RouteLocation() {
  const location = useLocation();
  return <output data-testid="route-location">{location.search}</output>;
}
function show(path = "/HowToConnect") {
  render(<HelmetProvider><MemoryRouter initialEntries={[path]}><HowToConnect /><RouteLocation /></MemoryRouter></HelmetProvider>);
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Tutorial workspace", () => {
  it("switches service and topic with their examples and dashboard destination", async () => {
    const user = userEvent.setup();
    show();
    await user.click(screen.getByRole("tab", { name: /VPN/ }));
    expect(screen.getByRole("heading", { name: "Set up your WireGuard connection." })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OpenVPN" }));
    expect(screen.getByRole("heading", { name: "Import your OpenVPN profile." })).toBeInTheDocument();
    expect(screen.getByLabelText("openvpn-setup.txt example")).toHaveTextContent(".ovpn");
    expect(screen.getByRole("link", { name: "Your VPN" })).toHaveAttribute("href", "/dashboard/vpn");
    expect(screen.getByTestId("route-location")).toHaveTextContent("service=vpn&guide=openvpn");
  });
  it("opens a linked guide and handles an unknown topic", () => {
    show("/HowToConnect?service=vps&guide=files");
    expect(screen.getByRole("heading", { name: "Move your files with SCP or SFTP." })).toBeInTheDocument();
    cleanup();
    show("/HowToConnect?service=unknown&guide=invalid");
    expect(screen.getByRole("heading", { name: "Make your first proxy connection." })).toBeInTheDocument();
  });
  it("finds guides across services and clears search after selecting a result", async () => {
    const user = userEvent.setup();
    show();
    await user.type(screen.getByRole("searchbox", { name: "Search guides" }), "SSH");
    await user.click(screen.getByRole("button", { name: "VPS / SSH access" }));
    expect(screen.getByRole("heading", { name: "Your server, one connection away." })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search guides" })).toHaveValue("");
    expect(screen.getByRole("tab", { name: /VPS/ })).toHaveAttribute("aria-selected", "true");
  });
  it("provides empty-search feedback and keyboard service selection", async () => {
    const user = userEvent.setup();
    show();
    await user.type(screen.getByRole("searchbox", { name: "Search guides" }), "no-matching-guide");
    expect(screen.getByText("No guides found. Try SSH, Windows or eSIM.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    screen.getByRole("tab", { name: /Proxies/ }).focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("tab", { name: /VPS/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Your server, one connection away." })).toBeInTheDocument();
  });
  it("shows eSIM instructions and expandable troubleshooting", async () => {
    const user = userEvent.setup();
    show("/HowToConnect?service=esim&guide=android");
    expect(screen.getByRole("heading", { name: "Add your eSIM on Android." })).toBeInTheDocument();
    expect(screen.getByLabelText("android-checklist.txt example")).toHaveTextContent("Wi-Fi");
    const summary = screen.getByText("My eSIM is installed but has no data.");
    await user.click(summary);
    expect(summary.closest("details")).toHaveAttribute("open");
    expect(summary.closest("details")).toHaveTextContent("Contact support before deleting");
  });
});

describe("Terminal viewer", () => {
  it("copies the original code without line numbers and wraps lines on request", async () => {
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const code = "# Example\nssh USERNAME@SERVER_IP";
    render(<CodeBlock code={code} title="connect.sh" />);
    await user.click(screen.getByRole("button", { name: "Copy connect.sh" }));
    expect(copy).toHaveBeenCalledWith(code);
    expect(screen.getByRole("status")).toHaveTextContent("Code copied to clipboard.");
    const wrap = screen.getByRole("button", { name: "Wrap lines" });
    await user.click(wrap);
    expect(wrap).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("connect.sh example").parentElement).toHaveClass("guide-terminal-wrap");
  });
  it("keeps code available and reports clipboard failures", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Clipboard denied"));
    render(<CodeBlock code="ssh USERNAME@SERVER_IP" title="connect.sh" />);
    await user.click(screen.getByRole("button", { name: "Copy connect.sh" }));
    expect(screen.getByRole("status")).toHaveTextContent("Select the example above and copy it manually.");
    expect(screen.getByLabelText("connect.sh example")).toHaveTextContent("ssh USERNAME@SERVER_IP");
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
  });
});
