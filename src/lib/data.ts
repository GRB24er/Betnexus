export interface Match {
  id: string;
  league: string;
  leagueIcon?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  time: string;
  isLive: boolean;
  minute?: number;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  markets?: number;
  sport: string;
}

export interface VirtualGame {
  id: string;
  name: string;
  category: string;
  image: string;
  nextRace?: string;
  players?: number;
  gradient: string;
}

export interface CasinoGame {
  id: string;
  name: string;
  provider: string;
  category: string;
  image: string;
  isHot?: boolean;
  isNew?: boolean;
  rtp?: number;
  gradient: string;
}

export interface BetItem {
  id: string;
  matchId: string;
  match: string;
  selection: string;
  odds: number;
  market: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  badge: string;
  gradient: string;
  cta: string;
}

export const sportsCategories = [
  { id: "football", name: "Football", icon: "⚽", count: 234 },
  { id: "basketball", name: "Basketball", icon: "🏀", count: 89 },
  { id: "tennis", name: "Tennis", icon: "🎾", count: 156 },
  { id: "cricket", name: "Cricket", icon: "🏏", count: 45 },
  { id: "baseball", name: "Baseball", icon: "⚾", count: 67 },
  { id: "ice-hockey", name: "Ice Hockey", icon: "🏒", count: 43 },
  { id: "mma", name: "MMA", icon: "🥊", count: 28 },
  { id: "rugby", name: "Rugby", icon: "🏉", count: 34 },
  { id: "volleyball", name: "Volleyball", icon: "🏐", count: 52 },
  { id: "handball", name: "Handball", icon: "🤾", count: 31 },
  { id: "esports", name: "Esports", icon: "🎮", count: 76 },
  { id: "table-tennis", name: "Table Tennis", icon: "🏓", count: 48 },
];

export const featuredMatches: Match[] = [
  {
    id: "1",
    league: "UEFA Champions League",
    homeTeam: "Real Madrid",
    awayTeam: "Man City",
    homeScore: 2,
    awayScore: 1,
    time: "67'",
    isLive: true,
    minute: 67,
    odds: { home: 1.85, draw: 3.60, away: 4.20 },
    markets: 245,
    sport: "football",
  },
  {
    id: "2",
    league: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    homeScore: 1,
    awayScore: 1,
    time: "34'",
    isLive: true,
    minute: 34,
    odds: { home: 2.10, draw: 3.40, away: 3.50 },
    markets: 198,
    sport: "football",
  },
  {
    id: "3",
    league: "La Liga",
    homeTeam: "Barcelona",
    awayTeam: "Atl. Madrid",
    time: "Today, 20:00",
    isLive: false,
    odds: { home: 1.65, draw: 3.90, away: 5.50 },
    markets: 312,
    sport: "football",
  },
  {
    id: "4",
    league: "Serie A",
    homeTeam: "AC Milan",
    awayTeam: "Inter Milan",
    time: "Today, 21:45",
    isLive: false,
    odds: { home: 2.80, draw: 3.20, away: 2.60 },
    markets: 276,
    sport: "football",
  },
  {
    id: "5",
    league: "NBA",
    homeTeam: "LA Lakers",
    awayTeam: "Golden State",
    homeScore: 89,
    awayScore: 94,
    time: "Q3 4:22",
    isLive: true,
    odds: { home: 2.30, draw: 0, away: 1.65 },
    markets: 156,
    sport: "basketball",
  },
  {
    id: "6",
    league: "Bundesliga",
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    time: "Tomorrow, 18:30",
    isLive: false,
    odds: { home: 1.45, draw: 4.50, away: 7.00 },
    markets: 289,
    sport: "football",
  },
];

export const liveMatches: Match[] = [
  {
    id: "live-1",
    league: "UEFA Champions League",
    homeTeam: "Real Madrid",
    awayTeam: "Man City",
    homeScore: 2,
    awayScore: 1,
    time: "67'",
    isLive: true,
    minute: 67,
    odds: { home: 1.85, draw: 3.60, away: 4.20 },
    markets: 245,
    sport: "football",
  },
  {
    id: "live-2",
    league: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    homeScore: 1,
    awayScore: 1,
    time: "34'",
    isLive: true,
    minute: 34,
    odds: { home: 2.10, draw: 3.40, away: 3.50 },
    markets: 198,
    sport: "football",
  },
  {
    id: "live-3",
    league: "NBA",
    homeTeam: "LA Lakers",
    awayTeam: "Golden State",
    homeScore: 89,
    awayScore: 94,
    time: "Q3 4:22",
    isLive: true,
    odds: { home: 2.30, draw: 0, away: 1.65 },
    markets: 156,
    sport: "basketball",
  },
  {
    id: "live-4",
    league: "ATP Masters",
    homeTeam: "Djokovic",
    awayTeam: "Alcaraz",
    homeScore: 1,
    awayScore: 0,
    time: "Set 2",
    isLive: true,
    odds: { home: 1.72, draw: 0, away: 2.15 },
    markets: 78,
    sport: "tennis",
  },
  {
    id: "live-5",
    league: "Serie A",
    homeTeam: "Juventus",
    awayTeam: "Napoli",
    homeScore: 0,
    awayScore: 2,
    time: "55'",
    isLive: true,
    minute: 55,
    odds: { home: 5.50, draw: 4.00, away: 1.45 },
    markets: 187,
    sport: "football",
  },
  {
    id: "live-6",
    league: "EuroLeague",
    homeTeam: "Olympiacos",
    awayTeam: "Barcelona",
    homeScore: 45,
    awayScore: 52,
    time: "Q3 8:10",
    isLive: true,
    odds: { home: 2.80, draw: 0, away: 1.40 },
    markets: 64,
    sport: "basketball",
  },
  {
    id: "live-7",
    league: "Ligue 1",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    homeScore: 3,
    awayScore: 0,
    time: "72'",
    isLive: true,
    minute: 72,
    odds: { home: 1.05, draw: 12.00, away: 28.00 },
    markets: 165,
    sport: "football",
  },
  {
    id: "live-8",
    league: "NHL",
    homeTeam: "Toronto",
    awayTeam: "Montreal",
    homeScore: 2,
    awayScore: 3,
    time: "P2 12:44",
    isLive: true,
    odds: { home: 2.40, draw: 0, away: 1.55 },
    markets: 89,
    sport: "ice-hockey",
  },
];

export const upcomingMatches: Match[] = [
  {
    id: "up-1",
    league: "La Liga",
    homeTeam: "Barcelona",
    awayTeam: "Atl. Madrid",
    time: "Today, 20:00",
    isLive: false,
    odds: { home: 1.65, draw: 3.90, away: 5.50 },
    markets: 312,
    sport: "football",
  },
  {
    id: "up-2",
    league: "Serie A",
    homeTeam: "AC Milan",
    awayTeam: "Inter Milan",
    time: "Today, 21:45",
    isLive: false,
    odds: { home: 2.80, draw: 3.20, away: 2.60 },
    markets: 276,
    sport: "football",
  },
  {
    id: "up-3",
    league: "Bundesliga",
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    time: "Tomorrow, 18:30",
    isLive: false,
    odds: { home: 1.45, draw: 4.50, away: 7.00 },
    markets: 289,
    sport: "football",
  },
  {
    id: "up-4",
    league: "Premier League",
    homeTeam: "Chelsea",
    awayTeam: "Tottenham",
    time: "Tomorrow, 15:00",
    isLive: false,
    odds: { home: 2.20, draw: 3.30, away: 3.40 },
    markets: 256,
    sport: "football",
  },
  {
    id: "up-5",
    league: "NBA",
    homeTeam: "Boston Celtics",
    awayTeam: "Miami Heat",
    time: "Today, 23:30",
    isLive: false,
    odds: { home: 1.55, draw: 0, away: 2.50 },
    markets: 134,
    sport: "basketball",
  },
  {
    id: "up-6",
    league: "WTA Finals",
    homeTeam: "Swiatek",
    awayTeam: "Sabalenka",
    time: "Tomorrow, 14:00",
    isLive: false,
    odds: { home: 1.90, draw: 0, away: 1.90 },
    markets: 56,
    sport: "tennis",
  },
];

export const virtualGames: VirtualGame[] = [
  { id: "v1", name: "Virtual Football", category: "Sports", image: "⚽", nextRace: "Starting in 2:34", players: 1243, gradient: "from-green-600 to-emerald-800" },
  { id: "v2", name: "Virtual Horse Racing", category: "Racing", image: "🏇", nextRace: "Starting in 1:12", players: 876, gradient: "from-amber-600 to-orange-800" },
  { id: "v3", name: "Virtual Basketball", category: "Sports", image: "🏀", nextRace: "Starting in 3:45", players: 654, gradient: "from-orange-500 to-red-700" },
  { id: "v4", name: "Virtual Dog Racing", category: "Racing", image: "🐕", nextRace: "Starting in 0:45", players: 1087, gradient: "from-blue-600 to-indigo-800" },
  { id: "v5", name: "Virtual Tennis", category: "Sports", image: "🎾", nextRace: "Starting in 4:20", players: 432, gradient: "from-lime-500 to-green-700" },
  { id: "v6", name: "Virtual Motor Racing", category: "Racing", image: "🏎️", nextRace: "Starting in 2:00", players: 765, gradient: "from-red-600 to-rose-800" },
  { id: "v7", name: "Virtual Cricket", category: "Sports", image: "🏏", nextRace: "Starting in 5:10", players: 543, gradient: "from-cyan-500 to-blue-700" },
  { id: "v8", name: "Virtual Cycling", category: "Racing", image: "🚴", nextRace: "Starting in 1:30", players: 321, gradient: "from-purple-500 to-violet-700" },
  { id: "v9", name: "Penalty Shootout", category: "Instant", image: "🥅", nextRace: "Play Now", players: 2100, gradient: "from-emerald-500 to-teal-700" },
  { id: "v10", name: "Virtual Boxing", category: "Sports", image: "🥊", nextRace: "Starting in 3:00", players: 890, gradient: "from-rose-500 to-pink-700" },
  { id: "v11", name: "Lucky Numbers", category: "Instant", image: "🔢", nextRace: "Play Now", players: 3200, gradient: "from-yellow-500 to-amber-700" },
  { id: "v12", name: "Virtual Speedway", category: "Racing", image: "🏍️", nextRace: "Starting in 0:30", players: 456, gradient: "from-slate-500 to-gray-700" },
];

export const casinoGames: CasinoGame[] = [
  { id: "c1", name: "Mega Jackpot Slots", provider: "NetEnt", category: "Slots", image: "🎰", isHot: true, rtp: 96.5, gradient: "from-yellow-500 to-orange-600" },
  { id: "c2", name: "Live Blackjack", provider: "Evolution", category: "Live Casino", image: "🃏", isNew: false, rtp: 99.5, gradient: "from-emerald-600 to-green-800" },
  { id: "c3", name: "European Roulette", provider: "Playtech", category: "Table Games", image: "🎡", rtp: 97.3, gradient: "from-red-600 to-rose-800" },
  { id: "c4", name: "Aviator", provider: "Spribe", category: "Crash Games", image: "✈️", isHot: true, rtp: 97.0, gradient: "from-sky-500 to-blue-700" },
  { id: "c5", name: "Baccarat Supreme", provider: "Evolution", category: "Live Casino", image: "🎴", rtp: 98.9, gradient: "from-purple-600 to-indigo-800" },
  { id: "c6", name: "Dragon Tiger", provider: "Pragmatic", category: "Live Casino", image: "🐉", isNew: true, rtp: 96.3, gradient: "from-orange-500 to-red-700" },
  { id: "c7", name: "Mines", provider: "Spribe", category: "Crash Games", image: "💎", isHot: true, rtp: 97.0, gradient: "from-cyan-500 to-teal-700" },
  { id: "c8", name: "Sweet Bonanza", provider: "Pragmatic", category: "Slots", image: "🍭", rtp: 96.5, gradient: "from-pink-500 to-rose-600" },
  { id: "c9", name: "Dice", provider: "Spribe", category: "Crash Games", image: "🎲", rtp: 98.0, gradient: "from-indigo-500 to-violet-700" },
  { id: "c10", name: "Poker Texas Hold'em", provider: "Evolution", category: "Table Games", image: "♠️", rtp: 99.2, gradient: "from-green-600 to-emerald-800" },
  { id: "c11", name: "Lightning Roulette", provider: "Evolution", category: "Live Casino", image: "⚡", isNew: true, rtp: 97.3, gradient: "from-amber-400 to-yellow-600" },
  { id: "c12", name: "Plinko", provider: "Spribe", category: "Crash Games", image: "📍", isHot: true, rtp: 97.0, gradient: "from-violet-500 to-purple-700" },
];

export const promotions: Promotion[] = [
  {
    id: "p1",
    title: "Welcome Bonus - 100% Up To $500",
    description: "Double your first deposit and start winning big! T&Cs apply.",
    badge: "NEW",
    gradient: "from-green-500 to-emerald-700",
    cta: "Claim Now",
  },
  {
    id: "p2",
    title: "Acca Boost - Up To 60% Extra",
    description: "Build an accumulator with 4+ selections and boost your winnings!",
    badge: "HOT",
    gradient: "from-orange-500 to-red-600",
    cta: "Learn More",
  },
  {
    id: "p3",
    title: "Champions League Special",
    description: "Get enhanced odds on all Champions League matches this week!",
    badge: "LIMITED",
    gradient: "from-blue-500 to-indigo-700",
    cta: "Bet Now",
  },
  {
    id: "p4",
    title: "Free Spins Friday",
    description: "Get 50 free spins every Friday on selected slot games!",
    badge: "WEEKLY",
    gradient: "from-purple-500 to-pink-600",
    cta: "Get Spins",
  },
];
