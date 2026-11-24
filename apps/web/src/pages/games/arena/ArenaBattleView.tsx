import React, { useEffect, useRef, useState } from 'react';
import { Check, FastForward, X } from 'lucide-react';
import { ArenaEnvironment, ArenaPanel, AnswerFrame, QuestionStageFrame } from './AstralFrames';
import { ArenaExplanationCard } from './ArenaExplanationCard';
import {
  AnimatedScore,
  ArenaClock,
  ArenaHeader,
  ArenaPrompt,
  ArenaRanking,
  choiceText,
  OPTION_KEYS,
  type ArenaPlayer,
  type ArenaQuestion,
} from './ArenaStage';

interface ArenaBattleViewProps {
  gameMode?: string;
  currentRound: number;
  totalRounds: number;
  question: ArenaQuestion;
  roundDurationSec: number;
  seconds: number;
  resultSeconds?: number;
  closed: boolean;
  paused: boolean;
  uptimeSec?: number;
  latencyMs?: number;
  themeColor?: string;
  isMobile?: boolean;
  onToggleMobile?: () => void;
  onResume?: () => void;
  disabled: boolean;
  selectedOption: number | null;
  evaluation: { isCorrect: boolean; score: number } | null;
  skipped: boolean;
  correctOptionIndex?: number;
  correctAnswer?: string;
  explanation?: string;
  players: ArenaPlayer[];
  myPlayer: ArenaPlayer | null;
  onSelectOption: (optionIndex: number) => void;
  onSubmitText: (text: string) => void;
  onSkipQuestion: () => void;
  onLeaveRoom: () => void;
  onEnd?: () => void;
  onAudio?: () => void;
}

export function ArenaBattleView({
  gameMode,
  currentRound,
  totalRounds,
  question,
  roundDurationSec,
  seconds,
  resultSeconds,
  closed,
  disabled,
  selectedOption,
  evaluation,
  skipped,
  correctOptionIndex,
  correctAnswer,
  explanation,
  players,
  myPlayer,
  onSelectOption,
  onSubmitText,
  onSkipQuestion,
  onLeaveRoom,
  onEnd,
  onAudio,
  paused,
  onResume,
  uptimeSec,
  latencyMs,
  themeColor,
  isMobile,
  onToggleMobile,
}: ArenaBattleViewProps) {
  const [draft, setDraft] = useState('');
  const textInput = useRef<HTMLInputElement>(null);
  const choices = question.options ?? [];

  const isChecking = closed && (resultSeconds === undefined || resultSeconds > 5);
  const isRevealed = closed && !isChecking;

  useEffect(() => {
    textInput.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (disabled) return;
    const keydown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest('input, textarea, [contenteditable="true"]'))
      )
        return;

      if (
        event.code === 'Space' &&
        !(event.target instanceof HTMLElement && event.target.closest('button, a'))
      ) {
        event.preventDefault();
        onSkipQuestion();
        return;
      }

      const letterIndex = OPTION_KEYS.indexOf(event.key.toUpperCase());
      const index = letterIndex >= 0 ? letterIndex : ['1', '2', '3', '4'].indexOf(event.key);
      if (index >= 0 && choices[index]) {
        event.preventDefault();
        onSelectOption(index);
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [choices, disabled, onSelectOption, onSkipQuestion]);

  const feedback = skipped
    ? 'Đã bỏ qua · 0 đ'
    : evaluation
    ? evaluation.isCorrect
      ? `Chính xác · +${evaluation.score} đ`
      : 'Chưa đúng · 0 đ'
    : closed && selectedOption === null
    ? 'Vòng đã đóng'
    : selectedOption !== null
    ? 'Đã gửi đáp án'
    : '';

  const scene = gameMode === 'BOSS_ROUND' || gameMode === 'FINAL_SHOWDOWN' ? 'boss' : 'main';
  const ahead = players.find(
    (player) => myPlayer?.rank !== undefined && player.rank === myPlayer.rank - 1
  );

  return (
    <div
      className="arena-shell arena-battle"
      data-mode={gameMode}
      data-theme-color={themeColor}
      data-mobile={isMobile ? 'true' : undefined}
    >
      <ArenaEnvironment scene={scene} />
      <ArenaHeader
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
        {/* Personal score rail */}
        <aside className="arena-battle-rail arena-left-rail">
          {myPlayer && (
            <ArenaPanel className="arena-personal" aria-label="Kết quả của bạn">
              <div className="astral-combat-heading">
                <span className="astral-stat-label">Chiến binh</span>
                <b className="astral-combat-name" title={myPlayer.displayName}>
                  {myPlayer.displayName}
                </b>
              </div>

              <div className="astral-combat-stats">
                <div className="astral-stat-box">
                  <span className="astral-stat-label">Điểm số</span>
                  <strong className="astral-stat-value">
                    <AnimatedScore value={myPlayer.score} />
                    <small> đ</small>
                  </strong>
                </div>

                <div className="astral-stat-box">
                  <span className="astral-stat-label">Thứ hạng</span>
                  <strong className="astral-stat-value arena-delta" key={myPlayer.rank}>
                    {myPlayer.rank !== undefined ? `#${myPlayer.rank}` : '—'}
                  </strong>
                </div>
              </div>

              {ahead && (
                <div className="astral-gap-box">
                  <small className="astral-gap">
                    Cách hạng {ahead.rank}: <b>+{Math.max(0, ahead.score - myPlayer.score)} đ</b>
                  </small>
                </div>
              )}
            </ArenaPanel>
          )}
        </aside>

        {/* Center Main Question Stage (flexible 1fr) */}
        <QuestionStageFrame className="arena-stage" aria-label="Câu hỏi">
          <ArenaClock
            seconds={closed ? isChecking ? (resultSeconds ?? 7) - 5 : resultSeconds ?? 5 : seconds}
            duration={closed ? isChecking ? 2 : 5 : roundDurationSec}
            label={
              paused ? 'Tạm dừng' : isChecking ? 'Đang kiểm tra kết quả' : closed ? 'Đáp án chính xác' : 'Đang nhận đáp án'
            }
          />

          <ArenaPrompt question={question} onAudio={onAudio} />

          {isChecking ? (
            <div className="arena-checking" role="status" aria-live="polite">
              <span className="arena-checking-scan" aria-hidden="true" />
              <strong>ĐANG KIỂM TRA KẾT QUẢ...</strong>
              <span>Đối chiếu câu trả lời của các đấu thủ</span>
            </div>
          ) : choices.length ? (
            <div className="arena-choices">
              {choices.map((option, index) => {
                const selected = selectedOption === index;
                const correct =
                  correctOptionIndex === index || (selected && evaluation?.isCorrect);
                const wrong = selected && evaluation && !evaluation.isCorrect;
                return (
                  <AnswerFrame
                    state={
                      correct ? 'correct' : wrong ? 'wrong' : selected ? 'selected' : undefined
                    }
                    key={index}
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() => onSelectOption(index)}
                  >
                    <span className="arena-key">{OPTION_KEYS[index]}</span>
                    <span className="arena-option-text">{choiceText(option)}</span>
                    {correct && <Check className="arena-option-icon correct" size={20} aria-label="Đúng" />}
                    {wrong && <X className="arena-option-icon wrong" size={20} aria-label="Sai" />}
                  </AnswerFrame>
                );
              })}
            </div>
          ) : (
            <form
              className="arena-entry"
              onSubmit={(event) => {
                event.preventDefault();
                if (!disabled && draft.trim()) onSubmitText(draft.trim());
              }}
            >
              <input
                ref={textInput}
                aria-label="Đáp án"
                placeholder="Nhập đáp án..."
                maxLength={256}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={disabled}
              />
              <button className="arena-button arena-primary" disabled={disabled || !draft.trim()}>
                Gửi
              </button>
            </form>
          )}

          {isRevealed && (correctOptionIndex !== undefined || correctAnswer || explanation) && (
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
                    ? `${question.targetWord}: Đáp án chính xác của vòng đấu.`
                    : 'Ghi nhớ đáp án chuẩn để đạt thứ hạng cao hơn trong các câu tiếp theo!')
                }
                className="arena-explanation-compact w-full"
              />
            </div>
          )}

          <div className="arena-actions">
            <div
              role="status"
              className="arena-feedback"
              data-correct={evaluation?.isCorrect}
            >
              {feedback && <strong key={feedback} className="arena-delta">{feedback}</strong>}
            </div>

            {onResume ? (
              <button className="arena-button arena-resume-btn" type="button" onClick={onResume}>
                Tiếp tục
              </button>
            ) : (
              <button
                className="arena-button arena-skip-btn"
                type="button"
                onClick={onSkipQuestion}
                disabled={disabled}
              >
                <FastForward size={16} /> Bỏ qua
              </button>
            )}
          </div>
        </QuestionStageFrame>

        {/* Right leaderboard rail (~300px on desktop) */}
        <aside className="arena-battle-rail arena-right-rail">
          <ArenaRanking title="Bảng xếp hạng Đấu trường" players={players} limit={isMobile ? 5 : 10} />
        </aside>
      </main>

      <footer className="arena-footer">
        <span className="arena-shortcuts">
          {choices.length
            ? 'A–D / 1–4 chọn đáp án · Space bỏ qua'
            : 'Enter gửi đáp án'}
        </span>
        <span className="arena-brand-tag">vocalflow.site</span>
      </footer>
    </div>
  );
}
