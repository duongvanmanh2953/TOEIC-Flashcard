import React, { memo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Crown, Trophy } from 'lucide-react';
import type { ChampionshipPlayer, ChampionshipResult } from '../../index';
import { VocabFlowLogo } from '../VocabFlowLogo';
import { PlayerAvatar } from './PlayerAvatar';

const number = new Intl.NumberFormat('vi-VN');
const EMPTY: ChampionshipPlayer[] = [];
const PAGE_SIZE = 10;

const RankingRow = memo(function RankingRow({ player, current, live }: {
  player: ChampionshipPlayer;
  current: boolean;
  live: boolean;
}) {
  const accuracy = player.answeredCount && player.correctCount !== undefined
    ? `${Math.round(100 * player.correctCount / player.answeredCount)}%`
    : '–';

  return (
    <tr data-medal={player.rank <= 3 ? player.rank : undefined} data-current={current}>
      <td>{player.rank}</td>
      <th scope="row">
        <div className="hof-player">
          <PlayerAvatar avatarUrl={player.avatar} displayName={player.displayName} size="xs" />
          <span title={player.username ? `${player.displayName} · @${player.username}` : player.displayName}>
            {player.displayName}{current && <small> · Bạn</small>}
            {live && player.username && <small className="hof-handle">@{player.username}</small>}
          </span>
        </div>
      </th>
      <td>{number.format(player.score)}</td>
      <td>{player.correctCount ?? '–'}</td>
      <td>{live ? player.speedPlacements ?? '–' : accuracy}</td>
    </tr>
  );
});

function Ranking({ players, currentUserId, live = false }: {
  players: ChampionshipPlayer[];
  currentUserId?: string;
  live?: boolean;
}) {
  const [page, setPage] = useState(0);
  const scrollRegion = useRef<HTMLDivElement>(null);
  const pageCount = Math.ceil(players.length / PAGE_SIZE);
  const visiblePage = Math.min(page, Math.max(0, pageCount - 1));
  const title = live ? 'TikTok Live Champions' : 'Arena Battle';
  const headingId = live ? 'hof-live-heading' : 'hof-arena-heading';

  const changePage = (nextPage: number) => {
    if (scrollRegion.current) scrollRegion.current.scrollTop = 0;
    setPage(nextPage);
  };

  return (
    <section className="hof-ranking" aria-labelledby={headingId}>
      <header>
        <h2 id={headingId}>{title}</h2>
        {pageCount > 1 && (
          <nav aria-label={`Trang xếp hạng ${title}`}>
            <button type="button" aria-label="Trang trước" disabled={!visiblePage}
              onClick={() => changePage(visiblePage - 1)}><ArrowLeft size={16} /></button>
            <span aria-live="polite">{visiblePage + 1}/{pageCount}</span>
            <button type="button" aria-label="Trang sau" disabled={visiblePage + 1 >= pageCount}
              onClick={() => changePage(visiblePage + 1)}><ArrowRight size={16} /></button>
          </nav>
        )}
      </header>
      {players.length ? (
        <div ref={scrollRegion} className="hof-table-scroll" tabIndex={0} role="region" aria-labelledby={headingId}>
          <table aria-labelledby={headingId}>
            <thead>
              <tr><th scope="col">Hạng</th><th scope="col">{live ? 'TikTok' : 'Người chơi'}</th>
                <th scope="col">Điểm</th><th scope="col">Đúng</th>
                <th scope="col">{live ? 'Top 3' : 'Chính xác'}</th></tr>
            </thead>
            <tbody>
              {players.slice(visiblePage * PAGE_SIZE, (visiblePage + 1) * PAGE_SIZE).map((player) => (
                <RankingRow key={player.userId} player={player} live={live} current={player.userId === currentUserId} />
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="hof-empty">{live ? 'Chưa có kết quả TikTok Live.' : 'Chưa có kết quả Arena Battle.'}</p>}
    </section>
  );
}

function Podium({ players, live }: { players: ChampionshipPlayer[]; live: boolean }) {
  return (
    <section className="hof-stage" aria-label={live ? 'Bục vinh danh TikTok Live' : 'Bục vinh danh Arena Battle'}>
      <ol className="hof-podium">
        {players.slice(0, 3).map((player) => (
          <li key={player.userId} data-medal={player.rank}>
            <span className="hof-placement">
              {player.rank === 1 ? <><Crown size={16} aria-hidden="true" /> {live ? 'TikTok Live Champion' : 'Arena Champion'} · 01</> : `#0${player.rank}`}
            </span>
            <PlayerAvatar avatarUrl={player.avatar} displayName={player.displayName}
              size={player.rank === 1 ? 'xl' : 'lg'} className="hof-portrait" />
            <strong className="hof-name" title={player.displayName}>{player.displayName}</strong>
            <span className="hof-score">{number.format(player.score)} <small>điểm</small></span>
            {player.rank === 1 && <span className="hof-particles" aria-hidden="true"><i /><i /><i /><i /></span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

interface HallOfFameProps {
  result: ChampionshipResult | null;
  roomCode: string;
  matchName: string;
  live?: boolean;
  currentUserId?: string;
  error?: string;
  onLeave: () => void;
  onPlayAgain: () => void;
  onNextMatch?: () => void;
}

export function HallOfFame({
  result, roomCode, matchName, live = false, currentUserId, error, onLeave, onPlayAgain, onNextMatch,
}: HallOfFameProps) {
  const arena = result?.inAppRanking ?? result?.ranking ?? EMPTY;
  const tiktok = result?.commenterRanking ?? EMPTY;
  const featured = live ? tiktok : arena;
  const winner = featured[0];
  const players = [...arena, ...tiktok];
  const totalCorrect = players.length > 0 && players.every((player) => player.correctCount !== undefined)
    ? players.reduce((total, player) => total + (player.correctCount ?? 0), 0)
    : undefined;
  const seconds = result?.durationMs === undefined ? undefined : Math.floor(result.durationMs / 1000);
  const stats = result ? [
    { label: 'Người chơi', value: result.totalParticipants },
    { label: 'Câu hỏi', value: result.playedRounds },
    { label: 'Thời lượng', value: seconds === undefined ? undefined : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` },
    { label: 'Đáp án đúng', value: totalCorrect },
    { label: 'Điểm vô địch', value: winner ? number.format(winner.score) : undefined },
  ].filter(({ value }) => value !== undefined) : [];

  return (
    <main className="hof" aria-labelledby="hof-title">
      <div className="hof-inner">
        <header className="hof-header">
          <div className="hof-brand"><VocabFlowLogo size="sm" alt="" /><span>VocabFlow <b>Hall of Fame</b></span></div>
          <div className="hof-match"><span>{matchName}</span><small title={roomCode}>#{roomCode}</small></div>
          <p className="hof-status"><Check size={14} aria-hidden="true" /> Match completed</p>
        </header>
        <div className="hof-title">
          <p>Bảng vinh danh nhà vô địch</p>
          <h1 id="hof-title">The <em>Champions</em></h1>
        </div>
        {result ? (
          <>
            {winner ? <Podium players={featured} live={live} /> : (
              <p className="hof-empty hof-no-podium"><Trophy size={24} aria-hidden="true" /> Chưa có người chơi được xếp hạng.</p>
            )}
            <div className="hof-rankings">
              <Ranking players={arena} currentUserId={currentUserId} />
              <Ranking players={tiktok} live />
            </div>
            {stats.length > 0 && (
              <dl className="hof-stats" aria-label="Thống kê trận đấu">
                {stats.map(({ label, value }) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            )}
          </>
        ) : error ? (
          <p className="hof-empty" role="alert">{error}</p>
        ) : <p className="hof-empty" role="status">Đang tải kết quả chính thức…</p>}
        <footer className="hof-actions">
          <button type="button" onClick={onLeave}>Về sảnh</button>
          <button type="button" onClick={onNextMatch ?? onPlayAgain}>{onNextMatch ? 'Trận kế tiếp' : 'Tạo trận mới'}</button>
        </footer>
      </div>
    </main>
  );
}
