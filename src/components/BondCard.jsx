import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Heart, MapPin, Calendar, TrendingUp, CheckCircle, Clock } from "lucide-react";

export function BondCard({ bond, onInvest, onViewDetails }) {
  const progressPercentage = (bond.currentAmount / bond.targetAmount) * 100;
  
  // Normalize status to lowercase for consistent comparison
  const status = bond.status?.toLowerCase() || '';
  
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-blue-500';
      case 'funded': return 'bg-green-500';
      case 'completed': return 'bg-purple-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'active': return <Clock className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">{bond.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {bond.description}
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(status)} text-white flex items-center gap-1`}>
            {getStatusIcon(status)}
            {bond.status.charAt(0).toUpperCase() + bond.status.slice(1).toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Health Outcome */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Heart className="w-4 h-4 text-red-500" />
          <span className="font-medium">Health Impact:</span>
          <span className="text-muted-foreground break-words">{bond.healthOutcome}</span>
        </div>

        {/* Provider Info */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{bond.provider.name}</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">• {bond.provider.location}</span>
            {bond.provider.verified && (
              <Badge variant="outline" className="text-xs ml-1">Verified</Badge>
            )}
          </div>
        </div>

        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Funding Progress</span>
            <span className="font-medium">
              ${bond.currentAmount.toLocaleString()} / ${bond.targetAmount.toLocaleString()}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {progressPercentage.toFixed(1)}% funded
          </div>
        </div>

        {/* Yield and Maturity */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="font-medium">{(bond.yieldRate * 100).toFixed(1)}% Yield</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Matures {new Date(bond.maturityDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Outcomes Preview */}
        <div className="space-y-1">
          <span className="text-sm font-medium">Key Outcomes:</span>
          {bond.outcomes.slice(0, 2).map((outcome, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {outcome.achieved ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <Clock className="w-3 h-3 text-gray-400" />
              )}
              <span className={outcome.achieved ? 'text-green-600' : 'text-muted-foreground'}>
                {outcome.target}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewDetails(bond)}
            className="flex-1"
          >
            View Details
          </Button>
          {status === 'active' && (
            <Button 
              size="sm" 
              onClick={() => onInvest(bond)}
              className="flex-1"
            >
              Invest Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
