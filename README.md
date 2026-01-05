# SAMM Rise Frontend

A modern, responsive frontend for the SAMM (Sharded Automated Market Maker) DEX on RiseChain testnet.

## 🚀 Features

- **Real-time Swap Quotes**: Get instant quotes from RiseChain liquidity pools
- **c-smaller-better Optimization**: Automatic selection of optimal shards for best rates
- **Multi-hop Routing**: Seamless token swaps through intermediate pairs
- **8 Supported Tokens**: WETH, WBTC, USDC, USDT, DAI, LINK, UNI, AAVE
- **33 Liquidity Pools**: $13.875M total value locked
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Real-time Updates**: Live price impact and fee calculations

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Wagmi** - Ethereum interactions
- **RainbowKit** - Wallet connection
- **Lucide React** - Icons

## 📋 Prerequisites

- Node.js 18+ or Bun
- Backend server running on port 3000

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install
# or
bun install
```

### Environment Setup

Create a `.env.local` file:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000

# WalletConnect Project ID (optional)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Alchemy API Key (optional)
VITE_ALCHEMY_API_KEY=your_alchemy_key
```

### Development

```bash
# Start dev server
npm run dev
# or
bun run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Build

```bash
# Build for production
npm run build
# or
bun run build
```

## 🔗 Backend Integration

This frontend connects to the unified multi-chain SAMM backend. Make sure the backend is running:

```bash
cd ../rise-evm-server/services
npm run start:multichain
```

Backend should be available at `http://localhost:3000`

## 🧪 Testing

### API Test Page

Open `test-api.html` in your browser to test backend connectivity:
- Health check
- Chain information
- Shard listing
- Swap quotes

### Manual Testing

1. Open the app at http://localhost:8080
2. Select tokens (e.g., USDC → USDT)
3. Enter an amount (e.g., 1)
4. Verify quote appears with:
   - Exchange rate
   - Shard name
   - Fees
   - Price impact

## 📊 Available Pairs

### Stablecoin Pairs (9 shards)
- USDC-USDT: 3 shards ($100K, $500K, $2M)
- USDC-DAI: 3 shards ($100K, $500K, $1.5M)
- USDT-DAI: 3 shards ($50K, $250K, $1M)

### Major Token Pairs (9 shards)
- WETH-USDC: 3 shards ($50K, $250K, $1M)
- WBTC-USDC: 3 shards ($100K, $500K, $2M)
- WETH-WBTC: 3 shards ($100K, $500K, $1.5M)

### Alt Token Pairs (15 shards)
- LINK-USDC: 3 shards ($25K, $100K, $500K)
- UNI-USDC: 3 shards ($25K, $100K, $400K)
- AAVE-USDC: 3 shards ($25K, $100K, $300K)
- WETH-LINK: 2 shards ($20K, $80K)
- WETH-UNI: 2 shards ($20K, $80K)
- WETH-AAVE: 2 shards ($20K, $80K)

## 🏗️ Project Structure

```
rise-samm-gui/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── EnhancedSwapCard.tsx
│   │   ├── TokenSelectModal.tsx
│   │   └── ...
│   ├── config/           # Configuration files
│   │   ├── chains.ts     # Chain configurations
│   │   ├── tokens.ts     # Token definitions
│   │   └── web3.ts       # Web3 setup
│   ├── services/         # API services
│   │   └── sammApi.ts    # Backend API client
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript types
├── public/               # Static assets
├── test-api.html        # API testing page
└── ...
```

## 🔧 Configuration

### Chains

Configured in `src/config/chains.ts`:
- RiseChain Testnet (Chain ID: 11155931)
- Ethereum Mainnet
- Arbitrum
- Optimism
- Polygon
- Base

### Tokens

Token addresses configured in `src/config/tokens.ts` for each chain.

### API Service

Backend integration in `src/services/sammApi.ts`:
- Health checks
- Chain information
- Shard queries
- Swap quotes (direct + multi-hop)

## 🎨 UI Components

### EnhancedSwapCard
Main swap interface with:
- Token selection
- Amount input
- Real-time quotes
- Route information
- Fee breakdown
- Price impact display

### TokenSelectModal
Token selection modal with:
- Search functionality
- Popular tokens
- Token balances
- USD values

## 🐛 Troubleshooting

### Backend Connection Issues

```bash
# Check backend is running
curl http://localhost:3000/health

# Should return:
# {"status":"ok","service":"unified-multi-chain-backend",...}
```

### No Quote Appearing

1. Check browser console for errors (F12)
2. Verify token addresses match deployment
3. Try a known working pair (USDC-USDT)
4. Check backend logs

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation

- [Testing Guide](../TESTING_GUIDE.md)
- [Integration Details](../FRONTEND_INTEGRATION_COMPLETE.md)
- [API Documentation](../RISECHAIN_API_TESTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of the SAMM DEX ecosystem.

## 🔗 Links

- [RiseChain Testnet](https://testnet.riselabs.xyz)
- [Backend Repository](../rise-evm-server)

## 🎯 Roadmap

- [ ] Wallet connection (WalletConnect)
- [ ] Transaction execution
- [ ] Transaction history
- [ ] Liquidity management
- [ ] Pool analytics
- [ ] Multi-chain support (Monad)
- [ ] Mobile responsive improvements
- [ ] Dark/Light theme toggle

## 💡 Support

For issues and questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [Testing Guide](../TESTING_GUIDE.md)
3. Open an issue on GitHub

---

Built with ❤️ for the RiseChain ecosystem
