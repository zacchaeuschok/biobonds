import * as xrpl from "xrpl";

/**
 * XRPL Service for blockchain interactions
 */
export class XrplService {
  private client: xrpl.Client;
  private readonly testnetUrl = "wss://s.altnet.rippletest.net:51233";

  constructor() {
    this.client = new xrpl.Client(this.testnetUrl);
  }

  /**
   * Connect to the XRPL network
   */
  async connect(): Promise<void> {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
  }

  /**
   * Disconnect from the XRPL network
   */
  async disconnect(): Promise<void> {
    if (this.client.isConnected()) {
      await this.client.disconnect();
    }
  }

  /**
   * Get account information from XRPL
   * @param address Wallet address
   */
  async getAccountInfo(address: string): Promise<any> {
    await this.connect();
    
    try {
      const response = await this.client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
      });
      
      return response.result;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Create a funded test wallet on XRPL testnet
   */
  async createTestWallet(): Promise<{
    address: string;
    seed: string;
    publicKey: string;
  }> {
    await this.connect();
    
    try {
      const { wallet } = await this.client.fundWallet();
      
      return {
        address: wallet.address,
        seed: wallet.seed,
        publicKey: wallet.publicKey,
      };
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Create an escrow transaction on XRPL
   * @param params Escrow parameters
   */
  async createEscrow(params: {
    fromAddress: string;
    toAddress: string;
    amount: number;
    finishAfterMinutes: number;
    cancelAfterDays: number;
    seed: string;
  }): Promise<{
    success: boolean;
    txHash: string;
    sequence: number;
    ledgerIndex: number;
  }> {
    await this.connect();
    
    try {
      const wallet = xrpl.Wallet.fromSeed(params.seed);
      
      // Verify wallet address matches fromAddress
      if (wallet.address !== params.fromAddress) {
        throw new Error("Wallet address does not match fromAddress");
      }

      // Calculate finish and cancel times
      const now = Math.floor(Date.now() / 1000);
      const finishAfterTime = now + (params.finishAfterMinutes * 60);
      const cancelAfterTime = now + (params.cancelAfterDays * 24 * 60 * 60);

      // Prepare escrow transaction
      const escrowTx: xrpl.EscrowCreate = {
        TransactionType: "EscrowCreate",
        Account: params.fromAddress,
        Destination: params.toAddress,
        Amount: xrpl.xrpToDrops(params.amount.toString()),
        FinishAfter: finishAfterTime,
        CancelAfter: cancelAfterTime
      };

      // Submit transaction
      const prepared = await this.client.autofill(escrowTx);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      
      // Type assertion to handle the meta property correctly
      const meta = result.result.meta as xrpl.TransactionMetadata;

      return {
        success: meta.TransactionResult === "tesSUCCESS",
        txHash: signed.hash,
        sequence: prepared.Sequence,
        ledgerIndex: result.result.ledger_index,
      };
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Finish an escrow transaction on XRPL
   * @param params Escrow finish parameters
   */
  async finishEscrow(params: {
    walletAddress: string;
    escrowCreator: string;
    escrowSequence: number;
    seed: string;
  }): Promise<{
    success: boolean;
    txHash: string;
    ledgerIndex: number;
  }> {
    await this.connect();
    
    try {
      const wallet = xrpl.Wallet.fromSeed(params.seed);
      
      // Verify wallet address
      if (wallet.address !== params.walletAddress) {
        throw new Error("Wallet address does not match provided seed");
      }

      // Prepare escrow finish transaction
      const escrowFinishTx = {
        TransactionType: 'EscrowFinish' as const,
        Account: params.walletAddress,
        Owner: params.escrowCreator,
        OfferSequence: params.escrowSequence
      };

      // Submit transaction
      const prepared = await this.client.autofill(escrowFinishTx);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      // Type assertion to handle the meta property correctly
      const meta = result.result.meta as xrpl.TransactionMetadata;

      return {
        success: meta.TransactionResult === "tesSUCCESS",
        txHash: signed.hash,
        ledgerIndex: result.result.ledger_index,
      };
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Create a verifiable health credential on XRPL
   * Note: This is a simplified implementation as XRPL doesn't natively support
   * verifiable credentials. In a real implementation, you might use a different
   * approach or extension to XRPL.
   * @param params Credential parameters
   */
  async createHealthCredential(params: {
    issuerAddress: string;
    subjectAddress: string;
    credentialType: string;
    outcomeData: Record<string, any>;
    expirationDays?: number;
    seed: string;
  }): Promise<{
    success: boolean;
    txHash: string;
    issuer: string;
    subject: string;
    credentialType: string;
    issuanceDate: Date;
    expirationDate?: Date;
    ledgerIndex: number;
  }> {
    await this.connect();
    
    try {
      const wallet = xrpl.Wallet.fromSeed(params.seed);
      
      // Verify wallet address
      if (wallet.address !== params.issuerAddress) {
        throw new Error("Wallet address does not match issuer address");
      }

      // For this demo, we'll use a memo to store the credential data
      // In a real implementation, you might use a different approach
      const memoType = Buffer.from("HealthCredential").toString("hex").toUpperCase();
      const memoFormat = Buffer.from("application/json").toString("hex").toUpperCase();
      const memoData = Buffer.from(JSON.stringify({
        type: params.credentialType,
        issuer: params.issuerAddress,
        subject: params.subjectAddress,
        issuedAt: new Date().toISOString(),
        expiresAt: params.expirationDays 
          ? new Date(Date.now() + params.expirationDays * 24 * 60 * 60 * 1000).toISOString() 
          : undefined,
        outcomeData: params.outcomeData
      })).toString("hex").toUpperCase();

      // Prepare payment transaction with memo (as a placeholder for credential)
      const tx: xrpl.Payment = {
        TransactionType: "Payment",
        Account: params.issuerAddress,
        Destination: params.subjectAddress,
        Amount: xrpl.xrpToDrops("1"), // Minimal amount
        Memos: [{
          Memo: {
            MemoType: memoType,
            MemoFormat: memoFormat,
            MemoData: memoData
          }
        }]
      };

      // Submit transaction
      const prepared = await this.client.autofill(tx);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      const now = new Date();
      const expirationDate = params.expirationDays 
        ? new Date(now.getTime() + params.expirationDays * 24 * 60 * 60 * 1000) 
        : undefined;

      // Add type guard to check if meta has TransactionResult property
      const isSuccessful = typeof result.result.meta === 'object' && 
                          result.result.meta !== null && 
                          'TransactionResult' in result.result.meta && 
                          result.result.meta.TransactionResult === "tesSUCCESS";

      return {
        success: isSuccessful,
        txHash: signed.hash,
        issuer: params.issuerAddress,
        subject: params.subjectAddress,
        credentialType: params.credentialType,
        issuanceDate: now,
        expirationDate,
        ledgerIndex: result.result.ledger_index,
      };
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Verify a health credential on XRPL
   * @param params Credential verification parameters
   */
  async verifyCredential(params: {
    issuerDid: string;
    subjectDid: string;
    credentialData: Record<string, any>;
  }): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    // In a real implementation, this would verify the credential on XRPL
    // For this demo, we'll simulate verification
    try {
      // Extract wallet addresses from DIDs
      const issuerAddress = params.issuerDid.split(':').pop();
      const subjectAddress = params.subjectDid.split(':').pop();
      
      if (!issuerAddress || !subjectAddress) {
        return {
          success: false,
          error: "Invalid DID format"
        };
      }
      
      // Verify credential data structure
      if (!params.credentialData || 
          !params.credentialData.type || 
          !params.credentialData.issuer || 
          !params.credentialData.subject) {
        return {
          success: false,
          error: "Invalid credential data structure"
        };
      }
      
      // Check if issuer matches
      if (params.credentialData.issuer !== params.issuerDid) {
        return {
          success: false,
          error: "Issuer mismatch"
        };
      }
      
      // Check if subject matches
      if (params.credentialData.subject !== params.subjectDid) {
        return {
          success: false,
          error: "Subject mismatch"
        };
      }
      
      // Check if credential is expired
      if (params.credentialData.expirationDate && 
          new Date(params.credentialData.expirationDate) < new Date()) {
        return {
          success: false,
          error: "Credential has expired"
        };
      }
      
      // In a real implementation, we would verify the signature on the credential
      // For this demo, we'll simulate a successful verification
      return {
        success: true,
        txHash: "SIMULATED_VERIFICATION_" + Date.now().toString()
      };
    } catch (error) {
      return {
        success: false,
        error: `Error verifying credential: ${error.message}`
      };
    }
  }

  /**
   * Publish a credential to XRPL
   * @param params Credential publishing parameters
   */
  async publishCredential(params: {
    issuerWalletAddress: string;
    subjectWalletAddress: string;
    credentialData: Record<string, any>;
  }): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    // In a real implementation, this would publish the credential to XRPL
    // For this demo, we'll simulate publishing
    try {
      // Verify credential data structure
      if (!params.credentialData || 
          !params.credentialData.type || 
          !params.credentialData.issuer || 
          !params.credentialData.subject) {
        return {
          success: false,
          error: "Invalid credential data structure"
        };
      }
      
      // In a real implementation, we would publish to XRPL
      // For this demo, we'll simulate a successful publication
      return {
        success: true,
        txHash: "SIMULATED_PUBLICATION_" + Date.now().toString()
      };
    } catch (error) {
      return {
        success: false,
        error: `Error publishing credential: ${error.message}`
      };
    }
  }

  /**
   * Verify an XRPL wallet signature
   * @param address Wallet address
   * @param message Original message
   * @param signature Signature to verify
   */
  async verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
      // In a real implementation, you would use the xrpl.js library to verify signatures
      // This is a placeholder for the actual verification logic
      return true;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }
}

// Export singleton instance
export const xrplService = new XrplService();
