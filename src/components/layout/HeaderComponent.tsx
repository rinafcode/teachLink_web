'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';
import { IGrantContext } from '@/types/grants';

export default function HeaderComponent() {
  const { connected, publicKey, connect } = useWallet();

  // Grant Management Context States
  const [grantsState, setGrantsState] = useState<{
    grants: IGrantContext[];
    pendingCount: number;
    loading: boolean;
  }>({
    grants: [],
    pendingCount: 0,
    loading: false,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync and fetch active delegation scopes from the network ledger state
  useEffect(() => {
    if (!connected || !publicKey) {
      setGrantsState({ grants: [], pendingCount: 0, loading: false });
      return;
    }

    let isMounted = true;

    async function fetchActiveGrants() {
      try {
        startTransition(() => {
          setGrantsState((prev) => ({ ...prev, loading: true }));
        });

        // Query the core Soroban proxy database mapping for active delegation parameters
        const res = await fetch(`/api/contracts/grants?authority=${publicKey}`);
        if (!res.ok) throw new Error('Grant lookup network response failed.');

        const data = await res.json();

        if (isMounted) {
          setGrantsState({
            grants: data.activeGrants || [],
            pendingCount: data.pendingApprovalsCount || 0,
            loading: false,
          });
        }
      } catch (err) {
        console.error('Failed to synchronize active authorization grants:', err);
        if (isMounted) {
          setGrantsState((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    void fetchActiveGrants();

    return () => {
      isMounted = false;
    };
  }, [connected, publicKey]);

  // Compute total safe baseline allowance thresholds to optimize layout re-renders
  const activeScopesFormatted = useMemo(() => {
    if (grantsState.grants.length === 0) return 'No Active Delegations';
    return `${grantsState.grants.length} Scope ${
      grantsState.grants.length === 1 ? 'Grant' : 'Grants'
    } Authorized`;
  }, [grantsState.grants]);

  const handleRevokeGrant = async (grantId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/contracts/grants/${grantId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error();

      toast.success('Authorization grant revoked cleanly from contract ledger.');

      // Optimistic layout patch update
      setGrantsState((prev) => ({
        ...prev,
        grants: prev.grants.filter((g) => g.id !== grantId),
      }));
    } catch {
      toast.error('Failed to broadcast revocation transaction payload.');
    }
  };

  return (
    <header className="w-full bg-card border-b border-border text-card-foreground shadow-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* BRAND IDENTITY LINK */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-foreground"
          >
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm font-mono">V3</span>
            StellarSplit
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <Link href="/escrow" className="hover:text-foreground transition-colors">
              Escrows
            </Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">
              Settings
            </Link>
          </nav>
        </div>

        {/* GRANT MANAGEMENT & WALLET RUNTIME ACTIONS */}
        <div className="flex items-center gap-4">
          {connected && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background hover:bg-muted/50 text-xs font-semibold cursor-pointer transition-colors"
                aria-expanded={isDropdownOpen}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    grantsState.grants.length > 0
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-muted-foreground'
                  }`}
                />
                <span className="hidden sm:inline text-foreground">{activeScopesFormatted}</span>
                {grantsState.pendingCount > 0 && (
                  <span className="bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-md text-[10px] min-w-[16px] text-center">
                    {grantsState.pendingCount}
                  </span>
                )}
              </button>

              {/* INTERACTIVE OVERLAY PANEL */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg p-4 space-y-3 z-50 text-sm">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-bold">Active Ledger Authority</span>
                    <Link
                      href="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-xs text-blue-500 hover:underline font-medium"
                    >
                      Manage All
                    </Link>
                  </div>

                  {grantsState.loading ? (
                    <div className="text-xs text-muted-foreground animate-pulse py-2 text-center">
                      Syncing delegation keys...
                    </div>
                  ) : grantsState.grants.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto divide-y divide-border space-y-2 pr-1">
                      {grantsState.grants.map((grant) => (
                        <div
                          key={grant.id}
                          className="pt-2 first:pt-0 flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-mono font-bold uppercase tracking-wider text-blue-500 text-[10px]">
                              {grant.scope.replace('_', ' ')}
                            </div>
                            <div className="text-muted-foreground truncate font-mono text-[11px]">
                              Target: {grant.grantee}
                            </div>
                            {grant.authorizedAmount && (
                              <div className="font-medium text-foreground">
                                Limit: {grant.authorizedAmount} {grant.assetSymbol || 'XLM'}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => void handleRevokeGrant(grant.id, e)}
                            className="text-[10px] font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 px-2 py-1 rounded transition-colors cursor-pointer shrink-0"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No delegated allowances bound to this address.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STANDARD AUTH ENTRIES */}
          {connected && publicKey ? (
            <div className="h-9 px-3 bg-muted/60 text-muted-foreground rounded-lg inline-flex items-center text-xs font-mono font-medium border border-border max-w-[140px] truncate">
              {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
            </div>
          ) : (
            <button
              onClick={() => connect?.()}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
