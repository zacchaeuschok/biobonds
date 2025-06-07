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

  async createTestWallet(amount) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Generate a new wallet
      const wallet = xrpl.Wallet.generate();
      console.log(`Generated new wallet: ${wallet.address}`);
      
      // Determine funding amount (default to 10 if not specified)
      const fundAmount = amount && typeof amount === 'number' ? 
        Math.min(amount, 100) : // Cap at 100 XRP as per docs
        10; // Default amount
      
      console.log(`Requesting ${fundAmount} XRP from faucet...`);
      
      // Use the faucet API directly to fund the wallet with the specified amount
      const faucetUrl = "https://faucet.altnet.rippletest.net/accounts";
      const response = await fetch(faucetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          destination: wallet.address,
          amount: String(fundAmount) // The faucet API expects a string
        })
      });
      
      if (!response.ok) {
        throw new Error(`Faucet request failed: ${response.status} ${response.statusText}`);
      }
      
      const faucetResult = await response.json();
      console.log("Faucet response:", faucetResult);
      
      // Wait a moment for the funding transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the actual balance
      const accountInfo = await this.getAccountInfo(wallet.address);
      console.log(`Wallet funded. Balance: ${accountInfo.balance} XRP`);
      
      return {
        address: wallet.address,
        seed: wallet.seed,
        balance: accountInfo.balance
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
      
      const balanceInDrops = response.result.account_data.Balance;
      const balanceInXRP = xrpl.dropsToXrp(balanceInDrops);
      
      return {
        address: address,
        balance: balanceInXRP,
        sequence: response.result.account_data.Sequence
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  }

  async getTestWalletFromAddress(address) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // For demo purposes, if no address is provided or it doesn't exist,
      // create a new test wallet
      if (!address) {
        console.log('Creating new test wallet as no address was provided');
        const { wallet } = await this.client.fundWallet();
        return wallet;
      }
      
      // Try to create a wallet from the address
      // In a real app, this would be handled by the user's wallet provider
      try {
        // For demo, we'll create a new funded wallet
        // In production, the user would provide their wallet for signing
        const { wallet } = await this.client.fundWallet();
        console.log('Created new test wallet for demo:', wallet.address);
        return wallet;
      } catch (err) {
        console.error('Error creating wallet from address:', err);
        return null;
      }
    } catch (error) {
      console.error('Failed to get/create wallet from address:', error);
      return null;
    }
  }

  async getBalance(address) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const accountInfo = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });
      
      // Convert from drops to XRP (1 XRP = 1,000,000 drops)
      const balanceInDrops = accountInfo.result.account_data.Balance;
      const balanceInXRP = xrpl.dropsToXrp(balanceInDrops);
      
      return parseFloat(balanceInXRP);
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  // Generate condition and fulfillment for escrow
  async generateConditionFulfillment(preimage) {
    try {
      // Convert preimage to Uint8Array
      const encoder = new TextEncoder();
      const preimageBytes = encoder.encode(preimage);
      
      // Generate SHA-256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', preimageBytes);
      
      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return {
        condition: hashHex,
        fulfillment: preimage
      };
    } catch (error) {
      console.error('Error generating condition/fulfillment:', error);
      throw error;
    }
  }

  // Create an escrow transaction
  async createEscrow({ senderWallet, destinationAddress, amount, finishAfter, cancelAfter }) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      console.log('Creating escrow with params:', {
        sender: senderWallet.address,
        destination: destinationAddress,
        amount: amount,
        finishAfter: finishAfter,
        cancelAfter: cancelAfter
      });
      
      // Create a proper wallet from the seed
      const wallet = xrpl.Wallet.fromSeed(senderWallet.seed);
      
      // Get the actual account info to ensure we have the correct sequence number
      const accountInfo = await this.getAccountInfo(wallet.address);
      console.log(`Account info retrieved. Balance: ${accountInfo.balance} XRP, Sequence: ${accountInfo.sequence}`);
      
      // Verify sufficient balance (including reserve and fees)
      const amountInXRP = parseFloat(amount);
      const minRequired = amountInXRP + 0.001; // Small buffer for fees (0.001 XRP is typically enough)
      
      if (parseFloat(accountInfo.balance) < minRequired) {
        throw new Error(`Insufficient balance. Required: ${minRequired.toFixed(3)} XRP, Available: ${accountInfo.balance} XRP`);
      }
      
      // Convert amount to drops (1 XRP = 1,000,000 drops)
      const amountInDrops = xrpl.xrpToDrops(amount.toString());
      
      // Prepare escrow transaction with minimal required fields
      const escrowTx = {
        "TransactionType": "EscrowCreate",
        "Account": wallet.address,
        "Destination": destinationAddress,
        "Amount": amountInDrops,
        "FinishAfter": finishAfter,
        "CancelAfter": cancelAfter
        // Let autofill handle the sequence number
      };
      
      console.log('Escrow transaction:', escrowTx);
      
      // Prepare transaction
      const prepared = await this.client.autofill(escrowTx);
      console.log('Prepared transaction:', prepared);
      
      // Sign with the wallet
      const signed = wallet.sign(prepared);
      console.log('Signed transaction:', signed);
      
      // Submit transaction
      console.log('Submitting transaction...');
      const tx = await this.client.submitAndWait(signed.tx_blob);
      console.log('Transaction result:', tx);
      
      // Check the result
      if (tx.result.meta.TransactionResult !== "tesSUCCESS") {
        console.error('Transaction failed with code:', tx.result.meta.TransactionResult);
        return {
          success: false,
          error: `Transaction failed with code: ${tx.result.meta.TransactionResult}`
        };
      }
      
      return {
        success: true,
        txHash: signed.hash,
        escrowSequence: prepared.Sequence
      };
    } catch (error) {
      console.error('Failed to create escrow:', error);
      return {
        success: false,
        error: error.message
      };
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
}

export const xrplService = new XRPLService();
