import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Activity, CheckCircle } from "lucide-react";

interface ImpactUrgencyScoreProps {
  score: number; // 0-100
  severity: 'critical' | 'high' | 'medium' | 'low';
  elderVulnerabilities?: string[];
}

export function ImpactUrgencyScore({ score, severity, elderVulnerabilities }: ImpactUrgencyScoreProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getScoreIcon = () => {
    if (score >= 80) return <AlertTriangle className="w-4 h-4" />;
    if (score >= 60) return <TrendingUp className="w-4 h-4" />;
    if (score >= 40) return <Activity className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'URGENT ACTION NEEDED';
    if (score >= 60) return 'HIGH RISK';
    if (score >= 40) return 'MODERATE RISK';
    return 'LOW RISK';
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${getScoreColor()}`}>
        {getScoreIcon()}
        <span className="text-sm font-bold">
          {getScoreLabel()} ({score}/100)
        </span>
      </div>
      
      <Badge variant="outline" className={getSeverityColor()}>
        {severity.toUpperCase()} PRIORITY
      </Badge>

      {elderVulnerabilities && elderVulnerabilities.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Targets:</span>
          <Badge variant="secondary" className="text-xs">
            {elderVulnerabilities.join(", ")}
          </Badge>
        </div>
      )}
    </div>
  );
}