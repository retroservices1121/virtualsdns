// walletconnect-config.js
import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, metaMask, injected } from 'wagmi/connectors';
import { createPublicClient } from 'viem';

// WalletConnect Project ID - Get this from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'your_project_id_here';

// App metadata for WalletConnect
const metadata = {
  name: 'VirtualsDNS.fun',
  description: 'DNS for AI Agents - Register .virtuals.base domains',
  url: 'https://virtualsdns.fun',
  icons: ['https://virtualsdns.fun/icon-192x192.png']
};

// Configure supported wallets
const connectors = [
  // WalletConnect - Works with 300+ wallets
  walletConnect({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata,
    showQrModal: true,
    qrModalOptions: {
      themeMode: 'dark',
      themeVariables: {
        '--wcm-z-index': '1000',
        '--wcm-accent-color': '#8b5cf6',
        '--wcm-background-color': '#1f2937'
      }
    }
  }),

  // Coinbase Wallet - Popular for Base network
  coinbaseWallet({
    appName: metadata.name,
    appLogoUrl: metadata.icons[0],
    darkMode: true,
    preference: 'smartWalletOnly' // Use Smart Wallet by default
  }),

  // MetaMask - Most popular
  metaMask({
    dappMetadata: metadata,
    infuraAPIKey: process.env.REACT_APP_INFURA_KEY // Optional for better reliability
  }),

  // Injected - For other browser wallets
  injected({
    target: 'metaMask'
  })
];

// Configure chains
const chains = [base, baseSepolia];

// Configure transports
const transports = {
  [base.id]: http('https://mainnet.base.org'),
  [baseSepolia.id]: http('https://sepolia.base.org')
};

// Create wagmi config
export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports,
  ssr: false // Important for Next.js
});

// Public client for read operations
export const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org')
});

// Chain configuration
export const supportedChains = {
  [base.id]: {
    name: 'Base',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorers: [{ name: 'BaseScan', url: 'https://basescan.org' }],
    contracts: {
      registry: process.env.REACT_APP_REGISTRY_ADDRESS,
      usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      virtual: '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b'
    }
  },
  [baseSepolia.id]: {
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorers: [{ name: 'BaseScan', url: 'https://sepolia.basescan.org' }],
    contracts: {
      registry: process.env.REACT_APP_REGISTRY_ADDRESS_TESTNET,
      usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      virtual: '0x...' // Your testnet VIRTUAL token address
    }
  }
};

export default wagmiConfig;
