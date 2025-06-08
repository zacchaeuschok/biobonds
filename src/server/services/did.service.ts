/**
 * Service for handling XRPL DID Verifiable Credentials
 * 
 * This service provides functionality for creating, verifying, and managing
 * decentralized identifiers (DIDs) and verifiable credentials on the XRP Ledger.
 */
export class DidService {
  /**
   * Create a DID from an XRPL wallet address
   * @param walletAddress XRPL wallet address
   * @returns DID string in the format did:xrpl:{walletAddress}
   */
  createDid(walletAddress: string): string {
    // Remove any 'did:xrpl:' prefix if it already exists
    const cleanAddress = walletAddress.replace('did:xrpl:', '');
    return `did:xrpl:${cleanAddress}`;
  }

  /**
   * Extract wallet address from a DID
   * @param did DID string in the format did:xrpl:{walletAddress}
   * @returns XRPL wallet address
   */
  extractWalletAddress(did: string): string {
    if (!did.startsWith('did:xrpl:')) {
      throw new Error('Invalid DID format. Must start with did:xrpl:');
    }
    return did.replace('did:xrpl:', '');
  }

  /**
   * Create a verifiable credential
   * @param params Credential parameters
   * @returns Verifiable credential object
   */
  createVerifiableCredential(params: {
    issuerDid: string;
    subjectDid: string;
    credentialType: string;
    outcomeData: Record<string, any>;
    expirationDate?: Date;
  }): any {
    const now = new Date();
    const id = `urn:uuid:${this.generateUuid()}`;
    
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      id,
      type: ['VerifiableCredential', params.credentialType],
      issuer: params.issuerDid,
      issuanceDate: now.toISOString(),
      expirationDate: params.expirationDate?.toISOString(),
      credentialSubject: {
        id: params.subjectDid,
        ...params.outcomeData
      }
    };
  }

  /**
   * Generate a random UUID
   * @returns UUID string
   */
  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Export singleton instance
export const didService = new DidService();
