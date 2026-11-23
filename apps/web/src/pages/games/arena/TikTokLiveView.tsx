import React, { useState, useEffect } from 'react';
import { PlayerAvatar } from '@vocabflow/shared';
import {
  ArenaEnvironment,
  ArenaPanel,
  AnswerFrame,
  ChampionFrame,
  QuestionStageFrame,
  RankFrame,
} from './AstralFrames';
import { ArenaExplanationCard } from './ArenaExplanationCard';
import { Check, Flame, MessageSquare, Trophy, Zap, ArrowRight, LogOut, PlusCircle } from 'lucide-react';
import {
  ArenaClock,
  ArenaHeader,
  ArenaPlace,
  ArenaPrompt,
  ArenaRanking,
  choiceText,
  OPTION_KEYS,
  type ArenaPlayer,
  type ArenaQuestion,
} from './ArenaStage';
import { AnswerDistributionChart } from './AnswerDistributionChart';

export interface LiveWinner {
  commenterId: string;
  displayName: string;
  answer: string;
  points: number;
  avatarUrl?: string;
  rank: number;
}

interface LiveComment {
  eventId: string;
  displayName: string;
  commentText: string;
  answer?: string;
  accepted?: boolean;
  timestamp?: number;
}

interface TikTokLiveViewProps {
  gameMode?: string;
  currentRound: number;
  totalRounds: number;
  question: ArenaQuestion;
  seconds: number;
  duration: number;
  resultSeconds: number | null;
  participants: ArenaPlayer[];
  comments: LiveComment[];
  votes: Record<string, number>;
  winners: LiveWinner[];
  correctOptionIndex?: number;
  correctAnswer?: string;
  acceptedAnswers?: string[];
  explanation?: string;
  paused: boolean;
  uptimeSec?: number;
  latencyMs?: number;
  themeColor?: string;
  onLeaveRoom: () => void;
  onEnd?: () => void;
  onAudio?: () => void;
}

const timeFormat = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function livePhase(
  duration: number,
  seconds: number,
  resultSeconds: number | null
): 'comments' | 'activity' | 'chart' | 'podium' {
  if (resultSeconds !== null) return resultSeconds > 5 ? 'chart' : 'podium';
  return duration - seconds < 10 ? 'comments' : 'activity';
}

export function TikTokLiveView({
  gameMode,
  currentRound,
  totalRounds,
  question,
  seconds,
  duration,
  resultSeconds,
  participants,
  comments,
  votes,
  winners,
  correctOptionIndex,
  correctAnswer,
  acceptedAnswers,
  explanation,
  paused,
  uptimeSec,
  latencyMs,
  themeColor,
  onLeaveRoom,
  onEnd,
  onAudio,
}: TikTokLiveViewProps) {
  const phase = livePhase(duration, seconds, resultSeconds);
  const locked = resultSeconds !== null;

  const isRevealed = Boolean(locked || correctOptionIndex !== undefined || correctAnswer);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (!isRevealed) {
      setShowExplanation(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowExplanation(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isRevealed, currentRound]);

  const acceptedComments = comments.filter((comment) => comment.accepted).slice(0, 12);
  const rankById = new Map(participants.map((player) => [player.userId, player.rank]));
  const choices = question.options ?? [];
  const chartProps = {
    options: choices,
    votes,
    revealed: locked,
    correctOptionIndex,
    acceptedAnswers,
    responses: comments.filter((comment) => comment.accepted),
  };

  return (
    <div
      className="arena-shell arena-live"
      data-phase={phase}
      data-mode={gameMode}
      data-theme-color={themeColor}
    >
      <ArenaEnvironment
        scene={
          gameMode === 'BOSS_ROUND' || gameMode === 'FINAL_SHOWDOWN' ? 'boss' : 'live'
        }
      />
      <ArenaHeader
        live
        round={currentRound}
        total={totalRounds}
        uptimeSec={uptimeSec}
        latencyMs={latencyMs}
        onExit={onLeaveRoom}
        onEnd={onEnd}
      />

      <main className="arena-grid">
        {/* Dominant Main Question Stage */}
        <QuestionStageFrame className="arena-stage" aria-label="Câu hỏi">
          <ArenaClock
            seconds={
              locked
                ? resultSeconds > 5
                  ? resultSeconds - 5
                  : resultSeconds
                : seconds
            }
            duration={locked ? 5 : duration}
            label={
              paused
                ? 'Tạm dừng'
                : phase === 'podium'
                ? 'Câu tiếp theo'
                : locked
                ? 'Đã khóa đáp án'
                : 'Đang nhận đáp án'
            }
          />

          <ArenaPrompt question={question} onAudio={onAudio} />

          {showExplanation ? (
            <div className="w-full my-2 animate-fade-in">
              <ArenaExplanationCard
                correctLetter={
                  correctOptionIndex !== undefined
                    ? OPTION_KEYS[correctOptionIndex]
                    : correctAnswer
                    ? String(correctAnswer).slice(0, 1).toUpperCase()
                    : undefined
                }
                correctText={
                  correctOptionIndex !== undefined && choices[correctOptionIndex]
                    ? choiceText(choices[correctOptionIndex])
                    : correctAnswer
                }
                explanation={
                  explanation ||
                  (question as any).explanation ||
                  (question.targetWord
                    ? `${question.targetWord}: Đáp án chính xác của buổi Live.`
                    : 'Ghi nhớ đáp án chuẩn để tiếp tục bình luận chính xác trong câu tiếp theo!')
                }
                className="w-full"
              />
            </div>
          ) : choices.length > 0 ? (
            <ol className="arena-choices">
              {choices.map((option, index) => (
                <AnswerFrame
                  passive
                  key={index}
                  state={locked && correctOptionIndex === index ? 'correct' : undefined}
                >
                  <span className="arena-key">{OPTION_KEYS[index]}</span>
                  <span className="arena-option-text">{choiceText(option)}</span>
                  {locked && correctOptionIndex === index && (
                    <Check className="arena-option-icon correct" size={20} aria-label="Đúng" />
                  )}
                </AnswerFrame>
              ))}
            </ol>
          ) : null}

          {locked && !showExplanation && !choices.length && correctAnswer && (
            <p className="arena-feedback" data-correct="true">
              Đáp án: {correctAnswer}
            </p>
          )}

          {!locked && !choices.length && (
            <p className="arena-empty">Nhập từ còn thiếu trong bình luận</p>
          )}
        </QuestionStageFrame>

        {/* Accepted Audience Comments Feed */}
        <ArenaPanel className="arena-panel arena-comments">
          <div className="arena-panel-heading">
            <h2>
              <MessageSquare size={16} aria-hidden="true" /> Bình luận
            </h2>
            <span className="astral-valid-badge">
              {Object.values(votes).reduce((total, count) => total + count, 0)} hợp lệ
            </span>
          </div>
          {acceptedComments.length ? (
            <ul className="arena-list arena-comment-feed">
              {acceptedComments.map((comment) => (
                <li key={comment.eventId} className="arena-feed-entry">
                  <b className="arena-comment-user">{comment.displayName}</b>
                  <span className="arena-comment-text" title={comment.commentText}>
                    {comment.answer ?? comment.commentText}
                  </span>
                  <small data-accepted="true" className="arena-comment-time">
                    Hợp lệ
                    {comment.timestamp ? (
                      <>
                        {' · '}
                        <time dateTime={new Date(comment.timestamp).toISOString()}>
                          {timeFormat.format(comment.timestamp)}
                        </time>
                      </>
                    ) : null}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="arena-empty">Chưa có bình luận</p>
          )}
        </ArenaPanel>

        {/* Answer Distribution Chart */}
        <AnswerDistributionChart
          {...chartProps}
          questionId={question.id}
          className="arena-wide-chart"
        />
        {phase === 'chart' && (
          <AnswerDistributionChart
            {...chartProps}
            questionId={question.id}
            animate
            className="arena-mobile-chart"
          />
        )}

        {/* Top 3 Reflex Winners Podium */}
        <ArenaPanel className="arena-panel arena-winners">
          <div className="arena-panel-heading">
            <h2>
              <Zap size={16} aria-hidden="true" /> Top 3 phản xạ
            </h2>
            <span className="astral-speed-badge">TỐC ĐỘ</span>
          </div>
          {winners.length ? (
            <ol className="arena-podium" data-reveal={locked}>
              {winners.map((winner) => {
                const overallRank = rankById.get(winner.commenterId);
                return (
                  <RankFrame key={winner.commenterId} rank={winner.rank}>
                    <ArenaPlace rank={winner.rank} />
                    <PlayerAvatar
                      avatarUrl={winner.avatarUrl}
                      displayName={winner.displayName}
                      size="xs"
                    />
                    <b title={winner.displayName} className="arena-winner-user">
                      {winner.displayName}
                    </b>
                    <span
                      className="arena-podium-answer"
                      title={locked ? winner.answer : undefined}
                    >
                      {locked ? `Đáp án: ${winner.answer}` : null}
                    </span>
                    <strong className="arena-delta arena-winner-score">+{winner.points} đ</strong>
                    {overallRank !== undefined && <small>Hạng {overallRank}</small>}
                  </RankFrame>
                );
              })}
            </ol>
          ) : (
            <p className="arena-empty">Chưa có đáp án đúng</p>
          )}
        </ArenaPanel>

        {/* Live Overall Leaderboard (Top 10) */}
        <ArenaRanking title="Xếp hạng Live" players={participants.slice(0, 10)} />
      </main>

      <footer className="arena-footer">
        <span className="arena-live-note">
          <span className="astral-live-dot" /> LIVE STREAM VẬN HÀNH BỞI VOCALFLOW
        </span>
        <span className="arena-brand-tag">vocalflow.site</span>
      </footer>
    </div>
  );
}

export function LiveFinalResults({
  live = true,
  playedRounds,
  totalRounds,
  participants,
  onLeaveRoom,
  onPlayAgain,
  onNextMatch,
  countdown,
  nextMatchTitle,
  personalResult,
  uptimeSec,
  latencyMs,
  themeColor,
}: {
  live?: boolean;
  countdown?: number;
  nextMatchTitle?: string;
  personalResult?: { correctCount: number; answeredCount?: number; bestStreak?: number };
  playedRounds: number;
  totalRounds: number;
  participants: ArenaPlayer[];
  onLeaveRoom: () => void;
  onPlayAgain: () => void;
  onNextMatch?: () => void;
  uptimeSec?: number;
  latencyMs?: number;
  themeColor?: string;
}) {
  const leaders = participants.filter((player) => player.score > 0).slice(0, 3);

  return (
    <div
      className="arena-shell arena-live-final"
      data-theme-color={themeColor}
    >
      <ArenaEnvironment scene="champion" />
      <ArenaHeader
        live={live}
        round={playedRounds}
        total={totalRounds}
        uptimeSec={uptimeSec}
        latencyMs={latencyMs}
        onExit={onLeaveRoom}
      />

      <main className="arena-grid">
        <ChampionFrame className="arena-stage astral-champion-stage">
          <div className="arena-prompt astral-champion-banner">
            <h2>
              <Trophy size={32} className="astral-gold-trophy" />{' '}
              {live ? 'Kết quả VocalFlow Live' : 'Bảng vàng Astral Arena'}
            </h2>
            <p className="astral-champion-tagline">VINH DANH NHỮNG CHIẾN BINH XUẤT SẮC NHẤT</p>
          </div>

          {leaders.length ? (
            <ol className="arena-podium astral-victory-podium" data-reveal="true">
              {leaders.map((player, index) => {
                const rank = player.rank ?? index + 1;
                return (
                  <RankFrame key={player.userId} rank={rank}>
                    <div className="astral-podium-pedestal">
                      <ArenaPlace rank={rank} />
                      <PlayerAvatar
                        avatarUrl={player.avatar}
                        displayName={player.displayName}
                        size="sm"
                      />
                      <b title={player.displayName} className="astral-podium-name">
                        {player.displayName}
                      </b>
                      <strong className="astral-podium-score">{player.score} đ</strong>
                    </div>
                  </RankFrame>
                );
              })}
            </ol>
          ) : (
            <div className="astral-empty-card">
              <div className="astral-empty-card-icon">
                <Trophy size={22} />
              </div>
              <h3 className="astral-empty-card-title">Chưa có người ghi điểm</h3>
              <p className="astral-empty-card-desc">
                Chưa có đấu thủ nào hoàn thành câu trả lời ghi điểm trong trận đấu này. Hãy chuẩn bị sẵn sàng cho trận chiến tiếp theo!
              </p>
            </div>
          )}

          {personalResult && (
            <div className="astral-result-strip">
              <span>
                Đúng{' '}
                <b>
                  {personalResult.correctCount}/
                  {personalResult.answeredCount ?? personalResult.correctCount}
                </b>
              </span>
              <span>
                Chuỗi tốt nhất <b>{personalResult.bestStreak ?? 0}</b>
              </span>
            </div>
          )}

          <div className="arena-actions astral-final-actions">
            {nextMatchTitle && Boolean(countdown) && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/40 text-xs font-bold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{nextMatchTitle} · {countdown}s</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-1">
              <button
                type="button"
                className="arena-button arena-primary astral-play-again"
                onClick={onPlayAgain}
                title="Tạo phòng thi đấu mới"
              >
                <PlusCircle size={15} />
                <span>Tạo phòng mới</span>
              </button>

              {onNextMatch && (
                <button
                  type="button"
                  className="arena-button bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  onClick={onNextMatch}
                  title="Chuyển sang trận đấu tiếp theo"
                >
                  <ArrowRight size={15} />
                  <span>Trận kế tiếp</span>
                </button>
              )}

              <button
                type="button"
                className="arena-button arena-exit-btn text-slate-300 hover:text-white"
                onClick={onLeaveRoom}
                title="Rời khỏi phòng thi đấu và trở về sảnh"
              >
                <LogOut size={15} />
                <span>Rời phòng / Về sảnh</span>
              </button>
            </div>
          </div>
        </ChampionFrame>

        <ArenaRanking
          title={live ? 'Xếp hạng Live' : 'Xếp hạng Battle'}
          players={participants.slice(0, 10)}
        />
      </main>

      <footer className="arena-footer">
        <span className="arena-brand-tag">vocalflow.site</span>
      </footer>
    </div>
  );
}
