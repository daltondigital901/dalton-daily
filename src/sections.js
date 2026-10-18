// Every section of Dalton Daily. `desk` groups sections into the printed pages.
// `brief` is the editor's instruction to the reporter for that beat.
// `optional`: may come back empty on a slow day (hidden when empty).
// `lookback`: days of past headlines to avoid repeating (default 3; longer for evergreen beats).

export const DESKS = [
  { key: "world", slug: "world", name: "The World", short: "World" },
  { key: "money", slug: "business", name: "Business & Markets", short: "Business" },
  { key: "science", slug: "technology", name: "Technology & Science", short: "Tech & Science" },
  { key: "law", slug: "law", name: "Law & Courts", short: "Law" },
  { key: "local", slug: "memphis", name: "Memphis", short: "Memphis" },
  { key: "ideas", slug: "ideas", name: "Ideas", short: "Ideas" },
  { key: "culture", slug: "culture", name: "Arts & Culture", short: "Culture" },
  { key: "sports", slug: "sports", name: "Sports", short: "Sports" },
  { key: "travel", slug: "travel", name: "Travel", short: "Travel" },
];

export const SECTIONS = [
  {
    key: "geopolitics", desk: "world", name: "Geopolitics", photo: "United Nations General Assembly hall", count: 5,
    brief: "Major international developments: wars and ceasefires, diplomacy, elections abroad, sanctions, great-power competition, alliances, and crises. Cover multiple regions, not only the Middle East and Ukraine. Use Foreign Policy, Foreign Affairs, The Economist, The Diplomat, Crisis Group and regional outlets alongside wires.",
  },
  {
    key: "natsec", desk: "world", name: "National Security, Intelligence & Espionage", photo: "The Pentagon", count: 4,
    brief: "U.S. and allied national security, the intelligence community, espionage cases and arrests, counterintelligence, cyber operations attributed to states, terrorism, defense policy, diplomatic security, and declassifications. Prefer hard reporting over opinion: Lawfare, Just Security, War on the Rocks, Defense One, Breaking Defense, The Record, Foreign Policy, court filings and DOJ releases.",
  },
  {
    key: "epstein", desk: "world", name: "The Epstein Files", photo: "Metropolitan Correctional Center, New York", count: 2, optional: true, lookback: 7,
    brief: "Developments in the Jeffrey Epstein case and its aftermath: court unsealings and filings, DOJ and FBI releases, congressional oversight and subpoenas, the estate, banks and associates, Ghislaine Maxwell's case, FOIA releases, and the questions around his death at MCC New York (the OIG report, autopsy disputes, surveillance and guard records). Link primary documents wherever they exist and use investigative reporting. Be precise: separate documented facts and official findings from allegations and theories, and say who claims what.",
  },
  {
    key: "business", desk: "money", name: "Business", photo: "New York Stock Exchange", count: 4,
    brief: "Significant corporate news: deals, earnings that moved markets, layoffs, leadership changes, antitrust, small-business and entrepreneurship trends.",
  },
  {
    key: "seo", desk: "money", name: "Search & SEO", photo: "Googleplex", count: 3,
    brief: "Search and SEO news that matters to a local lead-generation business: Google core, spam and helpful-content updates and ranking volatility; Google Business Profile, local pack and Maps changes, verification and spam enforcement; AI Overviews, AI Mode and AI search engines and their effect on clicks; Google antitrust remedies touching search; Bing, ChatGPT and Perplexity search; Google Ads changes for local services. Prefer the Google Search Central blog and official Google statements (primary), Search Engine Land, Search Engine Roundtable, Search Engine Journal, Sterling Sky and Near Media.",
  },
  {
    key: "finance", desk: "money", name: "Finance", photo: "Wall Street", count: 4,
    brief: "Markets and money: the Fed and rates, inflation and jobs data, bond and equity moves, crypto only when genuinely significant, banking and credit, and anything that changes the outlook for investors. Include actual index levels or figures where the sources give them. Never give investment advice.",
  },
  {
    key: "energy", desk: "money", name: "Energy & Infrastructure", photo: "Electric power transmission", count: 3,
    brief: "Oil, gas, power grids, nuclear, renewables, data-center power demand, pipelines, transmission, transportation and public works, and major infrastructure funding or failures.",
  },
  {
    key: "technology", desk: "science", name: "Technology", photo: "Semiconductor wafer", count: 4,
    brief: "Consumer and enterprise technology, chips and semiconductors, cybersecurity incidents, platforms and regulation, major product launches. Leave AI news to the AI section and search news to Search & SEO.",
  },
  {
    key: "ai", desk: "science", name: "Artificial Intelligence", photo: "Data center", count: 5,
    brief: "AI models and labs, research results, AI policy and regulation, AI in business and law, agents and automation tools, notable failures and safety issues. Be precise about what was actually released or shown versus claimed.",
  },
  {
    key: "science", desk: "science", name: "Science", photo: "Laboratory", count: 3,
    brief: "Peer-reviewed findings and notable research across medicine, physics, biology, climate and earth science, archaeology. Say where a study was published and whether it is preliminary.",
  },
  {
    key: "space", desk: "science", name: "Space Exploration", photo: "Rocket launch", count: 3,
    brief: "Launches, missions, NASA and other space agencies, SpaceX and commercial space, astronomy discoveries, and upcoming events worth watching in the sky.",
  },
  {
    key: "law", desk: "law", name: "Law", photo: "Supreme Court of the United States building", count: 4,
    brief: "Supreme Court and federal appellate decisions, major litigation, Tennessee courts and legislation, personal injury and tort law developments, TCPA and consumer-protection rulings, legal-profession and bar news. Name the court and case.",
  },
  {
    key: "memphis", desk: "local", name: "Memphis & Shelby County Politics", photo: "Memphis City Hall", count: 4, local: true,
    brief: "Memphis city government, the mayor and city council, Shelby County Commission and mayor, Memphis-Shelby County Schools board, local elections, policing and public-safety policy, MLGW, development and budget fights, and Tennessee state actions that hit Memphis. Prefer local outlets such as the Daily Memphian, Commercial Appeal, MLK50, Tennessee Lookout, WREG, Action News 5 and Local Memphis.",
  },
  {
    key: "events", desk: "local", name: "Memphis Events", photo: "Beale Street Memphis", count: 4, local: true, lookback: 7,
    brief: "Worth-going-to events in Memphis and nearby (Germantown, Collierville, Bartlett, Midtown, Downtown) over the next 7 days: concerts and recitals (the Memphis Symphony Orchestra, Germantown Performing Arts Centre, Iris Collective, Levitt Shell, Minglewood Hall, the Orpheum), theater, museum openings (Brooks, Dixon, Stax, NCRM), festivals, markets, talks, and notable sports dates. Lead each with the date, time and venue in the dek, and include the price or ticket link when known. Prefer event pages and venue calendars (primary), Memphis Travel, Choose901, the Memphis Flyer and the Daily Memphian.",
  },
  {
    key: "religion", desk: "ideas", name: "Religion & Philosophy", photo: "Cathedral interior", count: 3,
    brief: "News from religious institutions and communities worldwide, religion and law, notable books and debates in philosophy and ethics, and serious essays worth reading. Treat all traditions even-handedly.",
  },
  {
    key: "arts", desk: "culture", name: "Arts", photo: "Art museum gallery", count: 3,
    brief: "Visual art, museums, theater, architecture and design: major exhibitions, acquisitions, auctions, openings and closings.",
  },
  {
    key: "books", desk: "culture", name: "Books", photo: "Library reading room", count: 3,
    brief: "Notable new releases this week, prize news, publishing industry news, and books receiving significant critical attention. Mention author and publisher.",
  },
  {
    key: "movies", desk: "culture", name: "Movies", photo: "Movie theater", count: 3,
    brief: "New releases and how critics received them, box office results, festivals and awards, and significant industry news.",
  },
  {
    key: "music", desk: "culture", name: "Music: Piano & Classical", photo: "Grand piano", count: 4,
    brief: "Mostly piano: notable new piano recordings and how critics received them, major recitals and concerto performances, pianists in the news, competitions (the Van Cliburn, Chopin, Leeds, Queen Elisabeth, Busoni and others), repertoire discoveries and anniversaries. Then classical music broadly: orchestras, opera, conductors and premieres, including the Memphis Symphony Orchestra. Close with at most one story from music in general when it is genuinely significant. Use Gramophone, BBC Music Magazine, Bachtrack, Slipped Disc, Pianist magazine, The Strad, the Guardian and New York Times classical coverage, and label and competition pages.",
  },
  {
    key: "grappling", desk: "sports", name: "Jiu-Jitsu & Judo", photo: "Brazilian jiu-jitsu", count: 3, lookback: 5,
    brief: "Brazilian jiu-jitsu, submission grappling and judo: IBJJF, ADCC, WNO, CJI, UFC Fight Pass Invitational and other major events — results, upsets, upcoming cards and rule changes; the IJF World Tour, Grand Slams and Olympic judo; notable athletes, academies and controversies; Memphis-area events when there are any. Use FloGrappling, Jits Magazine, BJJ Heroes, BJJEE, the IJF site and JudoInside alongside mainstream coverage.",
  },
  {
    key: "travel", desk: "travel", name: "Travel News", photo: "Airport terminal", count: 2,
    brief: "Travel news: airline and airport changes (especially anything affecting Memphis International), State Department travel advisories, and notable deals or disruptions.",
  },
  {
    key: "dive", desk: "travel", name: "Dive Destinations", photo: "Coral reef scuba diving", count: 2, lookback: 45,
    brief: "Scuba destinations worth considering now: what is in season (mantas, whale sharks, hammerheads, migrations, visibility windows), liveaboards and dive resorts, wreck and reef sites, reef health and marine-park closures. For each: where it is, why now, best months, typical depth and experience level, and roughly how to get there from Memphis. Use dive publications (Scuba Diving, DIVE, Sport Diver, Undercurrent), DAN, operators and marine-park authorities.",
  },
  {
    key: "offbeat", desk: "travel", name: "Off the Beaten Path", photo: "Mountain village", count: 2, lookback: 45,
    brief: "Less-traveled destinations and trips worth considering: overlooked regions, new routes that just opened, small islands and coasts (sailing grounds welcome), mountain towns, and unusual journeys. For each: what makes it special, the best season, practical safety and access notes (check the current State Department advisory), and roughly how to get there from Memphis.",
  },
];

export const READER_PROFILE =
  "The reader is the publisher himself: a Memphis-based entrepreneur who runs a local lead-generation agency, " +
  "a Tennessee attorney, a former U.S. State Department Diplomatic Security special agent. " +
  "He reads widely, wants substance over hype, and dislikes filler.";
