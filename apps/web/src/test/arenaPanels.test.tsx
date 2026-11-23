// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { QuestionAnalyticsPanel } from '../pages/games/arena/QuestionAnalyticsPanel';
import { TopAnswersThisRound } from '../pages/games/arena/TopAnswersThisRound';
import { ArenaRankingPanel } from '../pages/games/arena/ArenaRankingPanel';
import { ArenaDynamicBackground } from '../pages/games/arena/ArenaDynamicBackground';
import { ArenaCelebrationOverlay } from '../pages/games/arena/ArenaCelebrationOverlay';
import { AnswerCard, liveBgmEngine } from '@vocabflow/shared';

import { AnswerDistributionChart } from '../pages/games/arena/AnswerDistributionChart';
import { ArenaCommentPanel } from '../pages/games/arena/ArenaCommentPanel';
import { ArenaBangVangCeremony } from '../pages/games/arena/ArenaBangVangCeremony';
import { ArenaPillOptionButton } from '../pages/games/arena/ArenaPillOptionButton';
import { ArenaExplanationCard } from '../pages/games/arena/ArenaExplanationCard';
import { ArenaInGameHeader } from '../pages/games/arena/ArenaInGameHeader';
import { ArenaPodium, WinnerCelebration, ArenaTrophyArtwork, RoundResultModal } from '@vocabflow/shared';

describe('VocabFlow Arena - 3 Independent Areas & Dynamic Backgrounds', () => {
  afterEach(() => {
    cleanup();
  });

  it('A. Question Analytics Panel renders KPIs and option breakdown', () => {
    const mockOptions = [
      {
        optionLetter: 'A',
        text: 'Diligent',
        count: 5,
        percentage: 50,
        isCorrect: true,
        respondents: [{ userId: 'u1', displayName: 'Player One', isCorrect: true, speedMs: 800 }],
      },
      {
        optionLetter: 'B',
        text: 'Lazy',
        count: 5,
        percentage: 50,
        isCorrect: false,
        respondents: [{ userId: 'u2', displayName: 'Player Two', isCorrect: false, speedMs: 1200 }],
      },
    ];

    render(
      <QuestionAnalyticsPanel
        totalParticipants={10}
        roundAnswerCount={10}
        correctCount={5}
        incorrectCount={5}
        accuracy={50}
        optionsAnalytics={mockOptions}
        correctOptionIndex={0}
      />
    );

    expect(screen.getByText('QUESTION ANALYTICS')).toBeDefined();
    expect(screen.getByText('ĐÁP ÁN ĐÚNG')).toBeDefined();
    expect(screen.getByText('Diligent')).toBeDefined();

    // Toggle expand
    const buttonA = screen.getByText('Diligent').closest('button');
    if (buttonA) {
      fireEvent.click(buttonA);
      expect(screen.getByText('Player One')).toBeDefined();
    }
  });

  it('B. Top Answers This Round renders valid responses and speed tiers', () => {
    const mockSubmissions = [
      {
        userId: 'u1',
        displayName: 'SpeedDemon',
        answer: 'A',
        isCorrect: true,
        scoreEarned: 950,
        responseTimeMs: 700,
        streak: 3,
        rank: 1,
      },
      {
        userId: 'u2',
        displayName: 'SlowThinker',
        answer: 'B',
        isCorrect: false,
        scoreEarned: 0,
        responseTimeMs: 3200,
        streak: 0,
        rank: 2,
      },
    ];

    render(
      <TopAnswersThisRound
        submissions={mockSubmissions}
        currentUserId="u1"
        totalSubmissions={2}
      />
    );

    expect(screen.getByText('TOP ANSWERS THIS ROUND')).toBeDefined();
    expect(screen.getByText('SpeedDemon')).toBeDefined();
    expect(screen.getByText('BẠN')).toBeDefined();
    expect(screen.getByText('+950 XP')).toBeDefined();
    expect(screen.getByText('0.7s')).toBeDefined();
    expect(screen.getByText('3x')).toBeDefined();
  });

  it('C. Arena Ranking Panel renders Top 3 Podium and Bảng Vàng', () => {
    const mockPlayers = [
      {
        userId: 'p1',
        displayName: 'Champion',
        avatar: '',
        score: 12000,
        streak: 5,
        bestStreak: 8,
        correctCount: 15,
        totalAnswered: 15,
        rank: 1,
      },
      {
        userId: 'p2',
        displayName: 'RunnerUp',
        avatar: '',
        score: 9500,
        streak: 2,
        bestStreak: 4,
        correctCount: 12,
        totalAnswered: 15,
        rank: 2,
      },
      {
        userId: 'p3',
        displayName: 'BronzeHero',
        avatar: '',
        score: 8000,
        streak: 1,
        bestStreak: 3,
        correctCount: 10,
        totalAnswered: 15,
        rank: 3,
      },
    ];

    render(
      <ArenaRankingPanel
        players={mockPlayers}
        currentUserId="p2"
        totalParticipants={3}
      />
    );

    expect(screen.getAllByText(/BẢNG VÀNG/i).length).toBeGreaterThan(0);
    // Appear in podium and ceremony
    expect(screen.getAllByText('Champion').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RunnerUp').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BronzeHero').length).toBeGreaterThan(0);
  });

  it('Dynamic Background generates distinct theme overlays', () => {
    const { container: c1 } = render(<ArenaDynamicBackground theme="business" />);
    expect(c1.innerHTML).toContain('arena-stage-cyberpunk.jpg');

    cleanup();
    const { container: c2 } = render(<ArenaDynamicBackground theme="science" />);
    expect(c2.innerHTML).toContain('32px_32px');

    cleanup();
    const { container: c3 } = render(<ArenaDynamicBackground theme="esports" />);
    expect(c3.innerHTML).toContain('cyberpunk');
  });

  it('AnswerCard renders distinct color themes for A, B, C, D and shows % votes', () => {
    const { container } = render(
      <div>
        <AnswerCard optionLetter="A" text="Option Red" percentVote={40} state="idle" />
        <AnswerCard optionLetter="B" text="Option Blue" percentVote={30} state="idle" />
        <AnswerCard optionLetter="C" text="Option Amber" percentVote={20} state="selected" />
        <AnswerCard optionLetter="D" text="Option Emerald" percentVote={10} state="correct" />
      </div>
    );

    expect(screen.getByText('Option Red')).toBeDefined();
    expect(screen.getByText('Option Blue')).toBeDefined();
    expect(screen.getByText('Option Amber')).toBeDefined();
    expect(screen.getByText('Option Emerald')).toBeDefined();

    // Percentage displays
    expect(screen.getByText('40%')).toBeDefined();
    expect(screen.getByText('30%')).toBeDefined();
    expect(screen.getByText('20%')).toBeDefined();
    expect(screen.getByText('10%')).toBeDefined();

    // Distinct background classes present
    expect(container.innerHTML).toContain('from-rose-950'); // Option A rose gradient
    expect(container.innerHTML).toContain('from-blue-950'); // Option B blue gradient

    // State badges
    expect(screen.getByText('ĐÃ CHỌN')).toBeDefined();
    expect(screen.getByText('✓ ĐÚNG')).toBeDefined();
  });

  it('ArenaCelebrationOverlay displays triumphant XP and combo streak banner', () => {
    render(
      <ArenaCelebrationOverlay
        show={true}
        score={850}
        streak={3}
        speedMs={1200}
      />
    );

    expect(screen.getByText('CHÍNH XÁC!')).toBeDefined();
    expect(screen.getByText('+850 XP')).toBeDefined();
    expect(screen.getByText('CHUỖI ĐÚNG X3! COMBO RỰC LỬA!')).toBeDefined();
    expect(screen.getByText(/Phản xạ thần tốc/)).toBeDefined();
  });

  it('liveBgmEngine toggles urgent mode when countdown is critical', () => {
    liveBgmEngine.setUrgent(true);
    expect(liveBgmEngine.getIsUrgent()).toBe(true);

    liveBgmEngine.setUrgent(false);
    expect(liveBgmEngine.getIsUrgent()).toBe(false);
  });

  it('AnswerDistributionChart accurately computes percentages and resets by question', () => {
    const { rerender } = render(
      <AnswerDistributionChart
        questionId="q1"
        options={['A. Cat', 'B. Dog', 'C. Fish', 'D. Bird']}
        totalParticipants={20}
        roundAnswerCount={10}
        votes={{ A: 5, B: 3, C: 2, D: 0 }}
        revealed={false}
      />
    );

    // 5/10 = 50%, 3/10 = 30%, 2/10 = 20%, 0/10 = 0%
    expect(screen.getByText('Thống kê lựa chọn')).toBeDefined();
    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('30%')).toBeDefined();
    expect(screen.getByText('20%')).toBeDefined();

    // After reveal with B being correct (idx 1)
    rerender(
      <AnswerDistributionChart
        questionId="q1"
        options={['A. Cat', 'B. Dog', 'C. Fish', 'D. Bird']}
        totalParticipants={20}
        roundAnswerCount={10}
        votes={{ A: 5, B: 3, C: 2, D: 0 }}
        revealed={true}
        correctOptionIndex={1}
      />
    );
    expect(screen.getByText('B')).toBeDefined();

    // Reset when switching to question q2
    rerender(
      <AnswerDistributionChart
        questionId="q2"
        options={['A. Apple', 'B. Banana', 'C. Cherry', 'D. Date']}
        totalParticipants={20}
        roundAnswerCount={0}
        votes={{}}
        revealed={false}
      />
    );
    expect(screen.getByText('Thống kê lựa chọn')).toBeDefined();
  });

  it('renders only the choices available for a live question', () => {
    render(
      <AnswerDistributionChart
        questionId="two-options"
        options={['A. Mèo', 'B. Chó']}
        votes={{ A: 3, B: 1 }}
      />
    );

    expect(screen.getByText('4 đáp án hợp lệ')).toBeDefined();
    expect(screen.getByText('75%')).toBeDefined();
    expect(screen.getByText('25%')).toBeDefined();
    expect(screen.queryByText('C')).toBeNull();
    expect(screen.queryByText('D')).toBeNull();
  });

  it('ArenaCommentPanel displays comments, differentiates correct comments, and allows submission', () => {
    let sentText = '';
    const mockComments = [
      {
        eventId: 'e1',
        username: 'learner1',
        displayName: 'Minh Tuấn',
        commentText: 'A',
        timestamp: Date.now() - 5000,
        isCorrect: true,
        scoreAdded: 250,
      },
      {
        eventId: 'e2',
        username: 'viewer2',
        displayName: 'Lan Hương',
        commentText: 'Xin chào mọi người!',
        timestamp: Date.now() - 2000,
      },
    ];

    render(
      <ArenaCommentPanel
        comments={mockComments}
        totalCommenters={2}
        isConnected={true}
        onSendComment={(txt) => {
          sentText = txt;
        }}
      />
    );

    expect(screen.getByText('Minh Tuấn')).toBeDefined();
    expect(screen.getByText('Lan Hương')).toBeDefined();
    expect(screen.getByText('Xin chào mọi người!')).toBeDefined();
    expect(screen.getByText('+250')).toBeDefined();

    // Form input submit
    const input = screen.getByPlaceholderText('Nhập bình luận...');
    fireEvent.change(input, { target: { value: 'B' } });
    fireEvent.submit(input.closest('form')!);
    expect(sentText).toBe('B');
  });

  it('ArenaCommentPanel hides input form when showInput={false} in TikTok Live/mobile mode', () => {
    const mockComments = [
      {
        eventId: 'e1',
        username: 'learner1',
        displayName: 'Minh Tuấn',
        commentText: 'A',
        timestamp: Date.now() - 5000,
      },
    ];

    render(
      <ArenaCommentPanel
        comments={mockComments}
        showInput={false}
      />
    );

    expect(screen.queryByPlaceholderText('Nhập bình luận...')).toBeNull();
    expect(screen.getByText(/Livestream TikTok/i)).toBeDefined();
  });

  it('ArenaPodium and WinnerCelebration handle single, 2-player and 3-player edge cases without fake winners', () => {
    // 1 Player only
    const { rerender } = render(
      <ArenaPodium
        topPlayers={[
          { id: 'u1', name: 'Solo Hero', score: 5000, rank: 1, streak: 5 },
        ]}
      />
    );
    expect(screen.getAllByText('Solo Hero').length).toBeGreaterThan(0);
    expect(screen.getAllByText('QUÁN QUÂN').length).toBeGreaterThan(0);
    expect(screen.queryByText('RunnerUp')).toBeNull();

    // 2 Players only
    rerender(
      <ArenaPodium
        topPlayers={[
          { id: 'u1', name: 'Winner One', score: 6000, rank: 1 },
          { id: 'u2', name: 'Runner Two', score: 4000, rank: 2 },
        ]}
      />
    );
    expect(screen.getAllByText('Winner One').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Runner Two').length).toBeGreaterThan(0);
    expect(screen.queryByText('BronzeHero')).toBeNull();

    // WinnerCelebration with Full Leaderboard below podium
    cleanup();
    render(
      <WinnerCelebration
        data={{
          roomCode: 'TEST123',
          gameModeTitle: 'TOEIC Arena Master',
          totalPlayers: 2,
          totalQuestions: 5,
          topPlayers: [
            { id: 'u1', name: 'Winner One', score: 6000, rank: 1 },
            { id: 'u2', name: 'Runner Two', score: 4000, rank: 2 },
          ],
          fullLeaderboard: [
            { id: 'u1', name: 'Winner One', score: 6000, rank: 1 },
            { id: 'u2', name: 'Runner Two', score: 4000, rank: 2 },
          ],
          reviewVocabs: [],
        }}
      />
    );

    expect(screen.getByText('BẢNG VÀNG VOCABFLOW ARENA')).toBeDefined();
    expect(screen.getByText(/BẢNG TỔNG SẮP TOÀN TRẬN/)).toBeDefined();
    expect(screen.getAllByText('Winner One').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Runner Two').length).toBeGreaterThan(0);
  });

  it('AnswerCard handles state matrix: idle, selected, correct, incorrect, disabled', () => {
    const { container, rerender } = render(
      <AnswerCard optionLetter="A" text="Option Text" state="idle" />
    );
    expect(container.innerHTML).toContain('from-rose-950'); // Rose base

    // Selected -> Gold/Amber
    rerender(<AnswerCard optionLetter="A" text="Option Text" state="selected" />);
    expect(screen.getByText('ĐÃ CHỌN')).toBeDefined();
    expect(container.innerHTML).toContain('from-amber-400');

    // Correct -> Emerald green
    rerender(<AnswerCard optionLetter="A" text="Option Text" state="correct" />);
    expect(screen.getByText('✓ ĐÚNG')).toBeDefined();
    expect(container.innerHTML).toContain('border-emerald-400');

    // Incorrect -> Red/Rose
    rerender(<AnswerCard optionLetter="A" text="Option Text" state="incorrect" />);
    expect(screen.getByText('✗ SAI')).toBeDefined();
    expect(container.innerHTML).toContain('border-rose-500');
  });

  it('ArenaBangVangCeremony uses real data without mock bots and renders vector trophy', () => {
    // Only 1 player
    const { container, queryByText } = render(
      <ArenaBangVangCeremony
        topPlayers={[
          { rank: 1, displayName: 'RealUser1', score: 9500 },
        ]}
        showTable4To10={false}
      />
    );

    expect(screen.getByText('RealUser1')).toBeDefined();
    expect(screen.getByText(/BẢNG VÀNG/i)).toBeDefined();
    // Must NOT have fake bots
    expect(queryByText('Player123')).toBeNull();
    expect(queryByText('GameMaster')).toBeNull();
    expect(queryByText('QuizStar')).toBeNull();
    expect(queryByText('Học viên #4')).toBeNull();

    // Must have vector trophy cup with gold linear gradients
    expect(container.innerHTML).toContain('goldCupBody');
  });

  it('ArenaCommentPanel Top Comment tab filters and sorts correct comments with crowns', () => {
    const comments = [
      {
        eventId: 'c1',
        username: 'u1',
        displayName: 'EarlyBird',
        commentText: 'Paris',
        timestamp: 1000,
        isCorrect: true,
        scoreAdded: 10,
      },
      {
        eventId: 'c2',
        username: 'u2',
        displayName: 'LateChatter',
        commentText: 'Hello',
        timestamp: 2000,
        isCorrect: false,
      },
    ];

    render(<ArenaCommentPanel comments={comments} />);

    // Switch to Top Comment tab
    const topTabBtn = screen.getByText('Top Comment').closest('button')!;
    fireEvent.click(topTabBtn);

    expect(screen.getByText('EarlyBird')).toBeDefined();
    expect(screen.getByText('🥇')).toBeDefined();
  });

  it('ArenaPillOptionButton has clean uniform colors and no right/wrong text', () => {
    const { container } = render(
      <ArenaPillOptionButton
        letter="B"
        text="Tokyo"
        isCorrect={true}
      />
    );

    // Displays letter and text
    expect(screen.getByText('B')).toBeDefined();
    expect(screen.getByText('Tokyo')).toBeDefined();

    // Must NOT contain "Đúng" or "Sai" text
    expect(container.textContent).not.toContain('Đúng');
    expect(container.textContent).not.toContain('Sai');
  });

  it('RoundResultModal renders timeout/reveal mode without marking as wrong when user did not answer', () => {
    render(
      <RoundResultModal
        result={{
          hasAnswered: false,
          isCorrect: false,
          correctAnswerLetter: 'B',
          correctAnswerText: 'Paris',
          earnedPoints: 0,
          basePoints: 700,
          speedBonus: 0,
          streakBonus: 0,
          roundMultiplier: 1,
          newStreak: 0,
        }}
      />
    );

    // Shows timeout / correct answer revelation
    expect(screen.getByText('HẾT THỜI GIAN - ĐÁP ÁN ĐÚNG')).toBeDefined();
    expect(screen.getByText('Paris')).toBeDefined();

    // Does NOT say CHƯA CHÍNH XÁC
    expect(screen.queryByText('CHƯA CHÍNH XÁC 💡')).toBeNull();
  });

  it('ArenaPillOptionButton renders percentVote and proportional wrap without truncation', () => {
    const { container } = render(
      <ArenaPillOptionButton
        letter="C"
        text="A very long detailed vocabulary answer explaining the comprehensive context of English usage"
        percentVote={42}
        isSelected={true}
      />
    );

    expect(screen.getByText('C')).toBeDefined();
    expect(screen.getByText('42%')).toBeDefined();
    expect(
      screen.getByText(
        'A very long detailed vocabulary answer explaining the comprehensive context of English usage'
      )
    ).toBeDefined();
    expect(container.innerHTML).toContain('break-words');
  });

  it('ArenaExplanationCard points directly to actual correct answer without hardcoded Paris fallback', () => {
    render(
      <ArenaExplanationCard
        correctLetter="D"
        correctText="Photosynthesis"
        explanation="The biochemical process by which green plants synthesize nutrients from carbon dioxide and water."
      />
    );

    expect(screen.getByText(/Đáp án đúng:/)).toBeDefined();
    expect(screen.getByText('D. Photosynthesis')).toBeDefined();
    expect(
      screen.getByText(/The biochemical process by which green plants synthesize nutrients/)
    ).toBeDefined();
    expect(screen.queryByText('Paris')).toBeNull();
  });

  it('ArenaBangVangCeremony renders top 4-10 table with user standing', () => {
    const players = [
      { rank: 1, displayName: 'Top1Player', avatar: '', score: 3000 },
      { rank: 2, displayName: 'Top2Player', avatar: '', score: 2500 },
      { rank: 3, displayName: 'Top3Player', avatar: '', score: 2000 },
      { rank: 4, displayName: 'Top4Player', avatar: '', score: 1800 },
      { rank: 5, displayName: 'Top5Player', avatar: '', score: 1500, isCurrentUser: true },
    ];

    render(
      <ArenaBangVangCeremony
        topPlayers={players}
        showTable4To10={true}
        countdownSec={15}
      />
    );

    // Bục Top 3
    expect(screen.getByText('Top1Player')).toBeDefined();
    expect(screen.getByText('Top2Player')).toBeDefined();
    expect(screen.getByText('Top3Player')).toBeDefined();

    // Top 4-10 Table
    expect(screen.getByText(/Bảng Vàng Đấu Thủ \(Top 4 - 10\)/)).toBeDefined();
    expect(screen.getByText('Top4Player')).toBeDefined();
    expect(screen.getByText('Top5Player')).toBeDefined();
    expect(screen.getByText('BẠN')).toBeDefined();
  });

  it('ArenaInGameHeader distinction: Live mode vs Study mode (No Eye, No Live in Study mode)', () => {
    // 1. Study Mode (Màn thường)
    const { unmount } = render(
      <ArenaInGameHeader
        isLive={false}
        remainingSeconds={10}
        score={1200}
        playerCount={8}
      />
    );

    expect(screen.getByText('PHÒNG ĐẤU')).toBeDefined();
    expect(screen.getByText('8')).toBeDefined();
    // In Study mode: NO LIVE badge, NO viewer count
    expect(screen.queryByText('LIVE')).toBeNull();
    unmount();

    // 2. Live Mode (Màn TikTok Live)
    render(
      <ArenaInGameHeader
        isLive={true}
        remainingSeconds={10}
        viewerCount="2.4K"
        score={1200}
      />
    );

    expect(screen.getByText('LIVE')).toBeDefined();
    expect(screen.getByText('2.4K')).toBeDefined();
    expect(screen.queryByText('PHÒNG ĐẤU')).toBeNull();
  });

  it('Option button distinction: Clickable in Study mode vs Spectator disabled in Live mode', () => {
    let selectedStudy = -1;
    // 1. Study Mode Option: Clickable, NO percent vote
    const { unmount } = render(
      <ArenaPillOptionButton
        letter="B"
        text="Collaborative"
        percentVote={undefined}
        disabled={false}
        onClick={() => {
          selectedStudy = 1;
        }}
      />
    );

    const btnStudy = screen.getByText('Collaborative').closest('button');
    expect(btnStudy).toBeDefined();
    expect(screen.queryByText('%')).toBeNull();
    fireEvent.click(btnStudy!);
    expect(selectedStudy).toBe(1);
    unmount();

    // 2. Live Mode Option: Disabled, HAS percent vote
    let selectedLive = -1;
    render(
      <ArenaPillOptionButton
        letter="B"
        text="Collaborative"
        percentVote={65}
        disabled={true}
        onClick={() => {
          selectedLive = 1;
        }}
      />
    );

    expect(screen.getByText('65%')).toBeDefined();
    const btnLive = screen.getByText('Collaborative').closest('button');
    expect(btnLive?.hasAttribute('disabled')).toBe(true);
    fireEvent.click(btnLive!);
    expect(selectedLive).toBe(-1); // Still -1 because it's disabled in Live mode
  });

  it('Comment list renders session score badge next to commenter display name', () => {
    const mockComments = [
      {
        eventId: 'cmt-1',
        username: 'viet_anh',
        displayName: 'Việt Anh',
        commentText: 'Chọn đáp án A nhé cả nhà',
        parsedOption: 'A',
        timestamp: Date.now() - 3000,
        scoreAdded: 30,
        totalScore: 90,
      },
      {
        eventId: 'cmt-2',
        username: 'lan_ngoc',
        displayName: 'Lan Ngọc',
        commentText: 'B đúng hơn chứ',
        parsedOption: 'B',
        timestamp: Date.now() - 1000,
        scoreAdded: 0,
        totalScore: 45,
      },
    ];

    render(
      <ArenaCommentPanel
        comments={mockComments}
        totalCommenters={2}
        isConnected={true}
        showAnnouncementTicker={false}
      />
    );

    // Verify display name and session score are both rendered
    expect(screen.getByText('Việt Anh')).toBeDefined();
    expect(screen.getByText('90đ')).toBeDefined();
    expect(screen.getByText('Lan Ngọc')).toBeDefined();
    expect(screen.getByText('45đ')).toBeDefined();
  });
});
