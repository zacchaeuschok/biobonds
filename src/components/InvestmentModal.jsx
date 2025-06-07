import { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "./ui/dialog";
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useXRPLStore, useBioBondsStore } from '../lib/store';
import { xrplService } from '../lib/xrpl';

export function InvestmentModal({ bond, isOpen, onClose }) {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  
  const { walletAddress, balance, wallet } = useXRPLStore();
  const { addInvestment, updateBond } = useBioBondsStore();

  const handleInvest = async () => {
    setError('');
    setIsProcessing(true);
    setTxHash('');

    try {
      const amount = parseFloat(investmentAmount);
      
      // Validation
      if (!amount || amount <= 0) {
        throw new Error('Please enter a valid investment amount');
      }
      
      if (amount > balance) {
        throw new Error('Insufficient balance');
      }

      if (amount > (bond.targetAmount - bond.currentAmount)) {
        throw new Error('Investment amount exceeds remaining funding needed');
      }

      // For demo purposes, create a new wallet for signing
      // In production, this would use the user's actual wallet
      console.log('Creating wallet for transaction signing...');
      const walletInfo = await xrplService.createTestWallet();
      if (!walletInfo || !walletInfo.address) {
        throw new Error('Failed to create test wallet for transaction');
      }
      
      // Create a provider wallet for demo purposes
      console.log('Creating provider wallet...');
      const providerWalletInfo = await xrplService.createTestWallet();
      if (!providerWalletInfo || !providerWalletInfo.address) {
        throw new Error('Failed to create provider wallet for transaction');
      }
      
      // Calculate escrow expiration (cancel after)
      const now = Math.floor(Date.now() / 1000);
      const cancelAfter = now + (60 * 60 * 24 * 30); // 30 days from now
      const finishAfter = now + 60; // 1 minute from now
      
      // Create real XRPL escrow
      console.log('Creating escrow transaction...');
      const escrowResult = await xrplService.createEscrow({
        senderWallet: walletInfo,
        destinationAddress: providerWalletInfo.address,
        amount: amount,
        finishAfter: finishAfter,
        cancelAfter: cancelAfter
      });
      
      if (!escrowResult.success) {
        throw new Error(escrowResult.error || 'Escrow creation failed. Please try again.');
      }
      
      // Store transaction hash
      setTxHash(escrowResult.txHash);
      
      // Create investment record
      const investment = {
        id: `inv_${Date.now()}`,
        bondId: bond.id,
        amount: amount,
        investmentDate: new Date().toISOString(),
        status: 'pending', // Set to pending since we're not waiting for validation
        yieldEarned: 0,
        escrowTxHash: escrowResult.txHash,
        escrowSequence: escrowResult.escrowSequence,
        cancelAfter: cancelAfter
      };

      // Update bond current amount
      updateBond(bond.id, {
        currentAmount: bond.currentAmount + amount
      });
      
      // Add investment to store
      addInvestment(investment);
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setInvestmentAmount('');
        setSuccess(false);
        onClose();
      }, 5000);

    } catch (err) {
      console.error('Investment error:', err);
      setError(err.message || 'An error occurred during investment');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateProjectedYield = () => {
    const amount = parseFloat(investmentAmount) || 0;
    return amount * bond.yieldRate;
  };

  const calculateMaturityValue = () => {
    const amount = parseFloat(investmentAmount) || 0;
    return amount + calculateProjectedYield();
  };

  const viewInExplorer = () => {
    if (txHash) {
      window.open(`https://test.bithomp.com/explorer/${txHash}`, '_blank');
    }
  };

  if (!bond) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in {bond.title}</DialogTitle>
          <DialogDescription>
            Fund preventive healthcare and earn impact returns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bond Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Bond Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Health Outcome:</span>
                <span className="font-medium">{bond.healthOutcome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Yield Rate:</span>
                <span className="font-medium text-green-600">
                  {(bond.yieldRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maturity:</span>
                <span className="font-medium">
                  {new Date(bond.maturityDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium">
                  ${(bond.targetAmount - bond.currentAmount).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Info */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Wallet className="w-4 h-4" />
            <div className="flex-1">
              <div className="text-sm font-medium">Connected Wallet</div>
              <div className="text-xs text-muted-foreground">
                {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{balance.toLocaleString()} XRP</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>

          {/* Investment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount (XRP)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Investment Summary */}
          {investmentAmount && parseFloat(investmentAmount) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Investment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment:</span>
                  <span className="font-medium">{parseFloat(investmentAmount).toLocaleString()} XRP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projected Yield:</span>
                  <span className="font-medium text-green-600">
                    {calculateProjectedYield().toLocaleString()} XRP
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total at Maturity:</span>
                  <span className="text-green-600">
                    {calculateMaturityValue().toLocaleString()} XRP
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your investment is secured by XRPL escrow. Funds are only released when 
              verified health outcomes are achieved.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p>Investment successful! Your BioBond escrow has been created.</p>
                  {txHash && (
                    <div className="flex items-center gap-2 text-xs">
                      <span>Transaction: {txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                      <Button 
                        variant="ghost" 
                        size="xs" 
                        className="h-6 px-2"
                        onClick={viewInExplorer}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInvest}
              className="flex-1"
              disabled={!investmentAmount || parseFloat(investmentAmount) <= 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Escrow...
                </>
              ) : (
                'Invest Now'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
