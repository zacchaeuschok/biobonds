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
  Loader2
} from "lucide-react";
import { useXRPLStore, useBioBondsStore } from '../lib/store';

export function InvestmentModal({ bond, isOpen, onClose }) {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { walletAddress, balance } = useXRPLStore();
  const { addInvestment } = useBioBondsStore();

  const handleInvest = async () => {
    setError('');
    setIsProcessing(true);

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

      // Simulate XRPL escrow creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create investment record
      const investment = {
        id: `inv_${Date.now()}`,
        bondId: bond.id,
        amount: amount,
        investmentDate: new Date().toISOString(),
        status: 'active',
        yieldEarned: 0,
        escrowTxHash: `0x${Math.random().toString(16).substr(2, 16)}`
      };

      addInvestment(investment);
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setInvestmentAmount('');
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message);
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
              <div className="text-sm font-medium">${balance.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>

          {/* Investment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount (RLUSD)</Label>
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
                  <span className="font-medium">${parseFloat(investmentAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projected Yield:</span>
                  <span className="font-medium text-green-600">
                    ${calculateProjectedYield().toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total at Maturity:</span>
                  <span className="text-green-600">
                    ${calculateMaturityValue().toLocaleString()}
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
                Investment successful! Your BioBond has been created.
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

