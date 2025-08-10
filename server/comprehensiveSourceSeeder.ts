import { db } from "./db";
import { dataSources } from "@shared/schema";

export class ComprehensiveSourceSeeder {
  async seedAllGovernmentSources() {
    console.log('🌍 Seeding comprehensive 60+ government sources...');
    
    const allSources = [
      // Federal Sources
      { name: "FTC Consumer Alerts", url: "https://consumer.ftc.gov/blog/rss", agency: "Federal Trade Commission", sourceType: "federal", state: null, reliability: 0.95 },
      { name: "FBI IC3 Alerts", url: "https://www.ic3.gov/Media/default.aspx", agency: "FBI Internet Crime Complaint Center", sourceType: "federal", state: null, reliability: 0.98 },
      { name: "Social Security Administration", url: "https://blog.ssa.gov/feed/", agency: "Social Security Administration", sourceType: "federal", state: null, reliability: 0.96 },
      { name: "HHS OIG Consumer Alerts", url: "https://oig.hhs.gov/rss.xml", agency: "HHS Office of Inspector General", sourceType: "federal", state: null, reliability: 0.94 },
      { name: "CISA Cybersecurity Advisories", url: "https://www.cisa.gov/cybersecurity-advisories/rss.xml", agency: "Cybersecurity & Infrastructure Security Agency", sourceType: "federal", state: null, reliability: 0.97 },
      { name: "SEC Investor Alerts", url: "https://www.sec.gov/rss/investor/alerts", agency: "Securities and Exchange Commission", sourceType: "federal", state: null, reliability: 0.95 },
      { name: "CFPB Consumer Advisories", url: "https://www.consumerfinance.gov/about-us/newsroom/press-releases/rss/", agency: "Consumer Financial Protection Bureau", sourceType: "federal", state: null, reliability: 0.94 },
      { name: "FCC Consumer Warnings", url: "https://www.fcc.gov/news-events/headlines/rss", agency: "Federal Communications Commission", sourceType: "federal", state: null, reliability: 0.93 },
      { name: "DOJ Consumer Protection", url: "https://www.justice.gov/rss/consumer-protection", agency: "Department of Justice", sourceType: "federal", state: null, reliability: 0.96 },
      { name: "Treasury FinCEN Advisories", url: "https://www.fincen.gov/rss.xml", agency: "Financial Crimes Enforcement Network", sourceType: "federal", state: null, reliability: 0.95 },
      { name: "Medicare Fraud Alerts", url: "https://www.medicare.gov/rss.xml", agency: "Centers for Medicare & Medicaid Services", sourceType: "federal", state: null, reliability: 0.94 },
      
      // All 50 State Attorneys General
      { name: "Alabama AG Consumer Alerts", url: "https://www.alabamaag.gov/rss", agency: "Alabama Attorney General", sourceType: "state", state: "Alabama", reliability: 0.88 },
      { name: "Alaska AG Consumer Protection", url: "https://law.alaska.gov/department/civil/consumer/rss", agency: "Alaska Attorney General", sourceType: "state", state: "Alaska", reliability: 0.87 },
      { name: "Arizona AG Scam Alerts", url: "https://www.azag.gov/rss", agency: "Arizona Attorney General", sourceType: "state", state: "Arizona", reliability: 0.89 },
      { name: "Arkansas AG Consumer Alerts", url: "https://arkansasag.gov/rss", agency: "Arkansas Attorney General", sourceType: "state", state: "Arkansas", reliability: 0.86 },
      { name: "California AG Consumer Alerts", url: "https://oag.ca.gov/rss", agency: "California Attorney General", sourceType: "state", state: "California", reliability: 0.92 },
      { name: "Colorado AG Consumer Protection", url: "https://coag.gov/rss", agency: "Colorado Attorney General", sourceType: "state", state: "Colorado", reliability: 0.90 },
      { name: "Connecticut AG Consumer Alerts", url: "https://portal.ct.gov/AG/rss", agency: "Connecticut Attorney General", sourceType: "state", state: "Connecticut", reliability: 0.88 },
      { name: "Delaware AG Consumer Protection", url: "https://attorneygeneral.delaware.gov/rss", agency: "Delaware Attorney General", sourceType: "state", state: "Delaware", reliability: 0.87 },
      { name: "Florida AG Scam Alerts", url: "https://myfloridalegal.com/rss", agency: "Florida Attorney General", sourceType: "state", state: "Florida", reliability: 0.91 },
      { name: "Georgia AG Consumer Protection", url: "https://law.georgia.gov/rss", agency: "Georgia Attorney General", sourceType: "state", state: "Georgia", reliability: 0.89 },
      { name: "Hawaii AG Consumer Alerts", url: "https://ag.hawaii.gov/rss", agency: "Hawaii Attorney General", sourceType: "state", state: "Hawaii", reliability: 0.86 },
      { name: "Idaho AG Consumer Protection", url: "https://gov.idaho.gov/ag/rss", agency: "Idaho Attorney General", sourceType: "state", state: "Idaho", reliability: 0.85 },
      { name: "Illinois AG Scam Alerts", url: "https://illinoisattorneygeneral.gov/rss", agency: "Illinois Attorney General", sourceType: "state", state: "Illinois", reliability: 0.90 },
      { name: "Indiana AG Consumer Alerts", url: "https://www.in.gov/attorneygeneral/rss", agency: "Indiana Attorney General", sourceType: "state", state: "Indiana", reliability: 0.88 },
      { name: "Iowa AG Consumer Protection", url: "https://www.iowaattorneygeneral.gov/rss", agency: "Iowa Attorney General", sourceType: "state", state: "Iowa", reliability: 0.87 },
      { name: "Kansas AG Consumer Alerts", url: "https://ag.ks.gov/rss", agency: "Kansas Attorney General", sourceType: "state", state: "Kansas", reliability: 0.86 },
      { name: "Kentucky AG Consumer Protection", url: "https://ag.ky.gov/rss", agency: "Kentucky Attorney General", sourceType: "state", state: "Kentucky", reliability: 0.87 },
      { name: "Louisiana AG Scam Alerts", url: "https://www.ag.state.la.us/rss", agency: "Louisiana Attorney General", sourceType: "state", state: "Louisiana", reliability: 0.88 },
      { name: "Maine AG Consumer Alerts", url: "https://www.maine.gov/ag/rss", agency: "Maine Attorney General", sourceType: "state", state: "Maine", reliability: 0.86 },
      { name: "Maryland AG Consumer Protection", url: "https://www.marylandattorneygeneral.gov/rss", agency: "Maryland Attorney General", sourceType: "state", state: "Maryland", reliability: 0.89 },
      { name: "Massachusetts AG Consumer Alerts", url: "https://www.mass.gov/ag/rss", agency: "Massachusetts Attorney General", sourceType: "state", state: "Massachusetts", reliability: 0.91 },
      { name: "Michigan AG Consumer Protection", url: "https://www.michigan.gov/ag/rss", agency: "Michigan Attorney General", sourceType: "state", state: "Michigan", reliability: 0.89 },
      { name: "Minnesota AG Scam Alerts", url: "https://www.ag.state.mn.us/rss", agency: "Minnesota Attorney General", sourceType: "state", state: "Minnesota", reliability: 0.88 },
      { name: "Mississippi AG Consumer Alerts", url: "https://www.ago.state.ms.us/rss", agency: "Mississippi Attorney General", sourceType: "state", state: "Mississippi", reliability: 0.85 },
      { name: "Missouri AG Consumer Protection", url: "https://ago.mo.gov/rss", agency: "Missouri Attorney General", sourceType: "state", state: "Missouri", reliability: 0.87 },
      { name: "Montana AG Consumer Alerts", url: "https://dojmt.gov/ag/rss", agency: "Montana Attorney General", sourceType: "state", state: "Montana", reliability: 0.84 },
      { name: "Nebraska AG Consumer Protection", url: "https://ago.nebraska.gov/rss", agency: "Nebraska Attorney General", sourceType: "state", state: "Nebraska", reliability: 0.86 },
      { name: "Nevada AG Scam Alerts", url: "https://ag.nv.gov/rss", agency: "Nevada Attorney General", sourceType: "state", state: "Nevada", reliability: 0.87 },
      { name: "New Hampshire AG Consumer Alerts", url: "https://www.doj.nh.gov/rss", agency: "New Hampshire Attorney General", sourceType: "state", state: "New Hampshire", reliability: 0.86 },
      { name: "New Jersey AG Consumer Protection", url: "https://www.nj.gov/oag/rss", agency: "New Jersey Attorney General", sourceType: "state", state: "New Jersey", reliability: 0.90 },
      { name: "New Mexico AG Consumer Alerts", url: "https://www.nmag.gov/rss", agency: "New Mexico Attorney General", sourceType: "state", state: "New Mexico", reliability: 0.85 },
      { name: "New York AG Scam Alerts", url: "https://ag.ny.gov/rss", agency: "New York Attorney General", sourceType: "state", state: "New York", reliability: 0.92 },
      { name: "North Carolina AG Consumer Protection", url: "https://ncdoj.gov/rss", agency: "North Carolina Attorney General", sourceType: "state", state: "North Carolina", reliability: 0.89 },
      { name: "North Dakota AG Consumer Alerts", url: "https://attorneygeneral.nd.gov/rss", agency: "North Dakota Attorney General", sourceType: "state", state: "North Dakota", reliability: 0.84 },
      { name: "Ohio AG Consumer Protection", url: "https://www.ohioattorneygeneral.gov/rss", agency: "Ohio Attorney General", sourceType: "state", state: "Ohio", reliability: 0.89 },
      { name: "Oklahoma AG Scam Alerts", url: "https://www.oag.ok.gov/rss", agency: "Oklahoma Attorney General", sourceType: "state", state: "Oklahoma", reliability: 0.86 },
      { name: "Oregon AG Consumer Alerts", url: "https://www.doj.state.or.us/rss", agency: "Oregon Attorney General", sourceType: "state", state: "Oregon", reliability: 0.88 },
      { name: "Pennsylvania AG Consumer Protection", url: "https://www.attorneygeneral.gov/rss", agency: "Pennsylvania Attorney General", sourceType: "state", state: "Pennsylvania", reliability: 0.89 },
      { name: "Rhode Island AG Consumer Alerts", url: "https://riag.ri.gov/rss", agency: "Rhode Island Attorney General", sourceType: "state", state: "Rhode Island", reliability: 0.86 },
      { name: "South Carolina AG Consumer Protection", url: "https://www.scag.gov/rss", agency: "South Carolina Attorney General", sourceType: "state", state: "South Carolina", reliability: 0.87 },
      { name: "South Dakota AG Consumer Alerts", url: "https://atg.sd.gov/rss", agency: "South Dakota Attorney General", sourceType: "state", state: "South Dakota", reliability: 0.84 },
      { name: "Tennessee AG Scam Alerts", url: "https://www.tn.gov/attorneygeneral/rss", agency: "Tennessee Attorney General", sourceType: "state", state: "Tennessee", reliability: 0.88 },
      { name: "Texas AG Consumer Protection", url: "https://www.texasattorneygeneral.gov/rss", agency: "Texas Attorney General", sourceType: "state", state: "Texas", reliability: 0.91 },
      { name: "Utah AG Consumer Alerts", url: "https://attorneygeneral.utah.gov/rss", agency: "Utah Attorney General", sourceType: "state", state: "Utah", reliability: 0.87 },
      { name: "Vermont AG Consumer Protection", url: "https://ago.vermont.gov/rss", agency: "Vermont Attorney General", sourceType: "state", state: "Vermont", reliability: 0.85 },
      { name: "Virginia AG Consumer Alerts", url: "https://www.oag.state.va.us/rss", agency: "Virginia Attorney General", sourceType: "state", state: "Virginia", reliability: 0.89 },
      { name: "Washington AG Consumer Protection", url: "https://www.atg.wa.gov/rss", agency: "Washington Attorney General", sourceType: "state", state: "Washington", reliability: 0.91 },
      { name: "West Virginia AG Consumer Alerts", url: "https://ago.wv.gov/rss", agency: "West Virginia Attorney General", sourceType: "state", state: "West Virginia", reliability: 0.85 },
      { name: "Wisconsin AG Consumer Protection", url: "https://www.doj.state.wi.us/rss", agency: "Wisconsin Attorney General", sourceType: "state", state: "Wisconsin", reliability: 0.88 },
      { name: "Wyoming AG Consumer Alerts", url: "https://ag.wyo.gov/rss", agency: "Wyoming Attorney General", sourceType: "state", state: "Wyoming", reliability: 0.84 },
      
      // Authorized Nonprofits
      { name: "AARP Fraud Watch Network", url: "https://www.aarp.org/money/scams-fraud/rss.xml", agency: "AARP", sourceType: "nonprofit", state: null, reliability: 0.93 },
      { name: "Better Business Bureau Scam Tracker", url: "https://www.bbb.org/scamtracker/rss", agency: "Better Business Bureau", sourceType: "nonprofit", state: null, reliability: 0.91 }
    ];

    try {
      // Insert all sources with ON CONFLICT DO UPDATE to handle duplicates
      for (const source of allSources) {
        await db.insert(dataSources)
          .values({
            name: source.name,
            url: source.url,
            agency: source.agency,
            reliability: source.reliability,
            status: 'active',
            lastChecked: new Date()
          })
          .onConflictDoUpdate({
            target: dataSources.url,
            set: {
              name: source.name,
              agency: source.agency,
              reliability: source.reliability,
              status: 'active',
              lastChecked: new Date()
            }
          });
      }

      console.log(`✅ Successfully seeded ${allSources.length} comprehensive government sources`);
      console.log(`   📊 Federal sources: ${allSources.filter(s => s.sourceType === 'federal').length}`);
      console.log(`   🏛️ State AG sources: ${allSources.filter(s => s.sourceType === 'state').length}`);
      console.log(`   🤝 Nonprofit sources: ${allSources.filter(s => s.sourceType === 'nonprofit').length}`);
      
      return allSources.length;
    } catch (error) {
      console.error('❌ Error seeding comprehensive sources:', error);
      throw error;
    }
  }
}

export const comprehensiveSourceSeeder = new ComprehensiveSourceSeeder();