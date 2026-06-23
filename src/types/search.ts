export interface ISplitTransactionRecord {
  id: string;
  title: string;
  amount: string;
  assetSymbol: string;
  senderAddress: string;
  timestamp: string;
  category: "escrow" | "direct_split" | "fee_allocation";
}

export interface ISearchFilterState {
  query: string;
  category: string;
}