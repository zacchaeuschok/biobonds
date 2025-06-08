import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { 
  Heart, 
  TrendingUp, 
  Shield, 
  Globe, 
  Search,
  Filter,
  Menu,
  X,
  Wallet,
  Copy,
  ExternalLink,
  Loader2
} from "lucide-react";

// Import components
import { BondCard } from './components/BondCard';
import { InvestmentModal } from './components/InvestmentModal';
import { BondDetailsModal } from './components/BondDetailsModal';
import { WalletConnection } from './components/WalletConnection';
import { Portfolio } from './components/Portfolio';
import { TrpcExample } from './components/TrpcExample';

// Import stores and data
import { useXRPLStore, useBioBondsStore } from './lib/store';
import { trpc } from './utils/trpc';

import './App.css';

function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { path: '/', label: 'Explore Bonds' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/about', label: 'About' },
    { path: '/api-test', label: 'API Test' }
  ];

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Heart className="w-6 h-6 text-red-500" />
            BioBonds
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === item.path 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBond, setSelectedBond] = useState(null);
  const [investmentBond, setInvestmentBond] = useState(null);
  const [showBondDetails, setShowBondDetails] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  
  const { setBonds } = useBioBondsStore();
  const { isConnected, walletAddress, balance } = useXRPLStore();

  // Fetch bonds from the backend
  const bondsQuery = trpc.bonds.getAll.useQuery();
  const bonds = bondsQuery.data || [];

  useEffect(() => {
    if (bondsQuery.data) {
      setBonds(bondsQuery.data);
    }
  }, [bondsQuery.data, setBonds]);

  const filteredBonds = bonds.filter(bond => {
    const matchesSearch = bond.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bond.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bond.provider.name && bond.provider.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Case-insensitive status matching
    const matchesStatus = statusFilter === 'all' || 
                         bond.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (bond) => {
    setSelectedBond(bond);
    setShowBondDetails(true);
  };

  const handleInvest = (bond) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setInvestmentBond(bond);
    setShowInvestmentModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">
          Fund Health. Earn Impact.
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Invest in preventive healthcare through blockchain-secured bonds and earn returns 
          based on verified health outcomes.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span>XRPL Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>Impact Returns</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-500" />
            <span>Global Health</span>
          </div>
        </div>
      </section>

      {/* Wallet Connection */}
      {!isConnected && (
        <section className="flex justify-center">
          <WalletConnection />
        </section>
      )}

      {/* Wallet Info - Show when connected */}
      {isConnected && (
        <section className="mb-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Connected Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">Address</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-full"
                      onClick={() => navigator.clipboard.writeText(walletAddress)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{balance.toLocaleString()} XRP</div>
                  <div className="text-xs text-muted-foreground">≈ ${(balance * 0.5).toLocaleString()} USD</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://test.bithomp.com/explorer/${walletAddress}`, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Explorer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => useXRPLStore.getState().disconnectWallet()}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Search and Filters */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bonds by title, description, or provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bonds</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Bonds Grid */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Available Health Impact Bonds</h2>
          <Badge variant="outline">
            {filteredBonds.length} bond{filteredBonds.length !== 1 ? 's' : ''} found
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBonds.map((bond) => (
            <BondCard
              key={bond.id}
              bond={bond}
              onInvest={handleInvest}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {filteredBonds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No bonds found matching your criteria.
            </p>
          </div>
        )}
      </section>

      {/* Modals */}
      <BondDetailsModal
        bond={selectedBond}
        isOpen={showBondDetails}
        onClose={() => setShowBondDetails(false)}
        onInvest={handleInvest}
      />
      
      <InvestmentModal
        bond={investmentBond}
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
      />
    </div>
  );
}

function PortfolioPage() {
  const { isConnected } = useXRPLStore();

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
        <p className="text-muted-foreground mb-8">
          Connect your wallet to view your investment portfolio
        </p>
        <WalletConnection />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Your Portfolio</h1>
        <p className="text-muted-foreground">
          Track your health impact investments and returns
        </p>
      </div>
      <Portfolio />
    </div>
  );
}

function AboutPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">About BioBonds</h1>
        <p className="text-xl text-muted-foreground">
          Revolutionizing healthcare funding through decentralized finance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Health Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fund preventive healthcare interventions that improve global health outcomes 
              and reduce long-term healthcare costs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              XRPL Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Investments are secured by XRPL conditional escrows, ensuring funds are only 
              released when verified health outcomes are achieved.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Impact Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Earn competitive returns while creating measurable social impact through 
              transparent, outcome-based investments.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How BioBonds Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium mb-1">Invest</h4>
              <p className="text-xs text-muted-foreground">
                Choose health bonds and invest RLUSD through secure escrow
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-medium mb-1">Deliver</h4>
              <p className="text-xs text-muted-foreground">
                Healthcare providers deliver services and issue verifiable credentials
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-medium mb-1">Verify</h4>
              <p className="text-xs text-muted-foreground">
                Outcomes are cryptographically verified and recorded on XRPL
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <h4 className="font-medium mb-1">Earn</h4>
              <p className="text-xs text-muted-foreground">
                Automatic settlement releases funds and distributes impact yields
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/api-test" element={<TrpcExample />} />
          </Routes>
        </main>

        <footer className="border-t mt-16 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>
              BioBonds - Powered by XRPL • Built for Global Health Impact
            </p>
            <p className="mt-2">
              Demo application showcasing DeFi health impact bonds
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
