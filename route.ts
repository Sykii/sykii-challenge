// app/api/my-stats/route.ts
// 🔌 PUENTE PARA OVERLAY — Lee este endpoint desde OBS/StreamElements
// URL: http://localhost:3000/api/my-stats
// Devuelve JSON simple con los datos del infiltrado

import { NextResponse } from 'next/server';
import { OFFICIAL_PARTICIPANTS, INFILTRADO } from '@/lib/participants';
import { getPlayerStats } from '@/lib/riot';

export const revalidate = 300; // cache 5 min

export async function GET() {
  try {
    const allParticipants = [...OFFICIAL_PARTICIPANTS, INFILTRADO];
    const statsPromises = allParticipants.map(p => getPlayerStats(p.summonerName));
    const allStats = await Promise.all(statsPromises);

    const combined = allParticipants.map((p, i) => ({
      isInfiltrado: p === INFILTRADO,
      stats: allStats[i],
    }));

    // Ordenar por LP
    combined.sort((a, b) => b.stats.totalLP - a.stats.totalLP);

    const infiltradoIdx = combined.findIndex(p => p.isInfiltrado);
    const infiltrado = combined[infiltradoIdx];
    const position = infiltradoIdx + 1;
    const totalPlayers = combined.length;

    // El jugador justo encima (si existe)
    let diff_next = 0;
    let next_player = null;
    if (infiltradoIdx > 0) {
      const above = combined[infiltradoIdx - 1];
      diff_next = above.stats.totalLP - infiltrado.stats.totalLP;
      next_player = above.stats.summonerName;
    }

    const response = {
      // Datos principales para el overlay
      position,                                    // ej: 14
      total_players: totalPlayers,                 // ej: 12
      display: `TOP ${position}`,                  // ej: "TOP 14"
      diff_next,                                   // LPs que faltan para subir
      next_player,                                 // Nombre del jugador encima
      infiltrado_status: position <= 5
        ? '⚠️ INFILTRACIÓN DETECTADA'
        : '👾 SISTEMA INFILTRADO',

      // Stats del infiltrado
      infiltrado: {
        summoner_name: infiltrado.stats.summonerName,
        tier: infiltrado.stats.tier,
        rank: infiltrado.stats.rank,
        lp: infiltrado.stats.leaguePoints,
        wins: infiltrado.stats.wins,
        losses: infiltrado.stats.losses,
        winrate: infiltrado.stats.winrate,
        games: infiltrado.stats.games,
      },

      updated_at: new Date().toISOString(),
    };

    // Headers CORS para que el overlay pueda leerlo desde cualquier fuente
    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching stats', position: '?', display: 'TOP ?' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
