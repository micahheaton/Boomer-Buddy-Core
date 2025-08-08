import { apiRequest } from "./queryClient";
import type { ScamAnalysisResult } from "@/types/scam-analysis";

// Re-export apiRequest for direct use
export { apiRequest };

export async function analyzeContent(data: any): Promise<{ result: ScamAnalysisResult; analysisId: string }> {
  const response = await apiRequest("POST", "/api/analyze", data);
  return await response.json();
}

export async function getReport(id: string): Promise<{ id: string; result: ScamAnalysisResult; createdAt: string; inputType: string }> {
  const response = await apiRequest("GET", `/api/report/${id}`);
  return await response.json();
}

export async function getStates(): Promise<Array<{ code: string; name: string }>> {
  const response = await apiRequest("GET", "/api/states");
  return await response.json();
}
