import React, { useState, useEffect } from 'react';
import { PlayerAvatar } from '@vocabflow/shared';
import {
  ArenaEnvironment,
  ArenaPanel,
  AnswerFrame,
  QuestionStageFrame,
  RankFrame,
} from './AstralFrames';
import { ArenaExplanationCard } from './ArenaExplanationCard';
import { Check, MessageSquare, Zap } from 'lucide-react';
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
  scoreAdded?: number;
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
  arenaPlayers?: ArenaPlayer[];
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
  isMobile?: boolean;
  onToggleMobile?: () => void;
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
  arenaPlayers = [],
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
  isMobile,
  onToggleMobile,
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

  // Show recent comments (including answers and live chat)
  const displayComments = comments.slice(0, 20);
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
      data-mobile={isMobile ? 'true' : undefined}
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
        isMobile={isMobile}
        onToggleMobile={onToggleMobile}
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
          {displayComments.length ? (
            <ul className="arena-list arena-comment-feed">
              {displayComments.map((comment) => (
                <li key={comment.eventId} className="arena-feed-entry">
                  <b className="arena-comment-user">{comment.displayName}</b>
                  <span className="arena-comment-text" title={comment.commentText}>
                    {comment.commentText}
                  </span>
                  {comment.accepted ? (
                    <small data-accepted="true" className="arena-comment-time text-emerald-400 font-bold">
                      ✓ Đáp án {comment.answer}
                      {comment.scoreAdded ? ` (+${comment.scoreAdded}đ)` : ''}
                      {comment.timestamp ? (
                        <>
                          {' · '}
                          <time dateTime={new Date(comment.timestamp).toISOString()}>
                            {timeFormat.format(comment.timestamp)}
                          </time>
                        </>
                      ) : null}
                    </small>
                  ) : comment.answer ? (
                    <small className="arena-comment-time text-indigo-300 font-semibold">
                      Chọn {comment.answer}
                      {comment.timestamp ? (
                        <>
                          {' · '}
                          <time dateTime={new Date(comment.timestamp).toISOString()}>
                            {timeFormat.format(comment.timestamp)}
                          </time>
                        </>
                      ) : null}
                    </small>
                  ) : (
                    <small className="arena-comment-time text-slate-400">
                      Chat
                      {comment.timestamp ? (
                        <>
                          {' · '}
                          <time dateTime={new Date(comment.timestamp).toISOString()}>
                            {timeFormat.format(comment.timestamp)}
                          </time>
                        </>
                      ) : null}
                    </small>
                  )}
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
              <Zap size={16} aria-hidden="true" /> Phản xạ câu này
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
                      title={locked && winner.answer !== '-' ? winner.answer : undefined}
                    >
                      {locked && winner.answer !== '-' ? `Đáp án: ${winner.answer}` : null}
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

        <aside className="arena-live-rankings">
          <ArenaRanking title="TikTok Live Top 3" players={participants} />
          <ArenaRanking title="Arena Battle Top 3" players={arenaPlayers} />
        </aside>
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
