import * as xrpl from 'xrpl';
import { XRPL_CONFIG } from './types.js';

class XRPLService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new xrpl.Client(XRPL_CONFIG.TESTNET_URL);
      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to XRPL testnet');
      return true;
    } catch (error) {
      console.error('Failed to connect to XRPL:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async createTestWallet() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Create a test wallet with funded XRP
      const { wallet, balance } = await this.client.fundWallet();
      
      return {
        address: wallet.address,
        seed: wallet.seed,
        balance: balance
      };
    } catch (error) {
      console.error('Failed to create test wallet:', error);
      throw error;
    }
  }

  async getAccountInfo(address) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const response = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });

      return {
        address: response.result.account_data.Account,
        balance: xrpl.dropsToXrp(response.result.account_data.Balance),
        sequence: response.result.account_data.Sequence
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  }

  async createEscrow(params) {
    try {
      const { 
        senderWallet, 
        destinationAddress, 
        amount, 
        condition, 
        cancelAfter 
      } = params;

      if (!this.isConnected) {
        await this.connect();
      }

      // Create escrow transaction
      const escrowTx = {
        TransactionType: 'EscrowCreate',
        Account: senderWallet.address,
        Destination: destinationAddress,
        Amount: xrpl.xrpToDrops(amount.toString()),
        Condition: condition,
        CancelAfter: cancelAfter
      };

      // Submit transaction
      const prepared = await this.client.autofill(escrowTx);
      const signed = senderWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      return {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        txHash: result.result.hash,
        escrowSequence: result.result.Sequence
      };
    } catch (error) {
      console.error('Failed to create escrow:', error);
      throw error;
    }
  }

  async finishEscrow(params) {
    try {
      const { 
        finisherWallet, 
        ownerAddress, 
        escrowSequence, 
        condition, 
        fulfillment 
      } = params;

      if (!this.isConnected) {
        await this.connect();
      }

      const finishTx = {
        TransactionType: 'EscrowFinish',
        Account: finisherWallet.address,
        Owner: ownerAddress,
        OfferSequence: escrowSequence,
        Condition: condition,
        Fulfillment: fulfillment
      };

      const prepared = await this.client.autofill(finishTx);
      const signed = finisherWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      return {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        txHash: result.result.hash
      };
    } catch (error) {
      console.error('Failed to finish escrow:', error);
      throw error;
    }
  }

  // Mock credential creation (would integrate with XRPL DID in production)
  async createHealthCredential(params) {
    try {
      const { 
        issuerAddress, 
        subjectAddress, 
        credentialType, 
        outcomeData 
      } = params;

      // In a real implementation, this would create a verifiable credential
      // using XRPL's DID functionality
      const credential = {
        id: `cred_${Date.now()}`,
        issuer: issuerAddress,
        subject: subjectAddress,
        type: credentialType,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: subjectAddress,
          healthOutcome: outcomeData
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date().toISOString(),
          verificationMethod: `${issuerAddress}#key-1`,
          proofPurpose: 'assertionMethod',
          proofValue: 'mock_signature_' + Math.random().toString(36)
        }
      };

      return credential;
    } catch (error) {
      console.error('Failed to create health credential:', error);
      throw error;
    }
  }

  // Generate condition and fulfillment for escrow
  generateConditionFulfillment(secret) {
    try {
      // Create a simple preimage condition
      const crypto = require('crypto');
      const preimage = Buffer.from(secret, 'utf8');
      const condition = crypto.createHash('sha256').update(preimage).digest();
      
      return {
        condition: condition.toString('hex').toUpperCase(),
        fulfillment: preimage.toString('hex').toUpperCase()
      };
    } catch (error) {
      console.error('Failed to generate condition/fulfillment:', error);
      throw error;
    }
  }
}

export const xrplService = new XRPLService();

