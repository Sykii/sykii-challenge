'use client';
// components/RankingTable.tsx
import { useEffect, useState, useCallback } from 'react';
import type { ParticipantRanking } from '@/app/api/rankings/route';

const ROLE_ICONS: Record<string, string> = {
  top: '🗡️', jungle: '🌿', mid: '⚡', adc: '🏹', support: '🛡️', fill: '♾️',
};

const TIER_ICONS: Record<string, string> = {
  CHALLENGER: '🏆', GRANDMASTER: '💎', MASTER: '⚜️',
  DIAMOND: '💠', EMERALD: '🟢', PLATINUM: '🔷',
  GOLD: '🟡', SILVER: '⚪', BRONZE: '🟤', IRON: '⬛', UNRANKED: '❓',
};

function getTierClass(tier: string): string {
  const t = tier.toUpperCase();
  if (t === 'CHALLENGER') return 'tier-challenger';
  if (t === 'GRANDMASTER') return 'tier-grandmaster';
  if (t === 'MASTER') return 'tier-master';
  if (t === 'DIAMOND') return 'tier-diamond';
  if (t === 'EMERALD') return 'tier-emerald';
  if (t === 'PLATINUM') return 'tier-platinum';
  return 'tier-other';
}

function getWinrateClass(wr: number): string {
  if (wr >= 60) return 'wr-high';
  if (wr >= 50) return 'wr-mid';
  return 'wr-low';
}

function getOpggUrl(summonerName: string, region = 'euw'): string {
  return `https://${region}.op.gg/summoners/${region}/${encodeURIComponent(summonerName)}`;
}

export default function RankingTable() {
  const [data, setData] = useState<ParticipantRanking[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infiltradoStats, setInfiltradoStats] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [rankRes, myStatsRes] = await Promise.all([
        fetch('/api/rankings'),
        fetch('/api/my-stats'),
      ]);
      const rankJson = await rankRes.json();
      const myStats = await myStatsRes.json();

      if (rankJson.success) {
        setData(rankJson.data);
        setUpdatedAt(rankJson.updatedAt);
      }
      setInfiltradoStats(myStats);
    } catch (e) {
      setError('Error conectando con la API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // refresh cada 5 min
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="header-top">
          <div className="title-group">
            <h1 className="main-title">// SOLOQ_CHALLENGE</h1>
            <span className="subtitle">LAN_EUW · RANKED_SOLO</span>
          </div>
          <div className="status-badge">⚠ INFILTRADO ACTIVO</div>
        </div>
        {updatedAt && (
          <div className="last-update">
            ÚLTIMA SYNC: {new Date(updatedAt).toLocaleTimeString('es-ES')}
            {' · '}AUTO-REFRESH: 5min
          </div>
        )}
      </div>

      {/* Infiltrado quick stats */}
      {infiltradoStats && (
        <div className="infiltrado-stats" style={{ marginBottom: 20 }}>
          <div className="infiltrado-stats-title">▶ STATUS INFILTRADO</div>
          <div className="infiltrado-stats-row">
            <span>POSICIÓN ACTUAL</span>
            <span className="infiltrado-stats-val">{infiltradoStats.display || '?'}</span>
          </div>
          <div className="infiltrado-stats-row">
            <span>LPs PARA SUBIR</span>
            <span className="infiltrado-stats-val">
              {infiltradoStats.diff_next > 0
                ? `${infiltradoStats.diff_next} LP → ${infiltradoStats.next_player}`
                : '🏆 LÍDER'}
            </span>
          </div>
          <div className="infiltrado-stats-row">
            <span>MODO</span>
            <span className="infiltrado-stats-val">{infiltradoStats.infiltrado_status}</span>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-green)', padding: 40, textAlign: 'center' }}>
          {'> CONSULTANDO RIOT API..._'}
          <br /><br />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Obteniendo datos de {new Array(20).fill('▓').join('')}
          </span>
        </div>
      ) : error ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-red)', padding: 40, textAlign: 'center' }}>
          ⚠ {error}
        </div>
      ) : (
        <div className="ranking-table-wrapper">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>STREAMER</th>
                <th>ROL</th>
                <th>CUENTA</th>
                <th>ELO</th>
                <th>PARTIDAS</th>
                <th>G / P</th>
                <th>WINRATE</th>
                <th>STATS</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr
                  key={p.streamer}
                  className={p.isInfiltrado ? 'row-infiltrado' : ''}
                >
                  {/* Posición */}
                  <td>
                    <div className={`pos-number ${p.position <= 3 ? 'top3' : ''} ${p.isInfiltrado ? 'pos-infiltrado' : ''}`}>
                      {p.position <= 3 ? ['🥇','🥈','🥉'][p.position - 1] : p.position}
                    </div>
                  </td>

                  {/* Streamer */}
                  <td>
                    <div className="streamer-cell">
                      <div className={`streamer-avatar ${p.isInfiltrado ? 'streamer-avatar-infiltrado' : ''}`}>
                        {p.stats.profileIconId ? (
                          <img
                            src={`https://ddragon.leagueoflegends.com/cdn/14.14.1/img/profileicon/${p.stats.profileIconId}.png`}
                            alt={p.streamer}
                          />
                        ) : (
                          p.streamer.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className={`streamer-name ${p.isInfiltrado ? 'streamer-name-infiltrado' : ''}`}>
                        {p.isInfiltrado ? '👾 ' : ''}{p.streamer}
                      </span>
                    </div>
                  </td>

                  {/* Rol */}
                  <td>
                    <div className="role-icon">
                      {ROLE_ICONS[p.role] || '❓'}
                    </div>
                  </td>

                  {/* Cuenta */}
                  <td>
                    <span className="account-name">{p.summonerName}</span>
                  </td>

                  {/* Elo */}
                  <td>
                    <div className="elo-cell">
                      <span className="tier-icon">
                        {TIER_ICONS[p.stats.tier] || '❓'}
                      </span>
                      <span className={`tier-text ${getTierClass(p.stats.tier)}`}>
                        {p.stats.tier.charAt(0) + p.stats.tier.slice(1).toLowerCase()}
                        {p.stats.rank && !['CHALLENGER','GRANDMASTER','MASTER'].includes(p.stats.tier)
                          ? ` ${p.stats.rank}` : ''}
                      </span>
                      <span className="lp-text">
                        ({p.stats.leaguePoints} LP)
                      </span>
                    </div>
                  </td>

                  {/* Partidas */}
                  <td><span className="stat-games">{p.stats.games}</span></td>

                  {/* G / P */}
                  <td>
                    <div className="gp-cell">
                      <span className="stat-wins">{p.stats.wins}</span>
                      <span style={{ color: 'var(--text-muted)' }}>/</span>
                      <span className="stat-losses">{p.stats.losses}</span>
                    </div>
                  </td>

                  {/* Winrate */}
                  <td>
                    <span className={`winrate-text ${getWinrateClass(p.stats.winrate)}`}>
                      {p.stats.winrate}%
                    </span>
                  </td>

                  {/* OP.GG */}
                  <td>
                    <a
                      href={getOpggUrl(p.summonerName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opgg-link"
                    >
                      OP.GG ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
