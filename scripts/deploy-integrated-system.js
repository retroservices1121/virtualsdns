// deploy-integrated-system.js - Enhanced Production Deployment Script
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

// Base network token addresses (verified)
const BASE_MAINNET_ADDRESSES = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Official USDC on Base
  VIRTUAL: "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b", // VIRTUAL token on Base
  WETH: "0x4200000000000000000000000000000000000006" // Wrapped ETH on Base
};

const BASE_SEPOLIA_ADDRESSES = {
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
  VIRTUAL: "0x...", // Deploy test token or use existing
  WETH: "0x4200000000000000000000000000000000000006" // WETH on Base Sepolia
};

// Enhanced premium names with strategic selections
const PREMIUM_NAMES = {
  // Ultra-rare single characters and numbers
  singleChars: [
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
  ],
  
  // High-value AI and tech keywords
  aiKeywords: [
    "ai", "bot", "agent", "gpt", "claude", "chatgpt", "openai", "anthropic",
    "virtual", "virtuals", "meta", "crypto", "web3", "defi", "nft", 
    "genesis", "grok", "virgen", "llm", "ml", "neural", "model"
  ],
  
  // Popular names and brands
  popularNames: [
    "alice", "bob", "charlie", "david", "emma", "frank", "grace",
    "joe", "joseph", "jp", "alex", "sarah", "mike", "anna", "tom"
  ],
  
  // Business and finance terms
  businessTerms: [
    "ceo", "founder", "startup", "trade", "invest", "stake", "yield",
    "dao", "governance", "treasury", "protocol", "network", "finance",
    "bank", "exchange", "market", "fund", "capital", "venture"
  ],
  
  // Base ecosystem terms
  baseEcosystem: [
    "base", "coinbase", "layer2", "l2", "ethereum", "eth", "bridge",
    "superchain", "optimism", "scaling", "rollup"
  ],
  
  // Gaming and metaverse
  gaming: [
    "game", "gaming", "play", "player", "guild", "quest", "level",
    "avatar", "metaverse", "world", "realm", "universe"
  ]
};

// Enhanced premium name valuations (in USD)
const PREMIUM_VALUATIONS = {
  singleChar: 100000,    // $100k for single characters
  aiKeyword: 50000,      // $50k for AI keywords
  popularName: 10000,    // $10k for popular names
  businessTerm: 25000,   // $25k for business terms
  baseEcosystem: 75000,  // $75k for Base ecosystem terms
  gaming: 15000          // $15k for gaming terms
};

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  // Gas configuration
  gasLimit: {
    deployment: 5000000,
    batchRegister: 3000000,
    addPremium: 200000
  },
  
  // Batch sizes to avoid gas limit issues
  batchSizes: {
    register: 10,      // Register 10 names per transaction
    premium: 5         // Add 5 premium records per transaction
  },
  
  // Confirmation blocks
  confirmations: {
    mainnet: 5,
    testnet: 2
  },
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 5000 // 5 seconds
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function logStep(step, message) {
  console.log(`\n${step} ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logWarning(message) {
  console.log(`⚠️ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️ ${message}`);
}

// Sleep utility for retries
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper for transactions
async function withRetry(operation, maxRetries = DEPLOYMENT_CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      logWarning(`Attempt ${attempt} failed: ${error.message}`);
      logInfo(`Retrying in ${DEPLOYMENT_CONFIG.retryDelay / 1000} seconds...`);
      await sleep(DEPLOYMENT_CONFIG.retryDelay);
    }
  }
}

// Batch array into smaller chunks
function batchArray(array, batchSize) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

// Format number with commas
function formatNumber(num) {
  return num.toLocaleString();
}

// Calculate gas cost in ETH
function calculateGasCost(gasUsed, gasPrice) {
  return ethers.utils.formatEther(gasUsed.mul(gasPrice));
}

// ============================================================================
// PRE-DEPLOYMENT CHECKS
// ============================================================================

async function preDeploymentChecks(deployer) {
  logStep("🔍", "Running pre-deployment checks...");
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  const balanceEth = parseFloat(ethers.utils.formatEther(balance));
  
  if (balanceEth < 0.1) {
    throw new Error(`Insufficient ETH balance: ${balanceEth.toFixed(4)} ETH. Need at least 0.1 ETH for deployment.`);
  }
  logSuccess(`Deployer balance: ${balanceEth.toFixed(4)} ETH`);
  
  // Check network
  const network = await ethers.provider.getNetwork();
  const isMainnet = network.chainId === 8453;
  const isTestnet = network.chainId === 84532;
  
  if (!isMainnet && !isTestnet) {
    throw new Error(`Unsupported network. Chain ID: ${network.chainId}. Expected: 8453 (Base) or 84532 (Base Sepolia)`);
  }
  logSuccess(`Network: ${isMainnet ? 'Base Mainnet' : 'Base Sepolia'} (Chain ID: ${network.chainId})`);
  
  // Check gas price
  const gasPrice = await ethers.provider.getGasPrice();
  const gasPriceGwei = parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'));
  
  if (gasPriceGwei > 50) {
    logWarning(`High gas price detected: ${gasPriceGwei.toFixed(2)} Gwei`);
    logInfo("Consider waiting for lower gas prices or proceed with caution");
  } else {
    logSuccess(`Gas price: ${gasPriceGwei.toFixed(2)} Gwei`);
  }
  
  return { network, isMainnet, gasPrice, balance };
}

// ============================================================================
// CONTRACT DEPLOYMENT
// ============================================================================

async function deployContract(addresses, deployer, gasPrice) {
  logStep("📦", "Deploying VirtualsBase Registry contract...");
  
  const VirtualsBaseRegistry = await ethers.getContractFactory("VirtualsBaseRegistry");
  
  // Deploy with explicit gas configuration
  const registry = await withRetry(async () => {
    return await VirtualsBaseRegistry.deploy(
      addresses.USDC, 
      addresses.VIRTUAL,
      {
        gasLimit: DEPLOYMENT_CONFIG.gasLimit.deployment,
        gasPrice: gasPrice
      }
    );
  });
  
  logInfo(`Transaction hash: ${registry.deployTransaction.hash}`);
  
  // Wait for deployment confirmation
  const confirmations = DEPLOYMENT_CONFIG.confirmations.mainnet;
  logInfo(`Waiting for ${confirmations} confirmations...`);
  
  const receipt = await registry.deployTransaction.wait(confirmations);
  
  logSuccess(`Contract deployed to: ${registry.address}`);
  logSuccess(`Gas used: ${formatNumber(receipt.gasUsed.toNumber())}`);
  logSuccess(`Gas cost: ${calculateGasCost(receipt.gasUsed, receipt.effectiveGasPrice)} ETH`);
  
  return registry;
}

// ============================================================================
// PREMIUM NAMES REGISTRATION
// ============================================================================

async function securePremiumNames(registry, deployer, gasPrice) {
  logStep("👑", "Securing premium names...");
  
  const securedNames = {
    singleChars: 0,
    aiKeywords: 0,
    popularNames: 0,
    businessTerms: 0,
    baseEcosystem: 0,
    gaming: 0
  };
  
  let totalGasUsed = ethers.BigNumber.from(0);
  
  // Function to register names in batches
  async function registerBatch(names, category) {
    const batches = batchArray(names, DEPLOYMENT_CONFIG.batchSizes.register);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logInfo(`Registering ${category} batch ${i + 1}/${batches.length}: ${batch.join(', ')}`);
      
      try {
        const tx = await withRetry(async () => {
          return await registry.adminBatchRegister(
            batch,
            Array(batch.length).fill(deployer.address),
            {
              gasLimit: DEPLOYMENT_CONFIG.gasLimit.batchRegister,
              gasPrice: gasPrice
            }
          );
        });
        
        const receipt = await tx.wait();
        totalGasUsed = totalGasUsed.add(receipt.gasUsed);
        securedNames[category] += batch.length;
        
        logSuccess(`Secured ${batch.length} ${category} names (Gas: ${formatNumber(receipt.gasUsed.toNumber())})`);
        
        // Small delay between batches to avoid overwhelming the network
        if (i < batches.length - 1) {
          await sleep(1000);
        }
        
      } catch (error) {
        logError(`Failed to register ${category} batch: ${error.message}`);
        // Continue with next batch rather than failing completely
      }
    }
  }
  
  // Register each category
  try {
    await registerBatch(PREMIUM_NAMES.singleChars, 'singleChars');
    await registerBatch(PREMIUM_NAMES.aiKeywords, 'aiKeywords');
    await registerBatch(PREMIUM_NAMES.popularNames, 'popularNames');
    await registerBatch(PREMIUM_NAMES.businessTerms, 'businessTerms');
    await registerBatch(PREMIUM_NAMES.baseEcosystem, 'baseEcosystem');
    await registerBatch(PREMIUM_NAMES.gaming, 'gaming');
  } catch (error) {
    logError(`Premium name registration failed: ${error.message}`);
  }
  
  return { securedNames, totalGasUsed };
}

// ============================================================================
// PREMIUM NAME RECORDS
// ============================================================================

async function addPremiumRecords(registry, gasPrice) {
  logStep("💎", "Adding premium name records...");
  
  const premiumRecords = [
    // Sample single characters
    ...PREMIUM_NAMES.singleChars.slice(0, 5).map(name => ({
      name,
      value: PREMIUM_VALUATIONS.singleChar,
      category: "Single Character"
    })),
    
    // Sample AI keywords
    ...PREMIUM_NAMES.aiKeywords.slice(0, 5).map(name => ({
      name,
      value: PREMIUM_VALUATIONS.aiKeyword,
      category: "AI Keyword"
    })),
    
    // Sample Base ecosystem terms
    ...PREMIUM_NAMES.baseEcosystem.slice(0, 3).map(name => ({
      name,
      value: PREMIUM_VALUATIONS.baseEcosystem,
      category: "Base Ecosystem"
    }))
  ];
  
  const batches = batchArray(premiumRecords, DEPLOYMENT_CONFIG.batchSizes.premium);
  let addedRecords = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    logInfo(`Adding premium records batch ${i + 1}/${batches.length}`);
    
    for (const record of batch) {
      try {
        const tx = await withRetry(async () => {
          return await registry.addPremiumName(
            record.name,
            record.value,
            record.category,
            {
              gasLimit: DEPLOYMENT_CONFIG.gasLimit.addPremium,
              gasPrice: gasPrice
            }
          );
        });
        
        await tx.wait();
        addedRecords++;
        logSuccess(`Added premium record: ${record.name} ($${formatNumber(record.value)})`);
        
      } catch (error) {
        logWarning(`Could not add premium record for ${record.name}: ${error.message}`);
      }
    }
    
    // Delay between batches
    if (i < batches.length - 1) {
      await sleep(1000);
    }
  }
  
  return addedRecords;
}

// ============================================================================
// POST-DEPLOYMENT SETUP
// ============================================================================

async function createConfigFiles(registry, deployer, network, totalValue, securedNames) {
  logStep("📝", "Creating configuration files...");
  
  // Create enhanced .env.production file
  const envContent = `# VirtualsBase Production Configuration
# Generated on ${new Date().toISOString()}

# Contract Configuration
REACT_APP_REGISTRY_ADDRESS=${registry.address}
REACT_APP_USDC_ADDRESS=${network.isMainnet ? BASE_MAINNET_ADDRESSES.USDC : BASE_SEPOLIA_ADDRESSES.USDC}
REACT_APP_VIRTUAL_ADDRESS=${network.isMainnet ? BASE_MAINNET_ADDRESSES.VIRTUAL : BASE_SEPOLIA_ADDRESSES.VIRTUAL}

# Network Configuration
REACT_APP_NETWORK=${network.isMainnet ? 'base-mainnet' : 'base-sepolia'}
REACT_APP_CHAIN_ID=${network.chainId}
REACT_APP_RPC_URL=${network.isMainnet ? 'https://mainnet.base.org' : 'https://sepolia.base.org'}

# Dashboard Configuration
REACT_APP_ADMIN_ADDRESS=${deployer.address}
REACT_APP_PREMIUM_NAMES_SECURED=true
REACT_APP_ESTIMATED_PORTFOLIO_VALUE=${totalValue}

# Analytics Configuration
REACT_APP_ANALYTICS_ENABLED=true
REACT_APP_ENVIRONMENT=${network.isMainnet ? 'production' : 'staging'}

# Performance Configuration
REACT_APP_AUTO_REFRESH_INTERVAL=30000
REACT_APP_CACHE_DURATION=300000

# Security Configuration
REACT_APP_MAX_BATCH_SIZE=10
REACT_APP_CONFIRMATION_BLOCKS=${network.isMainnet ? 5 : 2}
`;

  fs.writeFileSync('.env.production', envContent.trim());
  logSuccess("Created .env.production file");
  
  // Create comprehensive deployment info
  const deploymentInfo = {
    deployment: {
      contractAddress: registry.address,
      deployerAddress: deployer.address,
      network: network.isMainnet ? 'base-mainnet' : 'base-sepolia',
      chainId: network.chainId,
      deploymentTimestamp: new Date().toISOString(),
      deploymentBlock: await ethers.provider.getBlockNumber()
    },
    
    contract: {
      name: "VirtualsBaseRegistry",
      version: "1.0.0",
      verified: false, // Will be updated after verification
      sourceCode: "contracts/VirtualsBaseRegistry.sol"
    },
    
    premiumNames: {
      secured: securedNames,
      totalSecured: Object.values(securedNames).reduce((a, b) => a + b, 0),
      categories: {
        singleChars: {
          names: PREMIUM_NAMES.singleChars,
          valuation: PREMIUM_VALUATIONS.singleChar,
          count: securedNames.singleChars || 0
        },
        aiKeywords: {
          names: PREMIUM_NAMES.aiKeywords,
          valuation: PREMIUM_VALUATIONS.aiKeyword,
          count: securedNames.aiKeywords || 0
        },
        popularNames: {
          names: PREMIUM_NAMES.popularNames,
          valuation: PREMIUM_VALUATIONS.popularName,
          count: securedNames.popularNames || 0
        },
        businessTerms: {
          names: PREMIUM_NAMES.businessTerms,
          valuation: PREMIUM_VALUATIONS.businessTerm,
          count: securedNames.businessTerms || 0
        },
        baseEcosystem: {
          names: PREMIUM_NAMES.baseEcosystem,
          valuation: PREMIUM_VALUATIONS.baseEcosystem,
          count: securedNames.baseEcosystem || 0
        },
        gaming: {
          names: PREMIUM_NAMES.gaming,
          valuation: PREMIUM_VALUATIONS.gaming,
          count: securedNames.gaming || 0
        }
      }
    },
    
    portfolio: {
      estimatedTotalValue: totalValue,
      breakdown: {
        singleChars: (securedNames.singleChars || 0) * PREMIUM_VALUATIONS.singleChar,
        aiKeywords: (securedNames.aiKeywords || 0) * PREMIUM_VALUATIONS.aiKeyword,
        popularNames: (securedNames.popularNames || 0) * PREMIUM_VALUATIONS.popularName,
        businessTerms: (securedNames.businessTerms || 0) * PREMIUM_VALUATIONS.businessTerm,
        baseEcosystem: (securedNames.baseEcosystem || 0) * PREMIUM_VALUATIONS.baseEcosystem,
        gaming: (securedNames.gaming || 0) * PREMIUM_VALUATIONS.gaming
      }
    },
    
    tokenAddresses: network.isMainnet ? BASE_MAINNET_ADDRESSES : BASE_SEPOLIA_ADDRESSES,
    
    links: {
      basescan: `https://${network.isMainnet ? '' : 'sepolia.'}basescan.org/address/${registry.address}`,
      frontend: network.isMainnet ? 'https://virtualsdns.fun' : 'https://staging.virtualsdns.fun',
      github: 'https://github.com/virtualsdns/virtualsdns-fun'
    },
    
    nextSteps: [
      "Verify contract on BaseScan",
      "Update frontend configuration",
      "Set up monitoring and alerts",
      "Configure admin dashboard",
      "Launch marketing campaign"
    ]
  };
  
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  logSuccess("Created deployment-info.json");
  
  // Create quick-start README
  const readmeContent = `# VirtualsBase Deployment

## Contract Information
- **Address**: \`${registry.address}\`
- **Network**: ${network.isMainnet ? 'Base Mainnet' : 'Base Sepolia'}
- **Deployed**: ${new Date().toISOString()}

## Quick Start
\`\`\`bash
# Update frontend
cp .env.production .env

# Verify contract
npm run verify:${network.isMainnet ? 'mainnet' : 'testnet'}

# Start frontend
npm start
\`\`\`

## Admin Functions
- **Dashboard**: Connect with deployer wallet (${deployer.address})
- **Premium Names**: ${Object.values(securedNames).reduce((a, b) => a + b, 0)} secured
- **Portfolio Value**: $${formatNumber(totalValue)}

## Important Links
- [BaseScan](https://${network.isMainnet ? '' : 'sepolia.'}basescan.org/address/${registry.address})
- [Frontend](${network.isMainnet ? 'https://virtualsdns.fun' : 'https://staging.virtualsdns.fun'})

## Support
For technical support, contact the development team.
`;
  
  fs.writeFileSync('DEPLOYMENT.md', readmeContent);
  logSuccess("Created DEPLOYMENT.md");
}

// ============================================================================
// CONTRACT VERIFICATION
// ============================================================================

async function verifyContract(contractAddress, network) {
  logStep("🔍", "Verifying contract on BaseScan...");
  
  const addresses = network.isMainnet ? BASE_MAINNET_ADDRESSES : BASE_SEPOLIA_ADDRESSES;
  
  try {
    await withRetry(async () => {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [addresses.USDC, addresses.VIRTUAL],
      });
    });
    
    logSuccess("Contract verified successfully!");
    return true;
  } catch (error) {
    if (error.message.includes("already verified")) {
      logSuccess("Contract already verified!");
      return true;
    }
    
    logError(`Verification failed: ${error.message}`);
    logInfo("You can verify manually on BaseScan using the following parameters:");
    logInfo(`Constructor Arguments: ["${addresses.USDC}", "${addresses.VIRTUAL}"]`);
    logInfo(`Compiler Version: Check hardhat.config.js for Solidity version`);
    return false;
  }
}

// ============================================================================
// DEPLOYMENT TESTING
// ============================================================================

async function testDeployment(contractAddress) {
  logStep("🧪", "Testing deployment...");
  
  const VirtualsBaseRegistry = await ethers.getContractFactory("VirtualsBaseRegistry");
  const registry = VirtualsBaseRegistry.attach(contractAddress);
  
  const tests = [
    {
      name: "Contract responsiveness",
      test: async () => {
        const isAvailable = await registry.isAvailable("test123");
        return isAvailable === true;
      }
    },
    {
      name: "Dashboard data access",
      test: async () => {
        const dashboardData = await registry.getDashboardData();
        return dashboardData.length >= 8;
      }
    },
    {
      name: "Premium names access",
      test: async () => {
        const premiumNames = await registry.getPremiumNames();
        return premiumNames[0].length >= 0;
      }
    },
    {
      name: "Contract balances",
      test: async () => {
        const balances = await registry.getContractBalances();
        return balances.length >= 3;
      }
    },
    {
      name: "Recent registrations",
      test: async () => {
        const recent = await registry.getRecentRegistrations();
        return Array.isArray(recent);
      }
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        logSuccess(`${test.name}: PASSED`);
        passedTests++;
      } else {
        logWarning(`${test.name}: FAILED (unexpected result)`);
      }
    } catch (error) {
      logWarning(`${test.name}: FAILED (${error.message})`);
    }
  }
  
  const successRate = (passedTests / tests.length) * 100;
  
  if (successRate === 100) {
    logSuccess(`All tests passed! (${passedTests}/${tests.length})`);
  } else if (successRate >= 80) {
    logWarning(`Most tests passed (${passedTests}/${tests.length}). Some features may need attention.`);
  } else {
    logError(`Many tests failed (${passedTests}/${tests.length}). Please investigate.`);
  }
  
  return { passedTests, totalTests: tests.length, successRate };
}

// ============================================================================
// MAIN DEPLOYMENT FUNCTION
// ============================================================================

async function main() {
  console.log("🚀 VirtualsBase Integrated System Deployment");
  console.log("=" .repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Get deployer
    const [deployer] = await ethers.getSigners();
    
    // Pre-deployment checks
    const { network, isMainnet, gasPrice, balance } = await preDeploymentChecks(deployer);
    const addresses = isMainnet ? BASE_MAINNET_ADDRESSES : BASE_SEPOLIA_ADDRESSES;
    
    logInfo(`Deployer: ${deployer.address}`);
    logInfo(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    logInfo(`USDC Address: ${addresses.USDC}`);
    logInfo(`VIRTUAL Address: ${addresses.VIRTUAL}`);
    
    // Deploy contract
    const registry = await deployContract(addresses, deployer, gasPrice);
    
    // Output for GitHub Actions (IMPORTANT: Keep this exact format)
    console.log(`Contract deployed to: ${registry.address}`);
    
    // Secure premium names
    const { securedNames, totalGasUsed } = await securePremiumNames(registry, deployer, gasPrice);
    
    // Add premium records
    const addedRecords = await addPremiumRecords(registry, gasPrice);
    
    // Calculate total portfolio value
    const totalValue = Object.keys(securedNames).reduce((total, category) => {
      const count = securedNames[category] || 0;
      const value = PREMIUM_VALUATIONS[category] || 0;
      return total + (count * value);
    }, 0);
    
    // Create configuration files
    await createConfigFiles(registry, deployer, { isMainnet, chainId: network.chainId }, totalValue, securedNames);
    
    // Calculate deployment costs
    const deploymentTime = (Date.now() - startTime) / 1000;
    const totalGasCost = calculateGasCost(totalGasUsed, gasPrice);
    
    // Display comprehensive summary
    logStep("🎉", "Deployment Summary");
    console.log("=" .repeat(60));
    console.log(`📄 Contract Address: ${registry.address}`);
    console.log(`🌐 Network: ${isMainnet ? 'Base Mainnet' : 'Base Sepolia'} (${network.chainId})`);
    console.log(`⏱️ Deployment Time: ${deploymentTime.toFixed(1)} seconds`);
    console.log(`⛽ Total Gas Used: ${formatNumber(totalGasUsed.toNumber())}`);
    console.log(`💰 Total Gas Cost: ${totalGasCost} ETH`);
    console.log(`👑 Names Secured: ${Object.values(securedNames).reduce((a, b) => a + b, 0)}`);
    console.log(`💎 Premium Records: ${addedRecords}`);
    console.log(`💰 Portfolio Value: $${formatNumber(totalValue)}`);
    
    console.log("\n📊 Secured Names Breakdown:");
    Object.keys(securedNames).forEach(category => {
      const count = securedNames[category] || 0;
      const value = PREMIUM_VALUATIONS[category] || 0;
      const totalCategoryValue = count * value;
      console.log(`  ${category}: ${count} names ($${formatNumber(totalCategoryValue)})`);
    });
    
    console.log("\n📋 Next Steps:");
    console.log("1. 🔍 Verify contract on BaseScan");
    console.log("2. 🎯 Update frontend configuration");
    console.log("3. 📊 Set up admin dashboard");
    console.log("4. 🚀 Launch marketing campaign");
    console.log("5. 📈 Monitor performance metrics");
    
    console.log("\n🔗 Important Links:");
    console.log(`📊 BaseScan: https://${isMainnet ? '' : 'sepolia.'}basescan.org/address/${registry.address}`);
    console.log(`💼 Admin Dashboard: Connect with ${deployer.address}`);
    console.log(`🌐 Frontend: ${isMainnet ? 'https://virtualsdns.fun' : 'https://staging.virtualsdns.fun'}`);
    
    return registry.address;
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    console.error(error);
    process.exitCode = 1;
    throw error;
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

// Main execution with post-deployment tasks
if (require.main === module) {
  main()
    .then(async (contractAddress) => {
      console.log("\n🔄 Running post-deployment tasks...");
      
      // Get network info for verification
      const network = await ethers.provider.getNetwork();
      const isMainnet = network.chainId === 8453;
      
      // Run verification
      try {
        const verified = await verifyContract(contractAddress, { isMainnet });
        
        // Update deployment info with verification status
        if (fs.existsSync('deployment-info.json')) {
          const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
          deploymentInfo.contract.verified = verified;
          deploymentInfo.contract.verificationTimestamp = new Date().toISOString();
          fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
        }
      } catch (error) {
        logError(`Verification step failed: ${error.message}`);
      }
      
      // Run deployment tests
      try {
        await testDeployment(contractAddress);
      } catch (error) {
        logWarning(`Testing step failed: ${error.message}`);
      }
      
      console.log("\n🎊 Deployment Complete! Your .virtuals.base empire is ready!");
      console.log(`💎 Contract: ${contractAddress}`);
      console.log("📋 Check deployment-info.json for complete details");
    })
    .catch((error) => {
      console.error("💥 Deployment pipeline failed:", error.message);
      process.exitCode = 1;
    });
}

// Export for programmatic use
module.exports = { 
  main, 
  verifyContract, 
  testDeployment,
  preDeploymentChecks,
  securePremiumNames,
  PREMIUM_NAMES,
  PREMIUM_VALUATIONS
};
