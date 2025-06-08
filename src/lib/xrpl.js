import * as xrpl from 'xrpl';
import { XRPL_CONFIG } from './types.js';
import { useXRPLStore } from './store';

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
      if (!this.isConnected || !this.client) {
        await this.connect();
        // Wait a moment for the connection to fully establish
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const response = await this.client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated"
      });
      
      const balance = xrpl.dropsToXrp(response.result.account_data.Balance);
      console.log(`Balance for ${address}: ${balance} XRP`);
      return balance;
    } catch (error) {
      console.error("Failed to get balance:", error);
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
        escrowId,
        escrowOwner,
        destinationAddress,
        sequence,
        wallet
      } = params;

      // Connect to the XRPL if not already connected
      if (!this.client.isConnected()) {
        await this.connect();
      }

      // Create a wallet instance from the provided wallet info
      const xrplWallet = xrpl.Wallet.fromSeed(wallet.seed);

      // Prepare the EscrowFinish transaction
      const escrowFinishTx = {
        TransactionType: "EscrowFinish",
        Account: xrplWallet.address,
        Owner: escrowOwner,
        OfferSequence: sequence,
      };

      // Autofill transaction details
      const preparedTx = await this.client.autofill(escrowFinishTx);
      
      // Sign the transaction
      const signedTx = xrplWallet.sign(preparedTx);
      
      console.log('Submitting EscrowFinish transaction...');
      
      // Submit the transaction and wait for validation
      const submitResult = await this.client.submitAndWait(signedTx.tx_blob);
      
      if (submitResult.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(`Failed to finish escrow: ${submitResult.result.meta.TransactionResult}`);
      }
      
      console.log('Escrow finished successfully:', submitResult.result.hash);
      
      return {
        hash: submitResult.result.hash,
        ledgerIndex: submitResult.result.ledger_index,
        status: 'success'
      };
    } catch (error) {
      console.error('Error finishing escrow:', error);
      throw error;
    }
  }

  async createHealthCredential(params) {
    try {
      const { 
        issuerAddress, 
        subjectAddress, 
        credentialType, 
        outcomeData,
        expirationDays = 365 // Default expiration of 1 year
      } = params;

      // Connect to the XRPL if not already connected
      if (!this.client.isConnected()) {
        await this.connect();
      }

      // Convert credential type to hex format as required by XRPL
      const credentialTypeHex = this.convertStringToHex(credentialType).toUpperCase();
      console.log(`Encoded credential_type as hex: ${credentialTypeHex}`);

      // Get the issuer wallet to sign the transaction
      const issuerWallet = await this.getWalletByAddress(issuerAddress);
      if (!issuerWallet) {
        throw new Error('Issuer wallet not found or not accessible');
      }

      // Calculate expiration date (in seconds since XRPL epoch)
      const now = Math.floor(Date.now() / 1000);
      const xrplEpoch = 946684800; // 2000-01-01T00:00:00Z
      const expirationTime = now + (expirationDays * 24 * 60 * 60) - xrplEpoch;

      // Prepare the credential creation transaction
      const credentialTx = {
        TransactionType: "CredentialSet",
        Account: issuerAddress,
        Subject: subjectAddress,
        CredentialType: credentialTypeHex,
        Expiration: expirationTime,
        Fields: [
          {
            Field: this.convertStringToHex("outcomeData").toUpperCase(),
            Value: this.convertStringToHex(JSON.stringify(outcomeData)).toUpperCase()
          }
        ]
      };

      // Autofill transaction details
      const preparedTx = await this.client.autofill(credentialTx);
      
      // Sign the transaction with the issuer's wallet
      const signedTx = issuerWallet.sign(preparedTx);
      
      // Submit the transaction to the network
      console.log('Submitting credential transaction...');
      const submitResult = await this.client.submitAndWait(signedTx.tx_blob);
      
      if (submitResult.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(`Failed to create credential: ${submitResult.result.meta.TransactionResult}`);
      }
      
      // Return the credential details
      const credential = {
        id: submitResult.result.hash,
        issuer: issuerAddress,
        subject: subjectAddress,
        type: credentialType,
        typeHex: credentialTypeHex,
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date((expirationTime + xrplEpoch) * 1000).toISOString(),
        txHash: submitResult.result.hash,
        ledgerIndex: submitResult.result.ledger_index,
        outcomeData: outcomeData
      };

      return credential;
    } catch (error) {
      console.error('Failed to create health credential:', error);
      throw error;
    }
  }

  async verifyCredential(params) {
    try {
      const { issuerAddress, subjectAddress, credentialType } = params;
      
      // Connect to the XRPL if not already connected
      if (!this.client.isConnected()) {
        await this.connect();
      }

      // Convert credential type to hex format
      const credentialTypeHex = this.convertStringToHex(credentialType).toUpperCase();
      console.log(`Encoded credential_type as hex: ${credentialTypeHex}`);

      // Prepare the ledger entry request to look up the credential
      const ledgerEntryRequest = {
        command: "ledger_entry",
        credential: {
          subject: subjectAddress,
          issuer: issuerAddress,
          credential_type: credentialTypeHex,
        },
        ledger_index: "validated",
      };
      
      console.log("Looking up credential...");
      console.log(JSON.stringify(ledgerEntryRequest, null, 2));

      // Request the credential from the ledger
      const response = await this.client.request(ledgerEntryRequest);
      
      if (!response.result || !response.result.node) {
        console.log("Credential was not found");
        return { isValid: false, error: "Credential not found" };
      }

      const credential = response.result.node;
      console.log("Found credential:", JSON.stringify(credential, null, 2));

      // Check if the credential has been accepted by the subject
      // LSF_ACCEPTED flag (0x00010000 = 65536)
      if (!(credential.Flags & 65536)) {
        console.log("Credential is not accepted by the subject.");
        return { isValid: false, error: "Credential not accepted by the subject" };
      }

      // Check if the credential has expired
      if (credential.Expiration) {
        // Get the close time of the most recently validated ledger
        const ledgerResponse = await this.client.request({
          command: "ledger",
          ledger_index: "validated",
        });
        
        const ledgerCloseTime = ledgerResponse.result.ledger.close_time;
        const xrplEpoch = 946684800; // 2000-01-01T00:00:00Z
        
        if (credential.Expiration + xrplEpoch <= ledgerCloseTime) {
          console.log("Credential has expired.");
          return { isValid: false, error: "Credential has expired" };
        }
      }

      // Extract outcome data from the credential fields
      let outcomeData = {};
      if (credential.Fields && credential.Fields.length > 0) {
        const outcomeField = credential.Fields.find(f => 
          f.Field === this.convertStringToHex("outcomeData").toUpperCase()
        );
        
        if (outcomeField && outcomeField.Value) {
          try {
            const hexString = outcomeField.Value;
            let str = '';
            for (let i = 0; i < hexString.length; i += 2) {
              str += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
            }
            outcomeData = JSON.parse(str);
          } catch (e) {
            console.error("Error parsing outcome data:", e);
          }
        }
      }

      // Credential exists, is accepted, and has not expired
      console.log("Credential is valid.");
      
      // Format the credential for the UI
      const formattedCredential = {
        id: credential.index,
        issuer: issuerAddress,
        subject: subjectAddress,
        type: credentialType,
        issuanceDate: new Date((credential.PreviousTxnLgrSeq * 10) + 946684800000).toISOString(),
        expirationDate: credential.Expiration ? 
          new Date((credential.Expiration + 946684800) * 1000).toISOString() : null,
        outcomeData: outcomeData,
        ledgerIndex: credential.LedgerEntryType,
        flags: credential.Flags,
        txHash: credential.PreviousTxnID
      };
      
      return { 
        isValid: true, 
        credential: formattedCredential 
      };
    } catch (error) {
      if (error.data && error.data.error === "entryNotFound") {
        console.log("Credential was not found");
        return { isValid: false, error: "Credential not found" };
      }
      console.error("Error verifying credential:", error);
      throw error;
    }
  }

  convertStringToHex(str) {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      hex += charCode.toString(16).padStart(2, '0');
    }
    return hex;
  }

  async getWalletByAddress(address) {
    try {
      // This is a simplified implementation - in a real app, you would have
      // a more secure way to retrieve wallet credentials
      const store = useXRPLStore.getState();
      
      if (store.wallet && store.wallet.address === address) {
        return xrpl.Wallet.fromSeed(store.wallet.seed);
      }
      
      // For demo purposes, if the address is a provider address, create a test wallet
      const mockProviders = store.providers || [];
      const provider = mockProviders.find(p => p.address === address);
      if (provider && provider.seed) {
        return xrpl.Wallet.fromSeed(provider.seed);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting wallet by address:', error);
      return null;
    }
  }
}

export const xrplService = new XRPLService();
