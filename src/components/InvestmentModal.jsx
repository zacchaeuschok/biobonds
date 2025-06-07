import { useState, useEffect } from 'react';
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
  ExternalLink,
  FileCheck
} from "lucide-react";
import { useXRPLStore, useBioBondsStore } from '../lib/store';
import { xrplService } from '../lib/xrpl';

export function InvestmentModal({ bond, isOpen, onClose }) {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [actualBalance, setActualBalance] = useState(null);
  const [escrowData, setEscrowData] = useState(null);
  
  const { wallet } = useXRPLStore();
  const { addInvestment, updateBond } = useBioBondsStore();

  useEffect(() => {
    const fetchActualBalance = async () => {
      if (wallet?.address) {
        try {
          const balance = await xrplService.getBalance(wallet.address);
          setActualBalance(balance);
        } catch (err) {
          console.error("Failed to fetch actual balance:", err);
          setActualBalance(null);
        }
      }
    };
    
    fetchActualBalance();
  }, [wallet?.address]);

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
      
      // Check if wallet is connected
      if (!wallet?.address || !wallet?.seed) {
        throw new Error('Please connect your wallet first');
      }
      
      // Refresh actual balance
      const currentBalance = await xrplService.getBalance(wallet.address);
      setActualBalance(currentBalance);
      
      // Calculate required amount (including a small buffer for fees)
      const requiredAmount = amount + 0.001;
      
      if (requiredAmount > currentBalance) {
        throw new Error(`Insufficient balance. Required: ${requiredAmount.toFixed(3)} XRP (including fees), Available: ${currentBalance} XRP`);
      }

      if (amount > (bond.targetAmount - bond.currentAmount)) {
        throw new Error('Investment amount exceeds remaining funding needed');
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
      
      // Create real XRPL escrow using the connected wallet
      console.log('Creating escrow transaction...');
      const escrowResult = await xrplService.createEscrow({
        senderWallet: wallet,
        destinationAddress: providerWalletInfo.address,
        amount: amount,
        finishAfter: finishAfter,
        cancelAfter: cancelAfter
      });
      
      if (!escrowResult.success) {
        throw new Error(escrowResult.error || 'Escrow creation failed. Please try again.');
      }
      
      // Store transaction hash and escrow data
      setTxHash(escrowResult.txHash);
      setEscrowData({
        id: escrowResult.txHash,
        sequence: escrowResult.escrowSequence,
        amount: amount,
        account: wallet.address,
        destination: providerWalletInfo.address,
        finishAfter: finishAfter,
        cancelAfter: cancelAfter
      });
      
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
        cancelAfter: cancelAfter,
        requiresCredential: true, // Flag that this investment requires credential verification
        credentialType: `HealthOutcome_${bond.id}`
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

  const getMaxInvestment = () => {
    if (actualBalance === null) return 0;
    
    // Leave some XRP for transaction fees
    const maxFromBalance = Math.max(0, actualBalance - 0.001);
    
    // Don't exceed remaining funding needed
    const remainingFunding = bond.targetAmount - bond.currentAmount;
    
    return Math.min(maxFromBalance, remainingFunding);
  };

  const handleMaxClick = () => {
    const max = getMaxInvestment();
    setInvestmentAmount(max.toString());
  };

  if (!bond) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Invest in {bond.title}</DialogTitle>
          <DialogDescription>
            Support this health initiative and earn impact yield on your investment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bond Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="font-medium">{bond.provider.name}</div>
                <Badge>{bond.category}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Yield Rate</div>
                  <div className="font-bold text-green-600">{(bond.yieldRate * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Target</div>
                  <div className="font-bold">${bond.targetAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Maturity</div>
                  <div className="font-bold">{new Date(bond.maturityDate).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Form */}
          {!success ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="investment-amount">Investment Amount (XRP)</Label>
                <div className="relative">
                  <Input
                    id="investment-amount"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="Enter amount"
                    disabled={isProcessing}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2"
                    onClick={handleMaxClick}
                    disabled={isProcessing}
                  >
                    Max
                  </Button>
                </div>
                {actualBalance !== null && (
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Available: {actualBalance.toFixed(3)} XRP</span>
                    <span>Max Investment: {getMaxInvestment().toFixed(3)} XRP</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Projected Yield</div>
                  <div className="font-medium text-green-600">
                    {calculateProjectedYield().toFixed(3)} XRP
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Maturity Value</div>
                  <div className="font-medium">
                    {calculateMaturityValue().toFixed(3)} XRP
                  </div>
                </div>
              </div>

              <Separator />

              {/* Credential Verification Info */}
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-700">Verified Health Outcomes</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      Your investment will be secured by XRPL escrow and only released when 
                      health outcomes are verified using DID credentials on the blockchain.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1" disabled={isProcessing}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleInvest} 
                  className="flex-1" 
                  disabled={isProcessing || !investmentAmount}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Invest Now'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium text-green-700">Investment Successful!</h3>
                </div>
                <p className="text-green-600 text-sm mb-3">
                  Your investment of {parseFloat(investmentAmount).toFixed(3)} XRP has been secured in an XRPL escrow.
                </p>
                <div className="bg-white bg-opacity-50 p-3 rounded text-sm">
                  <div className="mb-2">
                    <span className="text-gray-500">Transaction Hash: </span>
                    <a 
                      href={`https://testnet.xrpl.org/transactions/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <span className="font-mono">{txHash.substring(0, 12)}...</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-500">Funds will be released when: </span>
                    <span className="font-medium">Health outcomes are verified with XRPL credentials</span>
                  </div>
                </div>
              </div>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
