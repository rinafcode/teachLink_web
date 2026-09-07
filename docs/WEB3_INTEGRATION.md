# Advanced Web3 Wallet Integration Guide

## Overview

This guide provides comprehensive documentation for the Advanced Web3 Wallet Integration system implemented for TeachLink. The integration provides seamless multi-chain wallet connectivity, transaction management, NFT interactions, and DeFi protocol engagement.

## Architecture Overview

### Core Components

```
src/
├── hooks/
│   └── useWeb3Wallet.ts                 # Main wallet management hook
├── components/web3/
│   ├── WalletConnector.tsx              # UI for wallet connection
│   ├── TransactionManager.tsx           # Transaction building & tracking
│   ├── NFTGallery.tsx                   # NFT display & interaction
│   ├── DeFiInterface.tsx                # DeFi staking & rewards
│   └── index.ts                         # Barrel export
└── utils/web3/
    ├── envValidation.ts                 # Environment validation
    ├── walletValidation.ts              # Wallet availability checks
    ├── security.ts                      # Security & validation utilities
    └── index.ts                         # Barrel export
```

## Quick Start

### 1. Setup Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_STARKNET_NETWORK=goerli-alpha
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-testnet.public.blastapi.io
```

### 2. Wrap Your App with Wallet Provider

The WalletProvider is already included in `RootProviders`. Wallets are globally available.

### 3. Use the Hook in Your Component

```tsx
'use client';

import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

export function MyComponent() {
  const wallet = useWeb3Wallet();

  return (
    <div>
      {wallet.isConnected ? (
        <p>Connected: {wallet.address}</p>
      ) : (
        <button onClick={() => wallet.connect('metamask')}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## Component Documentation

### WalletConnector

The `WalletConnector` component provides a complete wallet connection UI.

**Features:**

- Multi-provider support (MetaMask, Starknet, WalletConnect, Coinbase)
- Connection status indicator
- Address display with copy-to-clipboard
- Balance display (optional)
- Responsive design
- Dark mode support
- Error handling

**Usage:**

```tsx
import { WalletConnector } from '@/components/web3';

export function Header() {
  return (
    <div className="flex justify-between items-center">
      <h1>TeachLink</h1>
      <WalletConnector
        showBalance={true}
        onConnect={(address, provider) => {
          console.log(`Connected to ${provider}: ${address}`);
        }}
      />
    </div>
  );
}
```

**Props:**

| Prop           | Type       | Default     | Description                      |
| -------------- | ---------- | ----------- | -------------------------------- |
| `className`    | `string`   | `''`        | Additional CSS classes           |
| `showBalance`  | `boolean`  | `false`     | Display wallet balances          |
| `onConnect`    | `function` | `undefined` | Callback when wallet connects    |
| `onDisconnect` | `function` | `undefined` | Callback when wallet disconnects |

### TransactionManager

Comprehensive transaction management with signing, confirmation, and tracking.

**Features:**

- Build transactions with gas settings
- Advanced options (gas limit, data)
- Transaction history with local persistence
- Real-time status tracking
- Explorer integration
- Error recovery

**Usage:**

```tsx
import { TransactionManager } from '@/components/web3';

export function PaymentComponent() {
  return (
    <TransactionManager
      onTransactionSent={(txHash) => {
        console.log('Transaction sent:', txHash);
      }}
    />
  );
}
```

**Props:**

| Prop                 | Type       | Description                  |
| -------------------- | ---------- | ---------------------------- |
| `className`          | `string`   | Additional CSS classes       |
| `onTransactionSent`  | `function` | Called with transaction hash |
| `onTransactionError` | `function` | Called on transaction error  |

### NFTGallery

Display and manage NFT collections with filtering and detailed views.

**Features:**

- Grid and list view modes
- NFT filtering and search
- Detailed NFT information with attributes
- Rarity indicators
- Minting interface
- Pagination support
- Mock data for demo (production: integrate with OpenSea, Alchemy, etc.)

**Usage:**

```tsx
import { NFTGallery } from '@/components/web3';

export function NFTsPage() {
  return (
    <NFTGallery
      showMintButton={true}
      onNFTSelect={(nft) => {
        console.log('Selected NFT:', nft);
      }}
      onMintClick={() => {
        // Navigate to mint page or show modal
      }}
    />
  );
}
```

**Props:**

| Prop             | Type       | Description                     |
| ---------------- | ---------- | ------------------------------- |
| `className`      | `string`   | Additional CSS classes          |
| `onNFTSelect`    | `function` | Called when NFT is selected     |
| `showMintButton` | `boolean`  | Display mint button             |
| `onMintClick`    | `function` | Called when mint button clicked |

### DeFiInterface

Access and manage DeFi protocols for staking and earning rewards.

**Features:**

- Browse multiple staking protocols
- Compare APY and TVL
- Risk assessment indicators
- Staking position tracking
- Reward monitoring
- Lock period management
- Real-time balance updates

**Usage:**

```tsx
import { DeFiInterface } from '@/components/web3';

export function DeFiPage() {
  return (
    <DeFiInterface
      onStake={(protocol, amount, duration) => {
        console.log(`Staked ${amount} in ${protocol}`);
      }}
    />
  );
}
```

**Props:**

| Prop        | Type       | Description                 |
| ----------- | ---------- | --------------------------- |
| `className` | `string`   | Additional CSS classes      |
| `onStake`   | `function` | Called with staking details |
| `onUnstake` | `function` | Called when unstaking       |

## useWeb3Wallet Hook

The core hook for wallet management. Use this for deeper integration beyond components.

**Key Methods:**

```tsx
const wallet = useWeb3Wallet();

// Connection
wallet.connect('metamask'); // Connect to MetaMask
wallet.disconnect(); // Disconnect wallet

// Chain management
wallet.switchChain('0x89'); // Switch to Polygon

// Transactions
wallet.sendTransaction({
  // Send transaction
  to: '0x...',
  value: '1000000000000000000',
  data: '0x',
});

// Message signing
wallet.signMessage('message to sign'); // Sign arbitrary message

// State
wallet.address; // Connected address
wallet.isConnected; // Connection status
wallet.chainId; // Current chain ID
wallet.provider; // Wallet provider type
wallet.balances; // Token balances
wallet.error; // Last error
```

**Return Type:**

```typescript
interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: WalletProvider | null;
  chainId: string | null;
  balances: WalletBalance[];
  error: string | null;
}
```

## Security Features

### Built-in Validation

All components include comprehensive security checks:

```tsx
import { performSecurityChecks, isValidAddress, validateTransaction } from '@/utils/web3';

// Security checks on transactions
const result = performSecurityChecks(toAddress, value, userAddress, chainId);

if (!result.isSecure) {
  console.error('Security warnings:', result.warnings);
  console.error('Errors:', result.errors);
}

// Address validation
if (!isValidAddress('0x...')) {
  console.error('Invalid address');
}

// Transaction validation
const validated = validateTransaction(txData);
if (!validated.valid) {
  console.error('Invalid transaction:', validated.error);
}
```

### Rate Limiting

Prevent abuse with built-in rate limiting:

```tsx
import { walletActionRateLimiter } from '@/utils/web3';

if (walletActionRateLimiter.isLimited('connect')) {
  console.warn('Too many connection attempts');
  // Show user a message
  return;
}
```

## Supported Wallets & Chains

### Wallets

- **MetaMask**: EVM-compatible chains (Ethereum, Polygon, etc.)
- **Starknet**: StarknetKit integration (ArgentX, Braavos)
- **WalletConnect**: Protocol v2
- **Coinbase Wallet**: EVM compatibility

### Chains

| Chain            | ID        | RPC             | Explorer               |
| ---------------- | --------- | --------------- | ---------------------- |
| Ethereum Mainnet | `0x1`     | BlastAPI        | etherscan.io           |
| Polygon          | `0x89`    | polygon-rpc.com | polygonscan.com        |
| Polygon Mumbai   | `0x13881` | Mumbai RPC      | mumbai.polygonscan.com |

## Integration Examples

### Full Page Example

```tsx
'use client';

import { WalletConnector, TransactionManager, NFTGallery, DeFiInterface } from '@/components/web3';
import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

export default function Web3Dashboard() {
  const wallet = useWeb3Wallet();

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Web3 Dashboard</h1>
          <WalletConnector />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <WalletConnector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TransactionManager />
        <DeFiInterface />
      </div>

      <NFTGallery />
    </div>
  );
}
```

### Custom Hook Usage

```tsx
'use client';

import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

export function BalanceDisplay() {
  const wallet = useWeb3Wallet();

  return (
    <div>
      {wallet.isConnected ? (
        <>
          <p>Address: {wallet.address}</p>
          <p>Network: {wallet.supportedChains[wallet.chainId || '0x1']?.chainName}</p>
          {wallet.balances.map((balance) => (
            <div key={balance.token}>
              {balance.balance} {balance.symbol}
              {balance.usdValue && ` ($${balance.usdValue})`}
            </div>
          ))}
        </>
      ) : (
        <button onClick={() => wallet.connect('metamask')}>Connect</button>
      )}
    </div>
  );
}
```

## Development & Testing

### Testing Components

Components include:

- Loading states
- Error handling
- Empty states
- Success confirmations
- Responsive design

### Mock Data

Components use realistic mock data for demonstration:

- **NFTGallery**: Sample NFT metadata
- **DeFiInterface**: Real protocol data structure
- **TransactionManager**: Transaction history format

For production, integrate with:

- **NFT data**: OpenSea API, Alchemy, Moralis
- **DeFi data**: The Graph, Uniswap V3, Aave protocols
- **Transactions**: Etherscan API

## Performance Considerations

### Optimize Bundle Size

Components use tree-shaking. Import only what you need:

```tsx
// Good - only includes WalletConnector
import { WalletConnector } from '@/components/web3';

// Avoid - includes all web3 components
import * as Web3 from '@/components/web3';
```

### Lazy Loading

Components are small enough for direct import, but can be lazy-loaded:

```tsx
import dynamic from 'next/dynamic';

const DeFiInterface = dynamic(
  () => import('@/components/web3').then((mod) => ({ default: mod.DeFiInterface })),
  { ssr: false },
);
```

## Common Issues & Solutions

### Issue: "Wallet not detected"

**Solution**: Ensure wallet extension is installed and enabled in browser

### Issue: "Network mismatch"

**Solution**: Use `wallet.switchChain()` to switch to correct network

### Issue: "Transaction rejected"

**Solution**: Check gas settings and ensure sufficient balance

### Issue: "Address format error"

**Solution**: Use `isValidAddress()` to validate before submission

## Best Practices

1. **Always validate addresses** before sending transactions
2. **Handle errors gracefully** with user-friendly messages
3. **Show loading states** during async operations
4. **Implement rate limiting** for sensitive operations
5. **Use dark mode** support utilities for consistency
6. **Test with multiple wallets** for compatibility
7. **Monitor gas prices** before recommending transactions
8. **Implement fallbacks** for network errors

## Next Steps

### Phase 2 Features (Future)

- [ ] Advanced contract interaction UI
- [ ] Gas optimization recommendations
- [ ] Multi-sig wallet support
- [ ] Token swapping interface
- [ ] Governance voting UI
- [ ] Wallet analytics dashboard
- [ ] Smart contract deployment helper

## Support & Resources

- **Issues**: Check components for error messages
- **Docs**: Read JSDoc comments in source code
- **Examples**: See Implementation section above
- **Types**: Full TypeScript support with interfaces

## License

MIT © 2025 TeachLink DAO

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Production Ready
