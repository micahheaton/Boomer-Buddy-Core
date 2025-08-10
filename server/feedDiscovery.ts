import fetch from 'node-fetch';
import cheerio from 'cheerio';

interface FeedCandidate {
  url: string;
  title: string;
  type: 'rss' | 'govdelivery' | 'poll';
  scamRelevance: number;
  httpOk: boolean;
}

interface StateSeeds {
  state: string;
  seeds: string[];
}

const HEADERS = {
  'User-Agent': 'BoomerBuddy/1.0 (+https://boomerbuddy.app)'
};

const SCAM_KEYWORDS = [
  'scam', 'fraud', 'consumer alert', 'consumer-protection', 'elder', 'robocall',
  'identity theft', 'phishing', 'imposter', 'spoof', 'gift card', 'romance', 
  'grandparent', 'medicare fraud', 'social security', 'irs scam', 'utility scam'
];

const RSS_HINTS = ['rss', 'atom', 'feed', 'xml'];

// Complete state seeds based on GPT guidance
const STATE_SEEDS: StateSeeds[] = [
  {"state":"Alabama","seeds":["https://www.alabamaag.gov/newsroom","https://www.alabamaag.gov/consumercomplaints"]},
  {"state":"Alaska","seeds":["https://law.alaska.gov/department/civil/consumer/","https://law.alaska.gov/press/"]},
  {"state":"Arizona","seeds":["https://www.azag.gov/press-releases","https://www.azag.gov/consumer"]},
  {"state":"Arkansas","seeds":["https://arkansasag.gov/news-releases/","https://arkansasag.gov/resources/consumer-protection/"]},
  {"state":"California","seeds":["https://oag.ca.gov/consumers","https://oag.ca.gov/media/news"]},
  {"state":"Colorado","seeds":["https://coag.gov/press-releases/","https://coag.gov/office-sections/consumer-protection/"]},
  {"state":"Connecticut","seeds":["https://portal.ct.gov/AG/Press-Releases","https://portal.ct.gov/DCP/Common-Elements/Consumer-Fact-Sheets"]},
  {"state":"Delaware","seeds":["https://attorneygeneral.delaware.gov/newsroom/","https://attorneygeneral.delaware.gov/fraud/consumer-protection/"]},
  {"state":"Florida","seeds":["http://www.myfloridalegal.com/newsrel.nsf/newsreleases","http://www.myfloridalegal.com/consumer"]},
  {"state":"Georgia","seeds":["https://law.georgia.gov/press-releases","https://consumer.georgia.gov/consumer-topics"]},
  {"state":"Hawaii","seeds":["https://ag.hawaii.gov/news/","https://cca.hawaii.gov/ocp/"]},
  {"state":"Idaho","seeds":["https://www.ag.idaho.gov/media/press-releases/","https://www.ag.idaho.gov/office-resources/consumer-protection/"]},
  {"state":"Illinois","seeds":["https://illinoisattorneygeneral.gov/pressroom/","https://illinoisattorneygeneral.gov/consumer/"]},
  {"state":"Indiana","seeds":["https://www.in.gov/attorneygeneral/newsroom/","https://www.in.gov/attorneygeneral/consumer-protection/"]},
  {"state":"Iowa","seeds":["https://www.iowaattorneygeneral.gov/newsroom","https://www.iowaattorneygeneral.gov/for-consumers"]},
  {"state":"Kansas","seeds":["https://ag.ks.gov/media-center/news-releases","https://ag.ks.gov/consumer-protection"]},
  {"state":"Kentucky","seeds":["https://www.ag.ky.gov/Media/News/Pages/default.aspx","https://www.ag.ky.gov/consumer-protection/Pages/default.aspx"]},
  {"state":"Louisiana","seeds":["https://www.ag.state.la.us/News.aspx","https://www.ag.state.la.us/ConsumerMedia.aspx"]},
  {"state":"Maine","seeds":["https://www.maine.gov/ag/news/index.shtml","https://www.maine.gov/ag/consumer/"]},
  {"state":"Maryland","seeds":["https://www.marylandattorneygeneral.gov/press/","https://www.marylandattorneygeneral.gov/Pages/CPD/"]},
  {"state":"Massachusetts","seeds":["https://www.mass.gov/orgs/office-of-attorney-general-andrea-joy-campbell/news","https://www.mass.gov/consumer-protection"]},
  {"state":"Michigan","seeds":["https://www.michigan.gov/ag/news","https://www.michigan.gov/ag/consumer-protection"]},
  {"state":"Minnesota","seeds":["https://www.ag.state.mn.us/Office/PressReleases.asp","https://www.ag.state.mn.us/Consumer/"]},
  {"state":"Mississippi","seeds":["https://www.ago.state.ms.us/releases/","https://www.ago.state.ms.us/divisions/consumer"]},
  {"state":"Missouri","seeds":["https://ago.mo.gov/home/news/press-releases","https://ago.mo.gov/civil-division/consumer/consumer-education"]},
  {"state":"Montana","seeds":["https://dojmt.gov/news/","https://dojmt.gov/consumer/"]},
  {"state":"Nebraska","seeds":["https://ago.nebraska.gov/news","https://protectthegoodlife.nebraska.gov/"]},
  {"state":"Nevada","seeds":["https://ag.nv.gov/News/","https://ag.nv.gov/About/Consumer_Protection/"]},
  {"state":"New Hampshire","seeds":["https://www.doj.nh.gov/news/","https://www.doj.nh.gov/consumer/"]},
  {"state":"New Jersey","seeds":["https://www.nj.gov/oag/newsreleases.htm","https://www.njconsumeraffairs.gov/"]},
  {"state":"New Mexico","seeds":["https://www.nmag.gov/media/press-releases/","https://www.nmag.gov/consumer-protection/"]},
  {"state":"New York","seeds":["https://ag.ny.gov/press-releases","https://ag.ny.gov/consumer-frauds"]},
  {"state":"North Carolina","seeds":["https://ncdoj.gov/media/press-releases/","https://ncdoj.gov/protecting-consumers/"]},
  {"state":"North Dakota","seeds":["https://attorneygeneral.nd.gov/news","https://attorneygeneral.nd.gov/consumer-resources"]},
  {"state":"Ohio","seeds":["https://www.ohioattorneygeneral.gov/Media/News-Releases","https://www.ohioattorneygeneral.gov/Individuals-and-Families/Consumers"]},
  {"state":"Oklahoma","seeds":["https://www.oag.ok.gov/press-releases","https://www.oag.ok.gov/consumer-protection"]},
  {"state":"Oregon","seeds":["https://www.doj.state.or.us/media-home/news-media-releases/","https://www.doj.state.or.us/consumer-protection/"]},
  {"state":"Pennsylvania","seeds":["https://www.attorneygeneral.gov/newsroom/","https://www.attorneygeneral.gov/protect-yourself/"]},
  {"state":"Rhode Island","seeds":["https://www.riag.ri.gov/news","https://www.riag.ri.gov/consumers"]},
  {"state":"South Carolina","seeds":["https://www.scag.gov/news/","https://www.scag.gov/consumer-protection/"]},
  {"state":"South Dakota","seeds":["https://atg.sd.gov/OurOffice/News.aspx","https://atg.sd.gov/Consumers/"]},
  {"state":"Tennessee","seeds":["https://www.tn.gov/attorneygeneral/news.html","https://www.tn.gov/attorneygeneral/consumer-resources.html"]},
  {"state":"Texas","seeds":["https://www.texasattorneygeneral.gov/news/releases","https://www.texasattorneygeneral.gov/consumer-protection"]},
  {"state":"Utah","seeds":["https://attorneygeneral.utah.gov/news/","https://attorneygeneral.utah.gov/consumer-protection/"]},
  {"state":"Vermont","seeds":["https://ago.vermont.gov/news/","https://ago.vermont.gov/consumer-information/"]},
  {"state":"Virginia","seeds":["https://www.oag.state.va.us/media-center/news-releases","https://www.oag.state.va.us/consumer-protection"]},
  {"state":"Washington","seeds":["https://www.atg.wa.gov/news","https://www.atg.wa.gov/consumer-protection"]},
  {"state":"West Virginia","seeds":["https://ago.wv.gov/news/Pages/default.aspx","https://ago.wv.gov/consumerprotection/Pages/default.aspx"]},
  {"state":"Wisconsin","seeds":["https://www.doj.state.wi.us/news-releases","https://www.doj.state.wi.us/office-attorney-general/consumer-protection"]},
  {"state":"Wyoming","seeds":["https://ag.wyo.gov/news","https://ag.wyo.gov/divisions/consumer-protection"]}
];

// Enhanced federal sources from GPT guidance
const FEDERAL_SOURCES = [
  {
    name: "FTC Consumer Alerts",
    type: "rss" as const,
    url: "https://www.ftc.gov/stay-connected/rss",
    weight: 1.0
  },
  {
    name: "FBI IC3 PSAs", 
    type: "rss" as const,
    url: "https://www.ic3.gov/PSA",
    weight: 0.95
  },
  {
    name: "SSA OIG News",
    type: "rss" as const,
    url: "https://oig.ssa.gov/rss/",
    weight: 0.9
  },
  {
    name: "CISA News",
    type: "rss" as const,
    url: "https://www.cisa.gov/news.xml",
    weight: 0.7
  },
  {
    name: "CISA Advisories",
    type: "rss" as const,
    url: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    weight: 0.7
  },
  {
    name: "AARP Press",
    type: "rss" as const,
    url: "https://press.aarp.org/rss",
    weight: 0.8
  }
];

function scoreScamRelevance(text: string): number {
  const t = text.toLowerCase();
  let score = 0;
  for (const keyword of SCAM_KEYWORDS) {
    if (t.includes(keyword)) {
      score += 2;
    }
  }
  return score;
}

function looksLikeFeed(href: string): boolean {
  if (!href) return false;
  const h = href.toLowerCase();
  if (RSS_HINTS.some(hint => h.includes(hint)) && (h.endsWith('.xml') || h.endsWith('.rss') || h.endsWith('.atom'))) {
    return true;
  }
  return RSS_HINTS.some(hint => h.includes(`/${hint}`) || h.includes(`${hint}.`));
}

async function extractFeedsFromPage(url: string): Promise<FeedCandidate[]> {
  try {
    const response = await fetch(url, { 
      headers: HEADERS,
      timeout: 15000 
    });
    
    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const candidates: FeedCandidate[] = [];

    // Find RSS link tags
    $('link[rel*="alternate"]').each((_: any, el: any) => {
      const href = $(el).attr('href');
      const type = $(el).attr('type') || '';
      const title = $(el).attr('title') || '';
      
      if (href && (type.includes('rss') || type.includes('atom'))) {
        const fullUrl = new URL(href, url).href;
        candidates.push({
          url: fullUrl,
          title: title,
          type: 'rss',
          scamRelevance: scoreScamRelevance(title),
          httpOk: false
        });
      }
    });

    // Find visible RSS links
    $('a[href]').each((_: any, el: any) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      if (href && looksLikeFeed(href)) {
        const fullUrl = new URL(href, url).href;
        candidates.push({
          url: fullUrl,
          title: text,
          type: 'rss',
          scamRelevance: scoreScamRelevance(text + ' ' + href),
          httpOk: false
        });
      }
    });

    // Find GovDelivery accounts
    const govDeliveryMatches = html.match(/content\.govdelivery\.com\/accounts\/([^\/]+)/g);
    if (govDeliveryMatches) {
      for (const match of govDeliveryMatches) {
        const accountMatch = match.match(/accounts\/([^\/]+)/);
        if (accountMatch) {
          const account = accountMatch[1];
          const govDeliveryUrl = `https://content.govdelivery.com/accounts/${account}/bulletins.rss`;
          candidates.push({
            url: govDeliveryUrl,
            title: `GovDelivery bulletins for ${account}`,
            type: 'govdelivery',
            scamRelevance: 3,
            httpOk: false
          });
        }
      }
    }

    // Remove duplicates
    const uniqueCandidates = candidates.filter((candidate, index, self) => 
      index === self.findIndex(c => c.url === candidate.url)
    );

    return uniqueCandidates;
  } catch (error) {
    console.error(`Error extracting feeds from ${url}:`, error);
    return [];
  }
}

async function validateFeed(candidate: FeedCandidate): Promise<FeedCandidate> {
  try {
    const response = await fetch(candidate.url, {
      headers: HEADERS,
      timeout: 10000
    });
    
    candidate.httpOk = response.ok;
    
    if (response.ok) {
      const content = await response.text();
      const additionalRelevance = scoreScamRelevance(content.substring(0, 2000));
      candidate.scamRelevance += additionalRelevance;
    }
    
    return candidate;
  } catch (error) {
    candidate.httpOk = false;
    return candidate;
  }
}

export async function discoverStateFeeds(): Promise<{ state: string; feeds: FeedCandidate[] }[]> {
  const results = [];
  
  console.log('🔍 Starting feed discovery for all 50 states...');
  
  for (const stateData of STATE_SEEDS) {
    console.log(`Discovering feeds for ${stateData.state}...`);
    
    const allCandidates: FeedCandidate[] = [];
    
    // Extract feeds from each seed URL
    for (const seed of stateData.seeds) {
      try {
        const candidates = await extractFeedsFromPage(seed);
        allCandidates.push(...candidates);
        
        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing seed ${seed}:`, error);
      }
    }
    
    // Validate top candidates
    const sortedCandidates = allCandidates
      .sort((a, b) => b.scamRelevance - a.scamRelevance)
      .slice(0, 8); // Take top 8 per state
    
    const validatedFeeds = [];
    for (const candidate of sortedCandidates) {
      const validated = await validateFeed(candidate);
      validatedFeeds.push(validated);
      
      // Small delay between validations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Keep only working feeds, sorted by relevance
    const workingFeeds = validatedFeeds
      .filter(f => f.httpOk)
      .sort((a, b) => b.scamRelevance - a.scamRelevance)
      .slice(0, 4); // Keep top 4 working feeds per state
    
    results.push({
      state: stateData.state,
      feeds: workingFeeds
    });
    
    console.log(`✅ Found ${workingFeeds.length} working feeds for ${stateData.state}`);
  }
  
  return results;
}

export async function discoverFederalFeeds(): Promise<FeedCandidate[]> {
  console.log('🔍 Validating federal sources...');
  
  const validatedFeeds = [];
  
  for (const source of FEDERAL_SOURCES) {
    try {
      const candidate: FeedCandidate = {
        url: source.url,
        title: source.name,
        type: source.type,
        scamRelevance: Math.floor(source.weight * 10),
        httpOk: false
      };
      
      const validated = await validateFeed(candidate);
      validatedFeeds.push(validated);
      
      console.log(`📡 ${source.name}: ${validated.httpOk ? 'OK' : 'Failed'}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error validating ${source.name}:`, error);
    }
  }
  
  return validatedFeeds.filter(f => f.httpOk);
}

export { STATE_SEEDS, FEDERAL_SOURCES };