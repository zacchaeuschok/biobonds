import React, { useState, useEffect } from 'react';
import { xrplService } from '../lib/xrpl';
import { useXRPLStore } from '../lib/store';
import { Button } from './ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

/**
 * Component for verifying and displaying XRPL credentials
 */
export function CredentialVerifier({ 
  issuerAddress, 
  subjectAddress, 
  credentialType,
  outcomeDescription,
  onVerificationComplete
}) {
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verifying, verified, failed
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState('');
  const { wallet } = useXRPLStore();

  // Format address for display purposes
  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return address.substring(0, 8) + '...' + address.substring(address.length - 6);
  };

  const verifyCredential = async () => {
    try {
      setVerificationStatus('verifying');
      setError('');
      
      // Call the XRPL service to verify the credential
      const result = await xrplService.verifyCredential({
        issuerAddress,
        subjectAddress,
        credentialType
      });
      
      if (result.isValid) {
        setCredential(result.credential);
        setVerificationStatus('verified');
        if (onVerificationComplete) {
          onVerificationComplete(true, result.credential);
        }
      } else {
        setError(result.error || 'No valid credential found');
        setVerificationStatus('failed');
        if (onVerificationComplete) {
          onVerificationComplete(false);
        }
      }
    } catch (err) {
      console.error('Credential verification error:', err);
      setError(err.message || 'Failed to verify credential');
      setVerificationStatus('failed');
      if (onVerificationComplete) {
        onVerificationComplete(false);
      }
    }
  };

  // Auto-verify on mount
  useEffect(() => {
    if (issuerAddress && subjectAddress && credentialType) {
      verifyCredential();
    }
  }, [issuerAddress, subjectAddress, credentialType]);

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 p-3 rounded-md">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Issuer:</span>
            <span className="font-mono">{formatAddress(issuerAddress)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Subject:</span>
            <span className="font-mono">{formatAddress(subjectAddress)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type:</span>
            <span>{credentialType}</span>
          </div>
          {outcomeDescription && (
            <div className="flex justify-between">
              <span className="text-gray-500">Outcome:</span>
              <span className="text-right">{outcomeDescription}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {verificationStatus === 'verifying' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-blue-600 text-sm">Verifying...</span>
            </>
          )}
          
          {verificationStatus === 'verified' && (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600 text-sm">Credential Verified</span>
            </>
          )}
          
          {verificationStatus === 'failed' && (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 text-sm">
                {error || 'Verification Failed'}
              </span>
            </>
          )}
        </div>
        
        {(verificationStatus === 'failed' || verificationStatus === 'verified') && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={verifyCredential}
            disabled={verificationStatus === 'verifying'}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </Button>
        )}
      </div>

      {verificationStatus === 'verified' && credential && (
        <div className="mt-2 text-sm space-y-1">
          <div className="text-green-600">
            <span className="font-medium">Verified Health Outcome:</span> {credential.outcomeData.description}
          </div>
          <div className="text-gray-500">
            Issued on: {new Date(credential.issuanceDate).toLocaleDateString()}
          </div>
          {credential.expirationDate && (
            <div className="text-gray-500">
              Expires on: {new Date(credential.expirationDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
