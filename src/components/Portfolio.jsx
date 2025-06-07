import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  Heart, 
  Target,
  Calendar,
  CheckCircle,
  Clock
} from "lucide-react";
import { useXRPLStore } from '../lib/store';
import { 
  mockInvestments, 
  calculateTotalInvested, 
  calculateTotalYield, 
  getActiveBondsCount,
  getBondById 
} from '../lib/mockData';

export function Portfolio() {
  const { userProfile } = useXRPLStore();
  
  if (!userProfile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Connect your wallet to view your portfolio
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalInvested = calculateTotalInvested(mockInvestments);
  const totalYield = calculateTotalYield(mockInvestments);
  const activeBonds = getActiveBondsCount(mockInvestments);
  const totalValue = totalInvested + totalYield;

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold">${totalInvested.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Yield</p>
                <p className="text-2xl font-bold text-green-600">${totalYield.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bonds</p>
                <p className="text-2xl font-bold">{activeBonds}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Investments</CardTitle>
          <CardDescription>
            Track your health impact investments and returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockInvestments.map((investment) => {
              const bond = getBondById(investment.bondId);
              if (!bond) return null;

              const progressPercentage = (bond.currentAmount / bond.targetAmount) * 100;
              
              return (
                <div key={investment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{bond.title}</h4>
                      <p className="text-sm text-muted-foreground">{bond.provider.name}</p>
                    </div>
                    <Badge 
                      variant={investment.status === 'settled' ? 'default' : 'outline'}
                      className={investment.status === 'settled' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {investment.status === 'settled' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Investment</div>
                      <div className="font-medium">${investment.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Yield Earned</div>
                      <div className="font-medium text-green-600">
                        ${investment.yieldEarned.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Investment Date</div>
                      <div className="font-medium">
                        {new Date(investment.investmentDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Bond Progress</div>
                      <div className="font-medium">{progressPercentage.toFixed(0)}% funded</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Bond Funding Progress</span>
                      <span>${bond.currentAmount.toLocaleString()} / ${bond.targetAmount.toLocaleString()}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {investment.escrowTxHash && (
                    <div className="text-xs text-muted-foreground">
                      Escrow TX: {investment.escrowTxHash}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Health Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Your Health Impact
          </CardTitle>
          <CardDescription>
            The real-world health outcomes your investments have supported
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Outcomes Achieved</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>1,000 prenatal vaccinations completed</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>800 mental health screenings conducted</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>200 individuals referred to treatment</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">In Progress</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Diabetes screening program (65% complete)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Hypertension management enrollment</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

