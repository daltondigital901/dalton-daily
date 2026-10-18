// Every section of Dalton Daily. `desk` groups sections into the printed pages.
// `brief` is the editor's instruction to the reporter for that beat.

export const DESKS = [
  { key: "world", name: "The World" },
  { key: "money", name: "Business & Markets" },
  { key: "science", name: "Technology & Science" },
  { key: "law", name: "Law & Courts" },
  { key: "local", name: "Memphis" },
  { key: "ideas", name: "Ideas" },
  { key: "culture", name: "Arts & Culture" },
  { key: "travel", name: "Travel" },
];

export const SECTIONS = [
  {
    key: "geopolitics", desk: "world", name: "Geopolitics", count: 5,
    brief: "Major international developments: wars and ceasefires, diplomacy, elections abroad, sanctions, great-power competition, alliances, and crises. Cover multiple regions, not only the Middle East and Ukraine.",
  },
  {
    key: "natsec", desk: "world", name: "National Security, Intelligence & Espionage", count: 4,
    brief: "U.S. and allied national security, the intelligence community, espionage cases and arrests, counterintelligence, cyber operations attributed to states, terrorism, defense policy, diplomatic security, and declassifications. Prefer hard reporting over opinion.",
  },
  {
    key: "business", desk: "money", name: "Business", count: 4,
    brief: "Significant corporate news: deals, earnings that moved markets, layoffs, leadership changes, antitrust, small-business and entrepreneurship trends, and the digital marketing / local search industry when there is real news there.",
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
    brief: "Consumer and enterprise technology, chips and semiconductors, cybersecurity incidents, platforms and regulation, major product launches. Leave AI-specific news to the AI section unless it is primarily about hardware or policy.",
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
    key: "travel", desk: "travel", name: "Travel", count: 3,
    brief: "Travel news and ideas: airline and airport changes (especially anything affecting Memphis International), State Department travel advisories, destinations in season, sailing and coastal travel, and notable deals or disruptions.",
  },
];

export const READER_PROFILE =
  "The reader is the publisher himself: a Memphis-based entrepreneur who runs a lead-generation agency, " +
  "a Tennessee attorney, and a former U.S. State Department Diplomatic Security special agent. He reads widely, " +
  "wants substance over hype, and dislikes filler.";
