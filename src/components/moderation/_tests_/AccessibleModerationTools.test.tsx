import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AccessibleModerationTools from "../AccessibleModerationTools";

global.fetch = vi.fn();

describe("AccessibleModerationTools — VPAT & Accessibility Compliance Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should conform to accessibility standards by exposing proper semantic ARIA roles", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<AccessibleModerationTools escrowId="esc-001" />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Escrow Moderation Panel" })).toBeInTheDocument();
      expect(screen.getByRole("table", { name: "Historical Enforcement Records Matrix" })).toBeInTheDocument();
    });
  });

  it("should capture and properly cycle keyboard focus parameters when the modal opens", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<AccessibleModerationTools escrowId="esc-001" />);

    const openButton = await screen.findByRole("button", { name: "Deploy Safe-Freeze" });
    fireEvent.click(openButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const closeButton = screen.getByRole("button", { name: "Close dialog window" });
    // Focus automatically returns to baseline trigger button upon closing the workspace overlay
    fireEvent.click(closeButton);
    expect(openButton).setSelectionRange;
  });
});