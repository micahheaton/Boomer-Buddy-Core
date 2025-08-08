import type { ScamAnalysisResult } from "@/types/scam-analysis";

interface RiskScoreProps {
  result: ScamAnalysisResult;
}

export default function RiskScore({ result }: RiskScoreProps) {
  const getScoreColor = (score: number) => {
    if (score <= 30) return "text-green-600";
    if (score <= 70) return "text-amber-600";
    return "text-red-600";
  };

  const getRiskLevel = (score: number) => {
    if (score <= 30) return { level: "LOW RISK", bg: "bg-green-50", border: "border-green-300" };
    if (score <= 70) return { level: "MODERATE RISK", bg: "bg-amber-50", border: "border-amber-300" };
    return { level: "HIGH RISK", bg: "bg-red-50", border: "border-red-300" };
  };

  const riskInfo = getRiskLevel(result.scam_score);

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Analysis Complete</h2>
        <div className="inline-flex items-center space-x-4">
          <div className={`text-6xl font-bold ${getScoreColor(result.scam_score)}`}>
            {result.scam_score}
          </div>
          <div>
            <div className={`text-2xl font-semibold ${getScoreColor(result.scam_score)}`}>
              {riskInfo.level}
            </div>
            <div className="text-lg text-gray-600">
              Confidence: <span className="capitalize">{result.confidence}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Meter */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-600 font-medium">Safe (0-30)</span>
          <span className="text-amber-600 font-medium">Suspicious (31-70)</span>
          <span className="text-red-600 font-medium">High Risk (71-100)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 relative">
          <div className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-4 rounded-full relative">
            <div 
              className="absolute top-0 w-1 h-4 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2"
              style={{ left: `${result.scam_score}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className={`${riskInfo.bg} border-l-4 ${riskInfo.border} p-6 rounded-r-lg`}>
        <h3 className={`font-semibold text-xl mb-2 ${getScoreColor(result.scam_score)}`}>
          {result.label}
        </h3>
        <p className="text-lg text-gray-700">{result.explanation}</p>
      </div>
    </div>
  );
}
