import React, { useEffect, useRef, useState } from 'react';
import { Crown, LogOut, Medal, Square, Trophy, Volume2, Clock, Activity } from 'lucide-react';
import { PlayerAvatar } from '@vocabflow/shared';
import { ArenaHeaderFrame, EnergyDivider, LeaderboardFrame } from './AstralFrames';
import './arena-stage.css';
import './astral-arena.css';

export const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function formatUptime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) {
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h < 10 ? '0' : ''}${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`;
}

export interface ArenaQuestion {
  id: string;
  prompt: string;
  options?: string[];
  targetWord?: string;
  audioUrl?: string;
  category?: string;
  difficulty?: number | string;
}

export interface ArenaPlayer {
  userId: string;
  displayName: string;
  score: number;
  avatar?: string;
  rank?: number;
  isCurrentUser?: boolean;
}

export function choiceText(value: string) {
  return value.replace(/^[ABCD][.)\:]\s*/i, '');
}

export function ArenaHeader({
  live,
  round,
  total,
  uptimeSec,
  latencyMs,
  onExit,
  onEnd,
}: {
  live?: boolean;
  round: number;
  total: number;
  uptimeSec?: number;
  latencyMs?: number;
  onExit: () => void;
  onEnd?: () => void;
}) {
  const percent = Math.round((Math.min(round, total) / Math.max(1, total)) * 100);

  return (
    <ArenaHeaderFrame className="arena-bar">
      <div className="arena-brand">
        <img src="/vocabflow-logo-64.png" alt="VocabFlow" width="34" height="34" />
        <div className="arena-brand-text">
          <h1>
            VocalFlow <span>{live ? 'Live Arena' : 'Astral Arena'}</span>
          </h1>
          <p>THE BATTLE OF KNOWLEDGE.</p>
        </div>
      </div>

      <div className="arena-round">
        <div className="arena-round-labels">
          <span>Câu <b>{round}</b>/{total}</span>
          <small className="arena-round-pct">{percent}%</small>
        </div>
        <progress aria-label="Tiến độ trận" value={round} max={Math.max(1, total)} />
      </div>

      <div className="arena-header-diagnostics">
        {typeof uptimeSec === 'number' && (
          <div className="arena-diagnostic-chip" title="Thời gian phòng mở">
            <Clock size={12} className="text-cyan-400" />
            <span>{formatUptime(uptimeSec)}</span>
          </div>
        )}
        {typeof latencyMs === 'number' && (
          <div className="arena-diagnostic-chip" title="Độ trễ kết nối máy chủ">
            <Activity
              size={12}
              className={
                latencyMs < 80
                  ? 'text-emerald-400'
                  : latencyMs < 180
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }
            />
            <span
              className={
                latencyMs < 80
                  ? 'text-emerald-300'
                  : latencyMs < 180
                  ? 'text-amber-300'
                  : 'text-rose-300'
              }
            >
              {latencyMs}ms
            </span>
          </div>
        )}
      </div>

      <div className="arena-header-actions">
        {onEnd && (
          <button className="arena-button arena-end-button" aria-label="Kết thúc trận" onClick={onEnd} title="Kết thúc trận">
            <Square className="arena-end-icon" size={15} aria-hidden="true" />
            <span className="arena-end-text">Kết thúc</span>
          </button>
        )}
        <button className="arena-button arena-icon-button arena-exit-btn" aria-label="Rời phòng" onClick={onExit} title="Rời phòng">
          <LogOut size={16} />
        </button>
      </div>
    </ArenaHeaderFrame>
  );
}

export function ArenaClock({
  seconds,
  duration,
  label,
}: {
  seconds: number;
  duration: number;
  label: string;
}) {
  const isUrgent = seconds <= 5;
  const clampedSec = Math.max(0, seconds);
  const formatted = clampedSec < 10 ? `0${clampedSec}` : `${clampedSec}`;

  return (
    <div className="arena-clock" data-urgent={isUrgent}>
      <div className="arena-clock-inner">
        <span className="arena-clock-label">
          <span className="arena-clock-dot" aria-hidden="true" />
          {label}
        </span>
        <strong className="arena-clock-value">
          {formatted}<small>s</small>
        </strong>
      </div>
      <progress
        aria-label={label}
        value={Math.min(clampedSec, duration)}
        max={Math.max(1, duration)}
      />
    </div>
  );
}

export function ArenaPrompt({
  question,
  onAudio,
}: {
  question: ArenaQuestion;
  onAudio?: () => void;
}) {
  return (
    <div className="arena-prompt">
      <div className="arena-prompt-header">
        {question.category && (
          <span className="astral-subject">{question.category.toUpperCase()}</span>
        )}
        {question.difficulty && (
          <span className="astral-difficulty-badge">ĐỘ KHÓ {question.difficulty}</span>
        )}
      </div>

      <div className="arena-prompt-body">
        <p className="arena-question-text">{question.prompt}</p>
        {onAudio && (
          <button
            className="arena-button arena-icon-button arena-audio-btn"
            type="button"
            aria-label="Phát âm"
            onClick={onAudio}
          >
            <Volume2 size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

export function ArenaPlace({ rank }: { rank: number }) {
  return (
    <span className="arena-place" data-rank={rank} aria-label={`Hạng ${rank}`}>
      {rank === 1 ? (
        <Crown size={15} aria-hidden="true" />
      ) : rank <= 3 ? (
        <Medal size={14} aria-hidden="true" />
      ) : (
        rank
      )}
    </span>
  );
}

export function ArenaRanking({
  players,
  title,
}: {
  players: ArenaPlayer[];
  title: string;
}) {
  return (
    <LeaderboardFrame className="arena-panel arena-ranking">
      <div className="arena-panel-heading">
        <h2>
          <Trophy size={16} aria-hidden="true" /> {title}
        </h2>
        <span className="astral-live-tag">LIVE</span>
      </div>
      <EnergyDivider />
      {players.length ? (
        <ol className="arena-list">
          {players.map((player, index) => (
            <RankingRow key={player.userId} player={player} rank={player.rank ?? index + 1}>
              <ArenaPlace rank={player.rank ?? index + 1} />
              <PlayerAvatar avatarUrl={player.avatar} displayName={player.displayName} size="xs" />
              <b className="arena-player-name" title={player.displayName}>
                {player.displayName}
              </b>
              <strong className="arena-player-score">
                <AnimatedScore value={player.score} /> đ
              </strong>
            </RankingRow>
          ))}
        </ol>
      ) : (
        <p className="arena-empty">Chưa có điểm</p>
      )}
    </LeaderboardFrame>
  );
}

function RankingRow({
  player,
  rank,
  children,
}: {
  player: ArenaPlayer;
  rank: number;
  children: React.ReactNode;
}) {
  const previous = useRef(rank);
  const [change, setChange] = useState(0);

  useEffect(() => {
    if (previous.current === rank) return;
    setChange(previous.current - rank);
    previous.current = rank;
    const timer = window.setTimeout(() => setChange(0), 2200);
    return () => window.clearTimeout(timer);
  }, [rank]);

  return (
    <li
      data-current={player.isCurrentUser}
      data-medal={rank <= 3 ? rank : undefined}
      data-moved={change !== 0}
      className="arena-rank-row"
    >
      {children}
      {change !== 0 && (
        <span
          className="astral-rank-change"
          aria-label={change > 0 ? `Tăng ${change} bậc` : `Giảm ${-change} bậc`}
        >
          {change > 0 ? '↑' : '↓'}
          {Math.abs(change)}
        </span>
      )}
    </li>
  );
}

export function AnimatedScore({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    const from = current.current;
    if (from === value) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const fraction = Math.min(1, (now - start) / 420);
      current.current = Math.round(from + (value - from) * (1 - (1 - fraction) ** 3));
      setShown(current.current);
      if (fraction < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="astral-score-value">{shown}</span>;
}
