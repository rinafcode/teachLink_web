"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { VerificationStatus } from "@/types/identity";

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  requiredTier: number; // Minimum tier restriction access boundary
}

const SIDEBAR_ITEMS: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "📊", requiredTier: 0 },
  { name: "Escrow Agreements", href: "/escrow", icon: "🤝", requiredTier: 0 },
  { name: "High Volume Splits", href: "/splits/advanced", icon: "⚡", requiredTier: 1 },
  { name: "Dispute Arbitrator Portal", href: "/arbitrator", icon: "⚖️", requiredTier: 2 },
  { name: "Account Settings", href: "/settings", icon: "⚙️", requiredTier: 0 },
];

export default function SidebarNavigation() {
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const [isPending, startTransition] = useTransition();

  const [identity, setIdentity] = useState<{
    status: VerificationStatus;
    tier: number;
    loading: boolean;
  }>({
    status: "unverified",
    tier: 0,
    loading: false,
  });

  // Sync and track active verification profiles matching the public wallet key
  useEffect(() => {
    if (!connected || !publicKey) {
      setIdentity({ status: "unverified", tier: 0, loading: false });
      return;
    }

    let isSubscribed = true;

    async function fetchIdentityProfile() {
      try {
        startTransition(async () => {
          setIdentity((prev) => ({ ...prev, loading: true }));
          const res = await fetch(`/api/identity/verify?address=${publicKey}`);
          if (!res.ok) throw new Error("Verification index record mismatch.");
          
          const data = await res.json();
          if (isSubscribed) {
            setIdentity({
              status: data.status || "unverified",
              tier: data.tier ?? 0,
              loading: false,
            });
          }
        });
      } catch (err) {
        console.error("Failed to fetch account identification records:", err);
        if (isSubscribed) {
          setIdentity((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    void fetchIdentityProfile();

    return () => {
      isSubscribed = false;
    };
  }, [connected, publicKey]);

  // Color matching scheme dictionary map for badge components
  const statusBadgeStyle = {
    verified: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    rejected: "bg-rose-500/10 text-rose-500 border-rose-500/30",
    unverified: "bg-muted text-muted-foreground border-border",
  }[identity.status];

  return (
    <aside className="w-64 border-r border-border bg-card text-card-foreground min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      
      {/* SECTION 1: DYNAMIC ROUTE CHANNELS */}
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3">Navigation Channels</p>
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const isLocked = identity.tier < item.requiredTier;
              const isActive = pathname === item.href;

              if (isLocked) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-3 h-10 rounded-lg text-sm font-medium text-muted-foreground/50 bg-transparent opacity-60 cursor-not-allowed select-none"
                    title={`Requires Tier ${item.requiredTier} Account Level Verification.`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grayscale">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    <span className="text-xs">🔒</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* SECTION 2: IDENTITY COMPLIANCE VERIFICATION FOOTER */}
      {connected && (
        <div className="border-t border-border pt-4 mt-auto">
          <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">ID Verification</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadgeStyle}`}>
                {identity.loading || isPending ? "Syncing..." : identity.status}
              </span>
            </div>

            {identity.status !== "verified" && !identity.loading && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Unlock specialized escrow, high-volume payout split profiles, and platform arbitration permissions.
                </p>
                <Link
                  href="/settings"
                  className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  Complete Verification
                </Link>
              </div>
            )}

            {identity.status === "verified" && (
              <div className="text-[11px] text-emerald-500 font-medium flex items-center gap-1.5">
                <span>🛡️</span> Level {identity.tier} Account Privileges Active
              </div>
            )}
          </div>
        </div>
      )}

    </aside>
  );
}