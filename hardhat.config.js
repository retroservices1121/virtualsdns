// hardhat.config.js - Improved version
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify"); // Updated package name
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Good for contracts called frequently
      },
      // Add this for better debugging
      viaIR: false,
      metadata: {
        bytecodeHash: "none"
      }
    },
  },
  networks: {
    // Base Mainnet
    "base-mainnet": {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: "auto", // Let Hardhat auto-detect gas price
      timeout: 60000, // 1 minute timeout
      // Add gas limit for large contracts
      gas: "auto",
      gasMultiplier: 1.2, // Add 20% buffer for gas estimation
    },
    // Base Sepolia Testnet
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: "auto",
      timeout: 60000,
      gas: "auto",
      gasMultiplier: 1.2,
    },
    // Alternative RPC endpoints for redundancy
    "base-mainnet-alchemy": {
      url: process.env.ALCHEMY_BASE_URL || "https://base-mainnet.g.alchemy.com/v2/" + (process.env.ALCHEMY_API_KEY || ""),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: "auto",
    },
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      timeout: 60000,
    },
    // Hardhat network for testing
    hardhat: {
      chainId: 31337,
      // Fork Base for testing
      forking: process.env.FORK_BASE === "true" ? {
        url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
        blockNumber: undefined, // Latest block
      } : undefined,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY || "",
      "base-sepolia": process.env.BASESCAN_API_KEY || "",
      // Alternative names that Hardhat might use
      "base-mainnet": process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "base-sepolia", 
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base-mainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  // Gas reporting for optimization
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 1, // 1 gwei for Base
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: "ETH",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  // Contract size reporting
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 60000, // Increase timeout for Base network
    reporter: process.env.CI ? "json" : "spec",
  },
  // Add verification settings
  verify: {
    etherscan: {
      apiKey: process.env.BASESCAN_API_KEY,
    }
  },
  // Default network for commands
  defaultNetwork: process.env.NODE_ENV === "production" ? "base-mainnet" : "localhost",
};
