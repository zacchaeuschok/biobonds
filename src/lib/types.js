// XRPL Configuration and Types
export const XRPL_CONFIG = {
  TESTNET_URL: 'wss://s.altnet.rippletest.net:51233',
  MAINNET_URL: 'wss://xrplcluster.com',
  NETWORK: 'testnet' // Change to 'mainnet' for production
};

// Type definitions using JSDoc for better IDE support
/**
 * @typedef {Object} BioBond
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} healthOutcome
 * @property {number} targetAmount
 * @property {number} currentAmount
 * @property {number} yieldRate
 * @property {string} maturityDate
 * @property {'active' | 'funded' | 'completed' | 'expired'} status
 * @property {string} [escrowAddress]
 * @property {string} [conditionHash]
 * @property {Object} provider
 * @property {string} provider.name
 * @property {string} provider.location
 * @property {boolean} provider.verified
 * @property {Array<Object>} outcomes
 */

/**
 * @typedef {Object} Investment
 * @property {string} id
 * @property {string} bondId
 * @property {number} amount
 * @property {string} investmentDate
 * @property {'active' | 'settled' | 'cancelled'} status
 * @property {number} yieldEarned
 * @property {string} [escrowTxHash]
 */

/**
 * @typedef {Object} HealthCredential
 * @property {string} id
 * @property {string} bondId
 * @property {string} issuerDid
 * @property {string} subjectDid
 * @property {string} credentialType
 * @property {string} issuedAt
 * @property {string} [expiresAt]
 * @property {boolean} verified
 * @property {Object} outcomeData
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} walletAddress
 * @property {'investor' | 'provider' | 'patient'} userType
 * @property {boolean} verified
 * @property {number} [totalInvested]
 * @property {number} [totalYieldEarned]
 * @property {number} [activeBonds]
 */

