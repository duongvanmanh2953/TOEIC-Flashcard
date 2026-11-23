import React, { useEffect, useState } from 'react';
import { BarChart3, Check } from 'lucide-react';
import { AnalyticsFrame } from './AstralFrames';
import { OPTION_KEYS } from './ArenaStage';

interface AnswerDistributionChartProps {
  questionId: string;
  options?: string[];
  totalParticipants?: number;
  roundAnswerCount?: number;
  votes?: Record<string, number>;
  revealed?: boolean;
  correctOptionIndex?: number;
  acceptedAnswers?: string[];
  selectedOptionIndex?: number;
  animate?: boolean;
  className?: string;
  embedded?: boolean;
  responses?: { eventId: string; displayName: string; answer?: string }[];
}

function ChartValues({
  options,
  votes = {},
  revealed,
  correctOptionIndex,
  acceptedAnswers,
  animate,
  responses,
}: AnswerDistributionChartProps) {
  const [animated, setAnimated] = useState(!animate);

  useEffect(() => {
    if (!animate || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnimated(true);
      return;
    }
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, [animate]);

  const labels = options?.length
    ? options.slice(0, 4).map((_, index) => OPTION_KEYS[index])
    : Object.keys(votes).sort((a, b) => votes[b] - votes[a] || a.localeCompare(b));
  const total = labels.reduce((sum, label) => sum + (votes[label] ?? 0), 0);

  return (
    <>
      <div className="arena-panel-heading">
        <h2>
          <BarChart3 size={16} aria-hidden="true" /> Thống kê lựa chọn
        </h2>
        <span
          className="astral-valid-badge"
          title="Số người có đáp án hợp lệ, mỗi người tính một lần"
        >
          {total} đáp án hợp lệ
        </span>
      </div>

      <ul
        className="arena-chart-list"
        aria-label="Phân bố đáp án hợp lệ, mỗi người tính một lần"
      >
        {labels.map((label, index) => {
          const count = votes[label] ?? 0;
          const percent = total ? Math.round((count / total) * 100) : 0;
          const correct =
            revealed &&
            (options?.length
              ? index === correctOptionIndex
              : acceptedAnswers?.includes(label));
          const optionText = options?.[index];

          return (
            <li key={label} data-correct={Boolean(correct)} className="arena-chart-item">
              {!options?.length &&
              revealed &&
              responses?.some((response) => response.answer === label) ? (
                <details className="astral-chart-detail">
                  <summary title="Người trả lời gần đây">
                    <span className="arena-chart-label-badge">{label}</span>
                    {correct && (
                      <Check
                        className="arena-chart-check"
                        size={14}
                        aria-label="Đáp án đúng"
                      />
                    )}
                  </summary>
                  <ul>
                    {responses
                      .filter((response) => response.answer === label)
                      .map((response) => (
                        <li key={response.eventId}>{response.displayName}</li>
                      ))}
                  </ul>
                </details>
              ) : (
                <div title={optionText || label} className="arena-chart-label">
                  <span className="arena-chart-label-badge">{label}</span>
                  {optionText && <span className="arena-chart-opt-text">{optionText}</span>}
                  {correct && (
                    <Check
                      className="arena-chart-check"
                      size={14}
                      aria-label="Đáp án đúng"
                    />
                  )}
                </div>
              )}

              <div className="arena-chart-track" aria-hidden="true">
                <i
                  style={{
                    transform: `scaleX(${animated ? percent / 100 : 0})`,
                  }}
                />
              </div>

              <span className="arena-chart-count" aria-label={`${count} đáp án`}>
                {count}
              </span>
              <strong className="arena-chart-pct">
                {percent}%
              </strong>
            </li>
          );
        })}
        {!labels.length && <li className="arena-empty">Chưa có đáp án hợp lệ</li>}
      </ul>
    </>
  );
}

export function AnswerDistributionChart(props: AnswerDistributionChartProps) {
  return (
    <AnalyticsFrame className={`arena-panel arena-chart ${props.className ?? ''}`}>
      <ChartValues key={props.questionId} {...props} />
    </AnalyticsFrame>
  );
}
