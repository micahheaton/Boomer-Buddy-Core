
import CommunityProtection from "@/components/community-protection";
import Navigation from "@/components/Navigation";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Community Protection Network
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect with the community while staying informed through official government data sources. 
            Built by cybersecurity leaders launched summer 2025 with transparency and official data integrity.
          </p>
        </div>

        <CommunityProtection />
      </main>
    </div>
  );
}