// Every section of Dalton Daily. `desk` groups sections into the printed pages.
// `brief` is the editor's instruction to the reporter for that beat.
// `optional`: may come back empty on a slow day (hidden when empty).
// `lookback`: days of past headlines to avoid repeating (default 3; longer for evergreen beats).

export const DESKS = [
  { key: "world", name: "The World" },
  { key: "money", name: "Business & Markets" },
  { key: "science", name: "Technology & Science" },
  { key: "law", name: "Law & Courts" },
  { key: "local", name: "Memphis" },
  { key: "ideas", name: "Ideas" },
  { key: "culture", name: "Arts & Culture" },
  { key: "sports", name: "Sports" },
  { key: "travel", name: "Travel" },
];

export const SECTIONS = [
  {
    key: "geopolitics", desk: "world", name: "Geopolitics", count: 5,
    brief: "Major international developments: wars and ceasefires, diplomacy, elections abroad, sanctions, great-power competition, alliances, and crises. Cover multiple regions, not only the Middle East and Ukraine. Use Foreign Policy, Foreign Affairs, The Economist, The Diplomat, Crisis Group and regional outlets alongside wires.",
  },
  {
    key: "natsec", desk: "world", name: "National Security, Intelligence & Espionage", count: 4,
    brief: "U.S. and allied national security, the intelligence community, espionage cases and arrests, counterintelligence, cyber operations attributed to states, terrorism, defense policy, diplomatic security, and declassifications. Prefer hard reporting over opinion: Lawfare, Just Security, War on the Rocks, Defense One, Breaking Defense, The Record, Foreign Policy, court filings and DOJ releases.",
  },
  {
    key: "epstein", desk: "world", name: "The Epstein Files", count: 2, optional: true, lookback: 7,
    brief: "Developments in the Jeffrey Epstein case and its aftermath: court unsealings and filings, DOJ and FBI releases, congressional oversight and subpoenas, the estate, banks and associates, Ghislaine Maxwell's case, FOIA releases, and the questions around his death at MCC New York (the OIG report, autopsy disputes, surveillance and guard records). Link primary documents wherever they exist and use investigative reporting. Be precise: separate documented facts and official findings from allegations and theories, and say who claims what.",
  },
  {
    key: "business", desk: "money", name: "Business", count: 4,
    brief: "Significant corporate news: deals, earnings that moved markets, layoffs, leadership changes, antitrust, small-business and entrepreneurship trends.",
  },
  {
    key: "seo", desk: "money", name: "Search & SEO", count: 3,
    brief: "Search and SEO news that matters to a local lead-generation business: Google core, spam and helpful-content updates and ranking volatility; Google Business Profile, local pack and Maps changes, verification and spam enforcement; AI Overviews, AI Mode and AI search engines and their effect on clicks; Google antitrust remedies touching search; Bing, ChatGPT and Perplexity search; Google Ads changes for local services. Prefer the Google Search Central blog and official Google statements (primary), Search Engine Land, Search Engine Roundtable, Search Engine Journal, Sterling Sky and Near Media.",
  },
  {
    key: "finance", desk: "money", name: "Finance", count: 4,
    brief: "Markets and money: the Fed and rates, inflation and jobs data, bond and equity moves, crypto only when genuinely significant, banking and credit, and anything that changes the outlook for investors. Include actual index levels or figures where the sources give them. Never give investment advice.",
  },
  {
    key: "energy", desk: "money", name: "Energy & Infrastructure", count: 3,
    brief: "Oil, gas, power grids, nuclear, renewables, data-center power demand, pipelines, transmission, transportation and public works, and major infrastructure funding or failures.",
  },
  {
    key: "technology", desk: "science", name: "Technology", count: 4,
    brief: "Consumer and enterprise technology, chips and semiconductors, cybersecurity incidents, platforms and regulation, major product launches. Leave AI news to the AI section and search news to Search & SEO.",
  },
  {
    key: "ai", desk: "science", name: "Artificial Intelligence", count: 5,
    brief: "AI models and labs, research results, AI policy and regulation, AI in business and law, agents and automation tools, notable failures and safety issues. Be precise about what was actually released or shown versus claimed.",
  },
  {
    key: "science", desk: "science", name: "Science", count: 3,
    brief: "Peer-reviewed findings and notable research across medicine, physics, biology, climate and earth science, archaeology. Say where a study was published and whether it is preliminary.",
  },
  {
    key: "space", desk: "science", name: "Space Exploration", count: 3,
    brief: "Launches, missions, NASA and other space agencies, SpaceX and commercial space, astronomy discoveries, and upcoming events worth watching in the sky.",
  },
  {
    key: "law", desk: "law", name: "Law", count: 4,
    brief: "Supreme Court and federal appellate decisions, major litigation, Tennessee courts and legislation, personal injury and tort law developments, TCPA and consumer-protection rulings, legal-profession and bar news. Name the court and case.",
  },
  {
    key: "memphis", desk: "local", name: "Memphis & Shelby County Politics", count: 4, local: true,
    brief: "Memphis city government, the mayor and city council, Shelby County Commission and mayor, Memphis-Shelby County Schools board, local elections, policing and public-safety policy, MLGW, development and budget fights, and Tennessee state actions that hit Memphis. Prefer local outlets such as the Daily Memphian, Commercial Appeal, MLK50, Tennessee Lookout, WREG, Action News 5 and Local Memphis.",
  },
  {
    key: "religion", desk: "ideas", name: "Religion & Philosophy", count: 3,
    brief: "News from religious institutions and communities worldwide, religion and law, notable books and debates in philosophy and ethics, and serious essays worth reading. Treat all traditions even-handedly.",
  },
  {
    key: "arts", desk: "culture", name: "Arts", count: 3,
    brief: "Visual art, museums, theater, architecture and design: major exhibitions, acquisitions, auctions, openings and closings.",
  },
  {
    key: "books", desk: "culture", name: "Books", count: 3,
    brief: "Notable new releases this week, prize news, publishing industry news, and books receiving significant critical attention. Mention author and publisher.",
  },
  {
    key: "movies", desk: "culture", name: "Movies", count: 3,
    brief: "New releases and how critics received them, box office results, festivals and awards, and significant industry news.",
  },
  {
    key: "music", desk: "culture", name: "Music", count: 3,
    brief: "Notable new albums and how they were received, tours, awards, and industry news. Include Memphis music news when there is any.",
  },
  {
    key: "grappling", desk: "sports", name: "Jiu-Jitsu & Judo", count: 3, lookback: 5,
    brief: "Brazilian jiu-jitsu, submission grappling and judo: IBJJF, ADCC, WNO, CJI, UFC Fight Pass Invitational and other major events — results, upsets, upcoming cards and rule changes; the IJF World Tour, Grand Slams and Olympic judo; notable athletes, academies and controversies; Memphis-area events when there are any. Use FloGrappling, Jits Magazine, BJJ Heroes, BJJEE, the IJF site and JudoInside alongside mainstream coverage.",
  },
  {
    key: "travel", desk: "travel", name: "Travel News", count: 2,
    brief: "Travel news: airline and airport changes (especially anything affecting Memphis International), State Department travel advisories, and notable deals or disruptions.",
  },
  {
    key: "dive", desk: "travel", name: "Dive Destinations", count: 2, lookback: 45,
    brief: "Scuba destinations worth considering now: what is in season (mantas, whale sharks, hammerheads, migrations, visibility windows), liveaboards and dive resorts, wreck and reef sites, reef health and marine-park closures. For each: where it is, why now, best months, typical depth and experience level, and roughly how to get there from Memphis. Use dive publications (Scuba Diving, DIVE, Sport Diver, Undercurrent), DAN, operators and marine-park authorities.",
  },
  {
    key: "offbeat", desk: "travel", name: "Off the Beaten Path", count: 2, lookback: 45,
    brief: "Less-traveled destinations and trips worth considering: overlooked regions, new routes that just opened, small islands and coasts (sailing grounds welcome), mountain towns, and unusual journeys. For each: what makes it special, the best season, practical safety and access notes (check the current State Department advisory), and roughly how to get there from Memphis.",
  },
];

export const READER_PROFILE =
  "The reader is the publisher himself: a Memphis-based entrepreneur who runs a local lead-generation agency, " +
  "a Tennessee attorney, a former U.S. State Department Diplomatic Security special agent. " +
  "He reads widely, wants substance over hype, and dislikes filler.";
