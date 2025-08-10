import { Shield, Users, Globe, Brain, Heart, Award, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { currentLanguage, translate: translateFn } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // Helper function for synchronous translation lookup
  const translate = (text: string) => translations[text] || text;

  // Translate all text when language changes
  useEffect(() => {
    if (currentLanguage.code === 'en') {
      setTranslations({});
      return;
    }

    const textsToTranslate = [
      "Launched Summer", "Official Sources", "Daily Updates", "Protection",
      "Built by cybersecurity leaders with 20+ years experience",
      "Government and authorized nonprofit data only",
      "Real-time collection from trusted .gov/.us sources", 
      "Continuous monitoring and personalized alerts",
      "Compassionate Protection", "Universal Accessibility", "Official Sources Only", "Community Empowerment",
      "We understand that scammers target seniors through emotional manipulation. Our platform provides not just detection, but empathetic guidance and support.",
      "Available in multiple languages with simple interfaces designed specifically for older adults, ensuring no one is left behind.",
      "Every alert comes from official government sources (FTC, FBI IC3, SSA, HHS-OIG, CISA) and authorized nonprofits (AARP, BBB) - no false alarms.",
      "Seniors helping seniors through shared experiences, verified reports, and collective wisdom to outsmart scammers."
    ];

    const translateTexts = async () => {
      const newTranslations: Record<string, string> = {};
      for (const text of textsToTranslate) {
        try {
          newTranslations[text] = await translateFn(text);
        } catch (error) {
          newTranslations[text] = text; // Fallback to original
        }
      }
      setTranslations(newTranslations);
    };

    translateTexts();
  }, [currentLanguage, translateFn]);

  const missionStats = [
    { 
      icon: Shield, 
      number: "2025", 
      label: translate("Launched Summer"),
      description: translate("Built by cybersecurity leaders with 20+ years experience")
    },
    { 
      icon: Users, 
      number: "9", 
      label: translate("Official Sources"),
      description: translate("Government and authorized nonprofit data only")
    },
    { 
      icon: Brain, 
      number: "4x", 
      label: translate("Daily Updates"),
      description: translate("Real-time collection from trusted .gov/.us sources")
    },
    { 
      icon: AlertTriangle, 
      number: "24/7", 
      label: translate("Protection"),
      description: translate("Continuous monitoring and personalized alerts")
    }
  ];

  const coreValues = [
    {
      icon: Heart,
      title: translate("Compassionate Protection"),
      description: translate("We understand that scammers target seniors through emotional manipulation. Our platform provides not just detection, but empathetic guidance and support.")
    },
    {
      icon: Globe,
      title: translate("Universal Accessibility"),
      description: translate("Available in multiple languages with simple interfaces designed specifically for older adults, ensuring no one is left behind.")
    },
    {
      icon: CheckCircle,
      title: translate("Official Sources Only"),
      description: translate("Every alert comes from official government sources (FTC, FBI IC3, SSA, HHS-OIG, CISA) and authorized nonprofits (AARP, BBB) - no false alarms.")
    },
    {
      icon: Award,
      title: translate("Community Empowerment"),
      description: translate("Seniors helping seniors through shared experiences, verified reports, and collective wisdom to outsmart scammers.")
    }
  ];

  const teamMembers = [
    {
      role: translate("Cybersecurity Leadership Team"),
      background: translate("20+ years combined experience in cybersecurity, digital forensics, and elder protection services across government and private sectors"),
      expertise: translate("Threat intelligence, social engineering detection, vulnerable population protection, and government source verification")
    },
    {
      role: translate("AI & Data Science Team"),
      background: translate("Machine learning specialists with expertise in pattern recognition, natural language processing, and personalized vulnerability assessment"),
      expertise: translate("GPT-4o integration, elder-focused social engineering detection, real-time threat correlation, and automated content filtering")
    }
  ];

  const threatTypes = [
    {
      name: translate("Social Security Scams"),
      description: translate("Fake calls threatening benefit suspension"),
      impact: translate("$1.2B lost annually")
    },
    {
      name: translate("Romance Scams"),
      description: translate("Emotional manipulation on dating platforms"),
      impact: translate("$740M lost in 2023")
    },
    {
      name: translate("Tech Support Fraud"),
      description: translate("Fake Microsoft/Apple virus warnings"),
      impact: translate("$650M stolen yearly")
    },
    {
      name: translate("Medicare Fraud"),
      description: translate("Fake health insurance and prescription scams"),
      impact: translate("$890M in fraudulent claims")
    },
    {
      name: translate("Grandparent Scams"),
      description: translate("Fake family emergency money requests"),
      impact: translate("$380M lost to fake emergencies")
    },
    {
      name: translate("Investment Fraud"),
      description: translate("Fake retirement and cryptocurrency schemes"),
      impact: translate("$2.1B retirement savings stolen")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-4 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {translate("About Boomer Buddy")}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            {translate("Your trusted digital shield against scams. We combine advanced AI, verified intelligence, and community wisdom to protect seniors from increasingly sophisticated fraud attempts.")}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge variant="secondary" className="text-sm">
              {translate("AI-Powered Protection")}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {translate("Government Verified")}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {translate("Community Driven")}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {translate("Senior Focused")}
            </Badge>
          </div>
        </div>

        {/* Mission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {missionStats.map((stat, index) => (
            <Card key={index} className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Our Mission */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-blue-600 to-teal-600 text-white border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl text-center">
                {translate("Our Mission")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg leading-relaxed max-w-4xl mx-auto">
                {translate("Scammers specifically target seniors because they perceive them as vulnerable - trusting, less tech-savvy, and often isolated. We reject this narrative. Boomer Buddy empowers seniors with cutting-edge technology, verified intelligence, and community support to not just survive digital threats, but thrive in the modern world.")}
              </p>
              <div className="mt-8 p-6 bg-white/10 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">
                  {translate("Why This Matters")}
                </h3>
                <p className="text-base">
                  {translate("Adults 60+ lose over $3.4 billion annually to fraud - more than any other age group. These aren't just statistics; they're our parents, grandparents, and community members. Every dollar stolen represents trust betrayed, security threatened, and independence undermined. We're here to change that.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            {translate("Our Core Values")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coreValues.map((value, index) => (
              <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-2 rounded-lg">
                      <value.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                      {value.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Threat Landscape */}
        <div className="mb-16">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-gray-900 dark:text-white">
                {translate("The Threats We Combat")}
              </CardTitle>
              <p className="text-center text-gray-600 dark:text-gray-300 mt-4">
                {translate("Understanding the enemy: Common scams targeting seniors and their devastating impact")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {threatTypes.map((threat, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-red-500">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {threat.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {threat.description}
                    </p>
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                      {translate("Impact")}: {threat.impact}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-lg">
                <p className="text-center text-gray-700 dark:text-gray-300 font-semibold">
                  {translate("Combined, these scams steal over $6 billion annually from seniors. Boomer Buddy's intelligence network tracks and prevents these specific threats in real-time.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Our Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            {translate("Our Expert Team")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600 dark:text-blue-400">
                    {member.role}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    <strong>{translate("Background")}:</strong> {member.background}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    <strong>{translate("Expertise")}:</strong> {member.expertise}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Approach */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl text-center">
                {translate("Our Technology Approach")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    {translate("Advanced AI Detection")}
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• {translate("GPT-4o powered social engineering analysis")}</li>
                    <li>• {translate("95%+ accuracy in identifying elder-targeted scams")}</li>
                    <li>• {translate("Real-time pattern recognition and threat correlation")}</li>
                    <li>• {translate("Automatic exclusion of technical jargon and false positives")}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    {translate("Verified Intelligence Network")}
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• {translate("Direct feeds from FTC, FBI IC3, SSA, HHS-OIG, and CISA")}</li>
                    <li>• {translate("4x daily monitoring of 9 official government sources")}</li>
                    <li>• {translate("Community-verified reports with authenticity scoring")}</li>
                    <li>• {translate("Multilingual support for diverse communities")}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 p-6 bg-white/10 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  {translate("Privacy & Security First")}
                </h3>
                <p className="text-sm">
                  {translate("All personal information is encrypted and protected. We never sell data, never track personal communications, and automatically filter out sensitive information before analysis. Your privacy is our priority.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="pt-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {translate("Join the Protection")}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
                {translate("Whether you're protecting yourself, a family member, or your community, Boomer Buddy provides the tools and knowledge to stay safe in the digital age.")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="outline" className="text-sm px-4 py-2">
                  {translate("Free Analysis")}
                </Badge>
                <Badge variant="outline" className="text-sm px-4 py-2">
                  {translate("Community Support")}
                </Badge>
                <Badge variant="outline" className="text-sm px-4 py-2">
                  {translate("Real-time Alerts")}
                </Badge>
                <Badge variant="outline" className="text-sm px-4 py-2">
                  {translate("Expert Guidance")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}