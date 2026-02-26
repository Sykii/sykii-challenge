// lib/riot.ts — Funciones para consultar la Riot API

const REGION = process.env.RIOT_REGION || 'euw1';
const ROUTING = getRoutingValue(REGION);

function getRoutingValue(region: string): string {
  const map: Record<string, string> = {
    euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe',
    na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas',
    kr: 'asia', jp1: 'asia',
    oc1: 'sea', sg2: 'sea', th2: 'sea',
  };
  return map[region] || 'europe';
}

function getApiKey(): string {
  const key = process.env.RIOT_API_KEY;
  if (!key) throw new Error('RIOT_API_KEY no configurada');
  return key;
}

export interface SummonerData {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface RankedData {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface PlayerStats {
  summonerName: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  totalLP: number; // LP absolutos para comparar (Challenger=2400+LP, GM=2000+LP, etc.)
  wins: number;
  losses: number;
  winrate: number;
  games: number;
  profileIconId?: number;
}

const TIER_BASE: Record<string, number> = {
  CHALLENGER: 10000,
  GRANDMASTER: 8000,
  MASTER: 6000,
  DIAMOND: 4000,
  EMERALD: 3600,
  PLATINUM: 3200,
  GOLD: 2800,
  SILVER: 2400,
  BRONZE: 2000,
  IRON: 1600,
  UNRANKED: 0,
};

const RANK_BASE: Record<string, number> = {
  I: 300, II: 200, III: 100, IV: 0,
};

export function calculateTotalLP(tier: string, rank: string, lp: number): number {
  const tierBase = TIER_BASE[tier.toUpperCase()] || 0;
  const rankBase = RANK_BASE[rank] || 0;
  // Para Master+ no hay subdivisiones
  if (['CHALLENGER', 'GRANDMASTER', 'MASTER'].includes(tier.toUpperCase())) {
    return tierBase + lp;
  }
  return tierBase + rankBase + lp;
}

export async function getSummoner(summonerName: string): Promise<SummonerData> {
  const apiKey = getApiKey();
  const encoded = encodeURIComponent(summonerName);
  const res = await fetch(
    `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encoded}`,
    { headers: { 'X-Riot-Token': apiKey }, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`Error obteniendo summoner ${summonerName}: ${res.status}`);
  return res.json();
}

export async function getRankedData(summonerId: string): Promise<RankedData | null> {
  const apiKey = getApiKey();
  const res = await fetch(
    `https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
    { headers: { 'X-Riot-Token': apiKey }, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`Error obteniendo ranked data: ${res.status}`);
  const data: RankedData[] = await res.json();
  return data.find(e => e.queueType === 'RANKED_SOLO_5x5') || null;
}

export async function getPlayerStats(summonerName: string): Promise<PlayerStats> {
  try {
    const summoner = await getSummoner(summonerName);
    const ranked = await getRankedData(summoner.id);

    if (!ranked) {
      return {
        summonerName,
        tier: 'UNRANKED', rank: '', leaguePoints: 0,
        totalLP: 0, wins: 0, losses: 0, winrate: 0, games: 0,
        profileIconId: summoner.profileIconId,
      };
    }

    const games = ranked.wins + ranked.losses;
    const winrate = games > 0 ? Math.round((ranked.wins / games) * 100) : 0;
    const totalLP = calculateTotalLP(ranked.tier, ranked.rank, ranked.leaguePoints);

    return {
      summonerName,
      tier: ranked.tier,
      rank: ranked.rank,
      leaguePoints: ranked.leaguePoints,
      totalLP,
      wins: ranked.wins,
      losses: ranked.losses,
      winrate,
      games,
      profileIconId: summoner.profileIconId,
    };
  } catch (e) {
    console.error(`Error con ${summonerName}:`, e);
    return {
      summonerName, tier: 'ERROR', rank: '', leaguePoints: 0,
      totalLP: 0, wins: 0, losses: 0, winrate: 0, games: 0,
    };
  }
}
