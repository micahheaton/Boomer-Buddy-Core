import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResultsDisplay from "@/components/results-display";

export default function Report() {
  const [location] = useLocation();
  const reportId = location.split("/")[2];

  const { data: report, isLoading, error } = useQuery({
    queryKey: ["/api/report", reportId],
    enabled: !!reportId,
  }) as { data: any, isLoading: boolean, error: any };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-700 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h3 className="text-2xl font-semibold mb-4">Loading Report...</h3>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fraud & Scam Shield</h1>
                <p className="text-gray-600 text-lg">Report Not Found</p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Report Not Found</h2>
            <p className="text-lg text-gray-600 mb-6">
              The report you're looking for doesn't exist or may have been removed.
            </p>
            <Button onClick={handleGoHome} size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Return to Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fraud & Scam Shield</h1>
                <p className="text-gray-600 text-lg">Saved Report</p>
              </div>
            </div>
            <Button onClick={handleGoHome} variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 text-center">
          <p className="text-lg text-gray-600">
            Report created on {new Date(report.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        
        <ResultsDisplay 
          result={report.result} 
          analysisId={report.id}
          onStartOver={handleGoHome}
          hideStartOver={true}
        />
      </main>
    </div>
  );
}
