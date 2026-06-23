import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SidebarNavigation from "../SidebarNavigation";
import { useWallet } from "@/hooks/useWallet";
import { usePathname } from "next/navigation";

vi.mock("@/hooks/useWallet", () => ({
  useWallet: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

global.fetch = vi.fn();

describe("SidebarNavigation — Identity Verification Pipeline Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue("/dashboard");
  });

  it("should permit low-tier dashboard access blocks even if entirely unverified", async () => {
    (useWallet as any).mockReturnValue({ connected: true, publicKey: "GABC...123" });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "unverified", tier: 0 }),
    });

    render(<SidebarNavigation />);
    
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Escrow Agreements")).toBeInTheDocument();
  });

  it("should hide advanced corporate routes under lock state parameters if verification ranks lower than target constraints", async () => {
    (useWallet as any).mockReturnValue({ connected: true, publicKey: "GABC...123" });
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "verified", tier: 1 }), // Level 1 tier token profile
    });

    render(<SidebarNavigation />);

    const lockedItem = await screen.findByText("Dispute Arbitrator Portal");
    expect(lockedItem.closest("div")).toHaveClass("cursor-not-allowed");
    expect(screen.getByText("Level 1 Account Privileges Active")).toBeInTheDocument();
  });
});