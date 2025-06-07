import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "./ui/dialog";
import { 
  Heart, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Users,
  Target,
  Shield,
  Award
} from "lucide-react";

export function BondDetailsModal({ bond, isOpen, onClose, onInvest }) {
  if (!bond) return null;

  const progressPercentage = (bond.currentAmount / bond.targetAmount) * 100;
  const remainingAmount = bond.targetAmount - bond.currentAmount;
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'funded': return 'bg-green-500';
      case 'completed': return 'bg-purple-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'active': return <Clock className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold">{bond.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {bond.description}
              </DialogDescription>
            </div>
            <Badge className={`${getStatusColor(bond.status)} text-white flex items-center gap-1`}>
              {getStatusIcon(bond.status)}
              {bond.status.charAt(0).toUpperCase() + bond.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-green-600 truncate">
                  {(bond.yieldRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Yield Rate</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-xl font-bold truncate" style={{ lineHeight: "1.2" }}>
                  ${bond.targetAmount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Target Amount</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold truncate">
                  {progressPercentage.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Funded</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-sm font-bold">
                  {new Date(bond.maturityDate).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">Maturity Date</div>
              </CardContent>
            </Card>
          </div>

          {/* Health Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Health Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{bond.healthOutcome}</p>
              
              <div className="space-y-3">
                <h4 className="font-medium">Target Outcomes:</h4>
                {bond.outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {outcome.achieved ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className={`font-medium ${outcome.achieved ? 'text-green-600' : ''}`}>
                        {outcome.target}
                      </div>
                      {outcome.achieved && outcome.verificationDate && (
                        <div className="text-xs text-green-600">
                          Verified on {new Date(outcome.verificationDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {outcome.achieved && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Achieved
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Provider Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" />
                Healthcare Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">{bond.provider.name}</div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {bond.provider.location}
                  </div>
                </div>
                {bond.provider.verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified Provider
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Funding Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Funding Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Funding</span>
                  <span className="font-medium">
                    ${bond.currentAmount.toLocaleString()} / ${bond.targetAmount.toLocaleString()}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Amount Raised</div>
                  <div className="font-medium text-lg">${bond.currentAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Remaining Needed</div>
                  <div className="font-medium text-lg">${remainingAmount.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Investment Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Funds secured by XRPL conditional escrow</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Automatic release upon verified health outcomes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Cryptographic proof of outcome achievement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Transparent, auditable transaction history</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {bond.status === 'active' && remainingAmount > 0 && (
              <Button onClick={() => onInvest(bond)} className="flex-1">
                Invest in This Bond
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
