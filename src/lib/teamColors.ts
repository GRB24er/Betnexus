/**
 * Team Colors Database
 * Maps team names to their primary and secondary brand colors.
 * Used for team badges, gradients, and accent colors throughout the UI.
 */

interface TeamColor {
  primary: string;
  secondary: string;
  text: string; // text color on primary background
}

const TEAM_COLORS: Record<string, TeamColor> = {
  // ─── PREMIER LEAGUE ────────────────────────────────────────────────────
  "Arsenal":              { primary: "#EF0107", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Aston Villa":          { primary: "#670E36", secondary: "#95BFE5", text: "#FFFFFF" },
  "AFC Bournemouth":      { primary: "#DA291C", secondary: "#000000", text: "#FFFFFF" },
  "Bournemouth":          { primary: "#DA291C", secondary: "#000000", text: "#FFFFFF" },
  "Brentford":            { primary: "#E30613", secondary: "#FFB81C", text: "#FFFFFF" },
  "Brighton":             { primary: "#0057B8", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Brighton and Hove Albion": { primary: "#0057B8", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Burnley":              { primary: "#6C1D45", secondary: "#99D6EA", text: "#FFFFFF" },
  "Chelsea":              { primary: "#034694", secondary: "#DBA111", text: "#FFFFFF" },
  "Crystal Palace":       { primary: "#1B458F", secondary: "#C4122E", text: "#FFFFFF" },
  "Everton":              { primary: "#003399", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Fulham":               { primary: "#000000", secondary: "#CC0000", text: "#FFFFFF" },
  "Ipswich Town":         { primary: "#0044AA", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Leicester City":       { primary: "#003090", secondary: "#FDBE11", text: "#FFFFFF" },
  "Liverpool":            { primary: "#C8102E", secondary: "#00B2A9", text: "#FFFFFF" },
  "Luton Town":           { primary: "#F78F1E", secondary: "#002D62", text: "#FFFFFF" },
  "Manchester City":      { primary: "#6CABDD", secondary: "#1C2C5B", text: "#FFFFFF" },
  "Man City":             { primary: "#6CABDD", secondary: "#1C2C5B", text: "#FFFFFF" },
  "Manchester United":    { primary: "#DA291C", secondary: "#FBE122", text: "#FFFFFF" },
  "Man Utd":              { primary: "#DA291C", secondary: "#FBE122", text: "#FFFFFF" },
  "Newcastle United":     { primary: "#241F20", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Newcastle":            { primary: "#241F20", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Nottingham Forest":    { primary: "#DD0000", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Sheffield United":     { primary: "#EE2737", secondary: "#000000", text: "#FFFFFF" },
  "Southampton":          { primary: "#D71920", secondary: "#130C0E", text: "#FFFFFF" },
  "Tottenham Hotspur":    { primary: "#132257", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Tottenham":            { primary: "#132257", secondary: "#FFFFFF", text: "#FFFFFF" },
  "West Ham United":      { primary: "#7A263A", secondary: "#1BB1E7", text: "#FFFFFF" },
  "West Ham":             { primary: "#7A263A", secondary: "#1BB1E7", text: "#FFFFFF" },
  "Wolverhampton Wanderers": { primary: "#FDB913", secondary: "#231F20", text: "#000000" },
  "Wolves":               { primary: "#FDB913", secondary: "#231F20", text: "#000000" },
  "Leeds United":         { primary: "#FFCD00", secondary: "#1D428A", text: "#000000" },
  "Sunderland":           { primary: "#EB172B", secondary: "#000000", text: "#FFFFFF" },
  "Sunderland AFC":       { primary: "#EB172B", secondary: "#000000", text: "#FFFFFF" },

  // ─── LA LIGA ───────────────────────────────────────────────────────────
  "Real Madrid":          { primary: "#FEBE10", secondary: "#00529F", text: "#000000" },
  "Barcelona":            { primary: "#A50044", secondary: "#004D98", text: "#FFFFFF" },
  "Atletico Madrid":      { primary: "#CB3524", secondary: "#272E61", text: "#FFFFFF" },
  "Atl. Madrid":          { primary: "#CB3524", secondary: "#272E61", text: "#FFFFFF" },
  "Sevilla":              { primary: "#D40E14", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Real Sociedad":        { primary: "#143C8B", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Real Betis":           { primary: "#00954C", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Villarreal":           { primary: "#FFE114", secondary: "#005187", text: "#000000" },
  "Athletic Bilbao":      { primary: "#EE2523", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Valencia":             { primary: "#EE3524", secondary: "#000000", text: "#FFFFFF" },
  "Celta Vigo":           { primary: "#8AC3EE", secondary: "#FFFFFF", text: "#000000" },
  "Getafe":               { primary: "#004FA3", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Osasuna":              { primary: "#0A346F", secondary: "#D91A21", text: "#FFFFFF" },
  "Mallorca":             { primary: "#E20613", secondary: "#000000", text: "#FFFFFF" },
  "Girona":               { primary: "#CD2534", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Espanyol":             { primary: "#007FC8", secondary: "#FFFFFF", text: "#FFFFFF" },

  // ─── SERIE A ───────────────────────────────────────────────────────────
  "Juventus":             { primary: "#000000", secondary: "#FFFFFF", text: "#FFFFFF" },
  "AC Milan":             { primary: "#FB090B", secondary: "#000000", text: "#FFFFFF" },
  "Inter Milan":          { primary: "#010E80", secondary: "#000000", text: "#FFFFFF" },
  "Napoli":               { primary: "#12A0D7", secondary: "#FFFFFF", text: "#FFFFFF" },
  "AS Roma":              { primary: "#8E1F2F", secondary: "#F0BC42", text: "#FFFFFF" },
  "Roma":                 { primary: "#8E1F2F", secondary: "#F0BC42", text: "#FFFFFF" },
  "Lazio":                { primary: "#87D8F7", secondary: "#FFFFFF", text: "#000000" },
  "Atalanta":             { primary: "#1E71B8", secondary: "#000000", text: "#FFFFFF" },
  "Fiorentina":           { primary: "#482E92", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Bologna":              { primary: "#1A2F48", secondary: "#A21C26", text: "#FFFFFF" },
  "Torino":               { primary: "#8B0000", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Monza":                { primary: "#C4161C", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Genoa":                { primary: "#A51E22", secondary: "#00387B", text: "#FFFFFF" },
  "Cagliari":             { primary: "#6C1D45", secondary: "#004B87", text: "#FFFFFF" },
  "Verona":               { primary: "#FFED00", secondary: "#003DA5", text: "#000000" },
  "Udinese":              { primary: "#000000", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Sassuolo":             { primary: "#00A850", secondary: "#000000", text: "#FFFFFF" },
  "Lecce":                { primary: "#FFE600", secondary: "#E30613", text: "#000000" },
  "Empoli":               { primary: "#00529F", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Parma":                { primary: "#FFED00", secondary: "#00387B", text: "#000000" },

  // ─── BUNDESLIGA ────────────────────────────────────────────────────────
  "Bayern Munich":        { primary: "#DC052D", secondary: "#0066B2", text: "#FFFFFF" },
  "Borussia Dortmund":    { primary: "#FDE100", secondary: "#000000", text: "#000000" },
  "Dortmund":             { primary: "#FDE100", secondary: "#000000", text: "#000000" },
  "RB Leipzig":           { primary: "#DD0741", secondary: "#001F47", text: "#FFFFFF" },
  "Bayer Leverkusen":     { primary: "#E32221", secondary: "#000000", text: "#FFFFFF" },
  "Leverkusen":           { primary: "#E32221", secondary: "#000000", text: "#FFFFFF" },
  "Eintracht Frankfurt":  { primary: "#E1000F", secondary: "#000000", text: "#FFFFFF" },
  "VfB Stuttgart":        { primary: "#E32219", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Stuttgart":            { primary: "#E32219", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Wolfsburg":            { primary: "#65B32E", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Freiburg":             { primary: "#000000", secondary: "#D40000", text: "#FFFFFF" },
  "Hoffenheim":           { primary: "#1961B5", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Werder Bremen":        { primary: "#1D9053", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Union Berlin":         { primary: "#EB1923", secondary: "#FDE100", text: "#FFFFFF" },
  "Augsburg":             { primary: "#BA3733", secondary: "#00572C", text: "#FFFFFF" },
  "Mainz":                { primary: "#ED1C24", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Cologne":              { primary: "#ED1C24", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Heidenheim":           { primary: "#E30613", secondary: "#003DA5", text: "#FFFFFF" },
  "Borussia Monchengladbach": { primary: "#000000", secondary: "#18A950", text: "#FFFFFF" },

  // ─── LIGUE 1 ───────────────────────────────────────────────────────────
  "Paris Saint-Germain":  { primary: "#004170", secondary: "#DA291C", text: "#FFFFFF" },
  "PSG":                  { primary: "#004170", secondary: "#DA291C", text: "#FFFFFF" },
  "Marseille":            { primary: "#2FAEE0", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Olympique de Marseille": { primary: "#2FAEE0", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Lyon":                 { primary: "#1A3C7E", secondary: "#DA291C", text: "#FFFFFF" },
  "Olympique Lyonnais":   { primary: "#1A3C7E", secondary: "#DA291C", text: "#FFFFFF" },
  "Monaco":               { primary: "#E7192E", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Lille":                { primary: "#E2001A", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Nice":                 { primary: "#000000", secondary: "#DA291C", text: "#FFFFFF" },
  "Rennes":               { primary: "#E30613", secondary: "#000000", text: "#FFFFFF" },
  "Lens":                 { primary: "#FFE600", secondary: "#E30613", text: "#000000" },
  "Strasbourg":           { primary: "#0055A4", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Nantes":               { primary: "#FFD200", secondary: "#009640", text: "#000000" },
  "Montpellier":          { primary: "#003DA5", secondary: "#FF6600", text: "#FFFFFF" },
  "Toulouse":             { primary: "#5B2C86", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Brest":                { primary: "#E30613", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Reims":                { primary: "#DA291C", secondary: "#FFFFFF", text: "#FFFFFF" },

  // ─── NBA ───────────────────────────────────────────────────────────────
  "Los Angeles Lakers":   { primary: "#552583", secondary: "#FDB927", text: "#FFFFFF" },
  "LA Lakers":            { primary: "#552583", secondary: "#FDB927", text: "#FFFFFF" },
  "Golden State Warriors": { primary: "#1D428A", secondary: "#FFC72C", text: "#FFFFFF" },
  "Golden State":         { primary: "#1D428A", secondary: "#FFC72C", text: "#FFFFFF" },
  "Boston Celtics":       { primary: "#007A33", secondary: "#BA9653", text: "#FFFFFF" },
  "Miami Heat":           { primary: "#98002E", secondary: "#F9A01B", text: "#FFFFFF" },
  "Milwaukee Bucks":      { primary: "#00471B", secondary: "#EEE1C6", text: "#FFFFFF" },
  "Philadelphia 76ers":   { primary: "#006BB6", secondary: "#ED174C", text: "#FFFFFF" },
  "Denver Nuggets":       { primary: "#0E2240", secondary: "#FEC524", text: "#FFFFFF" },
  "Phoenix Suns":         { primary: "#1D1160", secondary: "#E56020", text: "#FFFFFF" },
  "Dallas Mavericks":     { primary: "#00538C", secondary: "#002B5E", text: "#FFFFFF" },
  "Cleveland Cavaliers":  { primary: "#860038", secondary: "#041E42", text: "#FFFFFF" },
  "New York Knicks":      { primary: "#006BB6", secondary: "#F58426", text: "#FFFFFF" },
  "Brooklyn Nets":        { primary: "#000000", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Chicago Bulls":        { primary: "#CE1141", secondary: "#000000", text: "#FFFFFF" },
  "Toronto Raptors":      { primary: "#CE1141", secondary: "#000000", text: "#FFFFFF" },
  "Sacramento Kings":     { primary: "#5A2D81", secondary: "#63727A", text: "#FFFFFF" },
  "Indiana Pacers":       { primary: "#002D62", secondary: "#FDBB30", text: "#FFFFFF" },
  "Oklahoma City Thunder": { primary: "#007AC1", secondary: "#EF6100", text: "#FFFFFF" },
  "Minnesota Timberwolves": { primary: "#0C2340", secondary: "#236192", text: "#FFFFFF" },
  "Houston Rockets":      { primary: "#CE1141", secondary: "#000000", text: "#FFFFFF" },
  "San Antonio Spurs":    { primary: "#C4CED4", secondary: "#000000", text: "#000000" },
  "Memphis Grizzlies":    { primary: "#5D76A9", secondary: "#12173F", text: "#FFFFFF" },
  "New Orleans Pelicans":  { primary: "#0C2340", secondary: "#C8102E", text: "#FFFFFF" },
  "Atlanta Hawks":        { primary: "#E03A3E", secondary: "#C1D32F", text: "#FFFFFF" },
  "Charlotte Hornets":    { primary: "#1D1160", secondary: "#00788C", text: "#FFFFFF" },
  "Detroit Pistons":      { primary: "#C8102E", secondary: "#1D42BA", text: "#FFFFFF" },
  "Orlando Magic":        { primary: "#0077C0", secondary: "#C4CED4", text: "#FFFFFF" },
  "Washington Wizards":   { primary: "#002B5C", secondary: "#E31837", text: "#FFFFFF" },
  "Portland Trail Blazers": { primary: "#E03A3E", secondary: "#000000", text: "#FFFFFF" },
  "Utah Jazz":            { primary: "#002B5C", secondary: "#00471B", text: "#FFFFFF" },
  "LA Clippers":          { primary: "#C8102E", secondary: "#1D428A", text: "#FFFFFF" },

  // ─── CHAMPIONS LEAGUE / INTERNATIONAL ──────────────────────────────────
  "Olympiacos":           { primary: "#CC0000", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Benfica":              { primary: "#FF0000", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Porto":                { primary: "#003DA5", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Sporting CP":          { primary: "#009A44", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Ajax":                 { primary: "#D2122E", secondary: "#FFFFFF", text: "#FFFFFF" },
  "PSV":                  { primary: "#ED1C24", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Celtic":               { primary: "#009E49", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Rangers":              { primary: "#0000FF", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Galatasaray":          { primary: "#FF6600", secondary: "#FFC72C", text: "#FFFFFF" },
  "Fenerbahce":           { primary: "#FFED00", secondary: "#00205B", text: "#000000" },
  "Besiktas":             { primary: "#000000", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Shakhtar Donetsk":     { primary: "#FF6600", secondary: "#000000", text: "#FFFFFF" },
  "Dynamo Kyiv":          { primary: "#0057B8", secondary: "#FFFFFF", text: "#FFFFFF" },
  "Red Bull Salzburg":    { primary: "#E30613", secondary: "#003DA5", text: "#FFFFFF" },
  "Club Brugge":          { primary: "#0055A4", secondary: "#000000", text: "#FFFFFF" },
};

/**
 * Get team colors. Returns a default color scheme if team not found.
 */
export function getTeamColors(teamName: string): TeamColor {
  // Direct lookup
  if (TEAM_COLORS[teamName]) return TEAM_COLORS[teamName];

  // Try partial match
  const lower = teamName.toLowerCase();
  for (const [key, colors] of Object.entries(TEAM_COLORS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return colors;
    }
  }

  // Generate a deterministic color from team name hash
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    primary: `hsl(${hue}, 65%, 45%)`,
    secondary: `hsl(${(hue + 180) % 360}, 50%, 50%)`,
    text: "#FFFFFF",
  };
}

/**
 * Get a short team abbreviation (3 letters).
 */
export function getTeamAbbr(name: string): string {
  const ABBRS: Record<string, string> = {
    "Manchester United": "MUN", "Man Utd": "MUN", "Manchester City": "MCI", "Man City": "MCI",
    "Arsenal": "ARS", "Liverpool": "LIV", "Chelsea": "CHE", "Tottenham": "TOT",
    "Tottenham Hotspur": "TOT", "Newcastle United": "NEW", "Newcastle": "NEW",
    "Aston Villa": "AVL", "West Ham": "WHU", "West Ham United": "WHU",
    "Brighton": "BHA", "Brighton and Hove Albion": "BHA", "Crystal Palace": "CRY",
    "Everton": "EVE", "Fulham": "FUL", "Bournemouth": "BOU", "AFC Bournemouth": "BOU",
    "Brentford": "BRE", "Burnley": "BUR", "Wolverhampton Wanderers": "WOL", "Wolves": "WOL",
    "Nottingham Forest": "NFO", "Sheffield United": "SHU", "Luton Town": "LUT",
    "Real Madrid": "RMA", "Barcelona": "BAR", "Atletico Madrid": "ATM", "Atl. Madrid": "ATM",
    "Sevilla": "SEV", "Real Sociedad": "RSO", "Real Betis": "BET", "Villarreal": "VIL",
    "Bayern Munich": "BAY", "Borussia Dortmund": "BVB", "Dortmund": "BVB",
    "RB Leipzig": "RBL", "Bayer Leverkusen": "LEV", "Leverkusen": "LEV",
    "Juventus": "JUV", "AC Milan": "MIL", "Inter Milan": "INT", "Napoli": "NAP",
    "AS Roma": "ROM", "Roma": "ROM", "Lazio": "LAZ", "Atalanta": "ATA",
    "PSG": "PSG", "Paris Saint-Germain": "PSG", "Marseille": "MAR", "Lyon": "LYO",
    "Monaco": "MON", "Lille": "LIL",
    "Los Angeles Lakers": "LAL", "LA Lakers": "LAL", "Golden State Warriors": "GSW",
    "Golden State": "GSW", "Boston Celtics": "BOS", "Miami Heat": "MIA",
    "LA Clippers": "LAC", "Chicago Bulls": "CHI", "Brooklyn Nets": "BKN",
  };

  if (ABBRS[name]) return ABBRS[name];

  // Generate from name
  const words = name.split(/\s+/);
  if (words.length >= 3) return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  if (words.length === 2) return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
  return name.substring(0, 3).toUpperCase();
}
