import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { xrplService } from '../lib/xrpl';
import { useXRPLStore } from '../lib/store';
import { CredentialVerifier } from './CredentialVerifier';

/**
 * Modal for releasing escrow funds based on verified health outcome credentials
 */
export function EscrowReleaseModal({ 
  isOpen, 
  onClose, 
  escrow, 
  bond 
}) {
  const { wallet } = useXRPLStore();
  const [status, setStatus] = useState('idle'); // idle, verifying, verified, releasing, success, error
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [credentialVerified, setCredentialVerified] = useState(false);
  const [credential, setCredential] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setError('');
      setTxHash('');
      setCredentialVerified(false);
      setCredential(null);
    }
  }, [isOpen]);

  const handleVerificationComplete = (isValid, credentialData) => {
    setCredentialVerified(isValid);
    if (isValid && credentialData) {
      setCredential(credentialData);
      setStatus('verified');
    } else {
      setStatus('idle');
    }
  };

  const handleReleaseEscrow = async () => {
    if (!credentialVerified || !escrow || !wallet) {
      setError('Credential verification required before releasing funds');
      return;
    }

    try {
      setStatus('releasing');
      setError('');

      // Call the XRPL service to finish the escrow
      const result = await xrplService.finishEscrow({
        escrowId: escrow.id,
        escrowOwner: escrow.account,
        destinationAddress: bond.provider.address,
        sequence: escrow.sequence,
        wallet: wallet
      });

      if (result && result.hash) {
        setTxHash(result.hash);
        setStatus('success');
        
        // In a real app, you would update the bond funding status and escrow status
        console.log(`Escrow released: ${result.hash}`);
      } else {
        throw new Error('Failed to release escrow');
      }
    } catch (err) {
      console.error('Escrow release error:', err);
      setStatus('error');
      setError(err.message || 'Failed to release escrow');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Release Escrow Funds</DialogTitle>
          <DialogDescription>
            Verify health outcome credentials before releasing funds to the healthcare provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Escrow Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Escrow Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">{escrow?.amount} XRP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider:</span>
                  <span className="font-medium">{bond?.provider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Escrow ID:</span>
                  <span className="font-mono text-xs">{escrow?.id.substring(0, 12)}...</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Credential Verification */}
          <div className="space-y-2">
            <h3 className="font-medium">Health Outcome Verification</h3>
            <p className="text-sm text-gray-500">
              Funds will only be released after verifying the health outcome credential on the XRPL.
            </p>

            {bond && wallet && (
              <CredentialVerifier
                issuerAddress={bond.provider.address}
                subjectAddress={wallet.address}
                credentialType={`HealthOutcome_${bond.id}`}
                outcomeDescription={bond.outcomes[0]?.target || "Health outcome"}
                onVerificationComplete={handleVerificationComplete}
              />
            )}
          </div>

          {/* Status and Actions */}
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Escrow successfully released!</span>
                </div>
                <div className="text-sm">
                  <span>Transaction Hash: </span>
                  <a 
                    href={`https://testnet.xrpl.org/transactions/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-mono"
                  >
                    {txHash.substring(0, 12)}...
                  </a>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
                disabled={status === 'releasing'}
              >
                {status === 'success' ? 'Close' : 'Cancel'}
              </Button>
              
              {status !== 'success' && (
                <Button 
                  onClick={handleReleaseEscrow} 
                  className="flex-1"
                  disabled={!credentialVerified || status === 'releasing'}
                >
                  {status === 'releasing' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Releasing...
                    </>
                  ) : (
                    'Release Funds'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
