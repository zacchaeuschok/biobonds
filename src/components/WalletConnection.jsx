import { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  Wallet, 
  Plus, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useXRPLStore } from '../lib/store';
import { xrplService } from '../lib/xrpl';

export function WalletConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showAddress, setShowAddress] = useState(false);
  const [fundAmount, setFundAmount] = useState('1000');
  
  const { 
    isConnected, 
    walletAddress, 
    balance, 
    connectWallet, 
    disconnectWallet,
    updateBalance 
  } = useXRPLStore();

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Parse the fund amount
      const amount = parseFloat(fundAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      // Create a test wallet with the specified amount
      const walletInfo = await xrplService.createTestWallet(amount);
      
      // Connect wallet to store with actual balance
      await connectWallet(walletInfo);
      updateBalance(parseFloat(walletInfo.balance));
      
      console.log('Test wallet created successfully:', walletInfo.address);
      
    } catch (err) {
      setError(err.message || 'Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowAddress(false);
  };

  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setShowAddress(true);
      setTimeout(() => setShowAddress(false), 2000);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const viewInExplorer = () => {
    if (walletAddress) {
      window.open(`https://test.bithomp.com/explorer/${walletAddress}`, '_blank');
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your XRPL wallet to start investing in health impact bonds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              This demo creates a test wallet with funded XRP on the XRPL testnet. 
              No real funds are used.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="fundAmount">Requested Funding Amount (XRP)</Label>
            <Input
              id="fundAmount"
              type="number"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="Enter XRP amount"
              min="10"
              max="10000"
            />
            <p className="text-xs text-muted-foreground">
              Note: The testnet faucet typically provides 10 XRP regardless of requested amount
            </p>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Wallet...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Test Wallet
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Connected
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Wallet Address</div>
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <code className="flex-1 text-sm">
              {showAddress ? walletAddress : formatAddress(walletAddress)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
              className="h-8 w-8 p-0"
            >
              {showAddress ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Balance</div>
          <div className="text-2xl font-bold">
            {balance.toLocaleString()} XRP
          </div>
          <div className="text-sm text-muted-foreground">
            ≈ ${(balance * 0.5).toLocaleString()} USD
          </div>
        </div>

        {/* Network Info */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Network</div>
          <Badge variant="outline">XRPL Testnet</Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={viewInExplorer}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Explorer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="flex-1"
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
