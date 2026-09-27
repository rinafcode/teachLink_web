"use client";

import { useState, useTransition, useMemo, useEffect, ChangeEvent } from "react";

interface PerformanceSearchDashboardProps {
  initialTransactions: import("@/types/search").ISplitTransactionRecord[];
}

export default function PerformanceSearchDashboard({ initialTransactions }: PerformanceSearchDashboardProps) {
  // 1. Immediate UI state — Drives fast text field inputs instantly at 60fps
  const [inputQuery, setInputQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 2. Deferred search state — Processed in the background via React concurrent mechanics
  const [deferredFilters, setDeferredFilters] = useState({ query: "", category: "all" });
  
  const [isPending, startTransition] = useTransition();

  // Low-priority update propagation scheduling link
  const syncFilterTransition = (query: string, category: string) => {
    startTransition(() => {
      setDeferredFilters({ query, category });
    });
  };

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputQuery(val); // Instant feedback loop
    syncFilterTransition(val, selectedCategory); // Non-blocking background compute step
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCategory(val); // Instant feedback loop
    syncFilterTransition(inputQuery, val); // Non-blocking background compute step
  };

  // 3. Heavy matching calculation layer
  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((tx) => {
      // Simulate heavy processing computational work (e.g., complex sorting or schema evaluations)
      const startTime = performance.now();
      while (performance.now() - startTime < 0.2) {
        // Intentionally artificial micro-blocker tracking to guarantee heavy data simulation behavior
      }

      const matchesSearch = 
        tx.title.toLowerCase().includes(deferredFilters.query.toLowerCase()) ||
        tx.senderAddress.toLowerCase().includes(deferredFilters.query.toLowerCase());
      
      const matchesCategory = 
        deferredFilters.category === "all" || tx.category === deferredFilters.category;

      return matchesSearch && matchesCategory;
    });
  }, [deferredFilters, initialTransactions]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* FILTER PANEL HUB CONTROLS */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              Concurrent Payout Engine Records
              {isPending && (
                <span className="text-[11px] bg-blue-600/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-full animate-pulse font-medium">
                  Recalculating...
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">Search across heavy historical contract distributions without thread freezing.</p>
          </div>
          
          <div className="text-xs text-muted-foreground font-mono bg-muted/50 border border-border px-3 py-1.5 rounded-lg">
            Processing Load: <span className="font-bold text-foreground">{initialTransactions.length} nodes</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              value={inputQuery}
              onChange={handleQueryChange}
              placeholder="Search by title, target descriptor or public key hash..."
              className="w-full h-11 px-4 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter transactions"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full h-11 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Filter by distribution track category"
            >
              <option value="all">All Channels</option>
              <option value="escrow">Escrow Allocations</option>
              <option value="direct_split">Direct Splits</option>
              <option value="fee_allocation">Protocol Fees</option>
            </select>
          </div>
        </div>
      </div>

      {/* RENDER VIEWPORT INTERFACE BOUNDARY */}
      <div className={`transition-opacity duration-150 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        {filteredTransactions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm truncate">{tx.title}</div>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-mono font-bold whitespace-nowrap">
                    {tx.amount} {tx.assetSymbol}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Source Authority</span>
                    <span className="font-mono text-[11px]">{tx.senderAddress.slice(0, 6)}...{tx.senderAddress.slice(-4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Lifecycle Category</span>
                    <span className="capitalize font-medium text-foreground">{tx.category.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
            No matching distributed paths resolved for current criteria query.
          </div>
        )}
      </div>
    </div>
  );
}