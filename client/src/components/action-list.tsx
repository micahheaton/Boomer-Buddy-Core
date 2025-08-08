import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Action {
  title: string;
  steps: string[];
  when: string;
}

interface ActionListProps {
  actions: Action[];
}

export default function ActionList({ actions }: ActionListProps) {
  const { toast } = useToast();

  const getUrgencyColor = (when: string) => {
    if (when.toLowerCase().includes("now")) return "bg-red-500 text-white";
    if (when.toLowerCase().includes("24")) return "bg-amber-500 text-white";
    return "bg-blue-500 text-white";
  };

  const handleCopySteps = (action: Action) => {
    const text = `${action.title}\n\n${action.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Steps copied",
        description: "Action steps have been copied to your clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Failed to copy steps to clipboard.",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <h3 className="text-2xl font-semibold mb-6 flex items-center">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <span className="text-blue-700 text-lg">✓</span>
        </div>
        What You Should Do Now
      </h3>
      
      {actions.map((action, index) => (
        <div key={index} className="border border-gray-300 rounded-lg p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-xl font-semibold mb-2">{action.title}</h4>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(action.when)}`}>
                {action.when}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopySteps(action)}
              className="ml-4"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {action.steps.map((step, stepIndex) => (
              <div key={stepIndex} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-1 flex-shrink-0">
                  {stepIndex + 1}
                </div>
                <span className="text-lg">{step}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
