import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Phone, Shield } from "lucide-react";

interface ActionableStepsProps {
  steps: string[];
  reportingInstructions?: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export function ActionableSteps({ steps, reportingInstructions, urgency }: ActionableStepsProps) {
  const getUrgencyColor = () => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getUrgencyIcon = () => {
    switch (urgency) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <Shield className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Card className={`border-l-4 ${getUrgencyColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getUrgencyIcon()}
          What You Should Do Right Now
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps && steps.length > 0 ? (
          <ol className="list-decimal list-inside space-y-2">
            {steps.map((step, index) => (
              <li key={index} className="text-gray-700 leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <div className="bg-yellow-100 p-3 rounded-md">
            <p className="text-yellow-800">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Be cautious of this scam type. Contact authorities if you encounter it.
            </p>
          </div>
        )}
        
        {reportingInstructions && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Report This Scam</h4>
                <p className="text-blue-700 text-sm leading-relaxed">
                  {reportingInstructions}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}