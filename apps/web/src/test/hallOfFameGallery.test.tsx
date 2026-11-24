// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HallOfFameGallery } from '@vocabflow/shared/src/components/arena/HallOfFameGallery';
import type { GalleryAwards, GalleryReward, GalleryStandings } from '@vocabflow/shared';

const EMPTY: GalleryStandings = { podium: [], items: [], page: 1, pageSize: 10, total: 0 };
const REWARD: GalleryReward = {
  id: 'earned', title: 'Cúp Nhà Vô Địch', category: 'LIVE', eventName: 'Mùa Thu',
  description: 'Giải đấu tiếng Anh', details: 'Cúp lưu niệm', conditions: 'Hoàn thành trận chung kết',
  expiresAt: null, claimedAt: null, status: 'AVAILABLE',
};

const getEmpty = async <T,>(path: string) =>
  (path.endsWith('/awards') ? { rewards: [], achievements: [] } : EMPTY) as T;

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

describe('Permanent Hall of Fame', () => {
  afterEach(cleanup);
  it('keeps both three-slot podiums and the award cases visible across loading, empty and error states', async () => {
    const standings = deferred<GalleryStandings>();
    const awards = deferred<GalleryAwards>();
    const get = async <T,>(path: string) => {
      if (path.includes('/battle')) throw new Error('offline');
      return (path.endsWith('/awards') ? awards.promise : standings.promise) as Promise<T>;
    };
    render(<HallOfFameGallery api={{ get, claim: vi.fn() }} userId="player" onSignIn={vi.fn()} />);
    expect(screen.getAllByRole('status')).toHaveLength(3);
    for (const title of ['Live Champions', 'Battle Champions']) {
      expect(within(screen.getByRole('list', { name: `Bục trao giải ${title}` })).getAllByRole('listitem')).toHaveLength(3);
    }
    for (const title of ['Awards & Rewards', 'Your Rewards', 'My Achievements', 'Award History']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    await act(async () => {
      standings.resolve(EMPTY);
      awards.resolve({ rewards: [], achievements: [] });
    });
    expect(screen.getByText(/Chưa có kết quả TikTok Live/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Không tải được bảng xếp hạng');
    expect(screen.getByText('Hiện chưa có phần thưởng dành cho bạn.')).toBeInTheDocument();
    expect(screen.getByText('Chưa ghi nhận giải thưởng đã nhận.')).toBeInTheDocument();
  });

  it('loads and filters independent standings without affecting the other podium', async () => {
    const live = { rank: 1, userId: 'minhtiktok', score: 85, matches: 3, displayName: 'Minh', avatar: null };
    const battle = { rank: 1, userId: 'arena', score: 325, matches: 4, displayName: 'Minh', avatar: null };
    const requests = vi.fn();
    const get = async <T,>(path: string): Promise<T> => {
      requests(path);
      const winner = path.includes('/live?') ? live : battle;
      return { ...EMPTY, total: 1, podium: [winner], items: [winner] } as T;
    };
    render(<HallOfFameGallery api={{ get, claim: vi.fn() }} onSignIn={vi.fn()} />);
    const liveTable = await screen.findByRole('table', { name: 'Live Champions' });
    const battleTable = await screen.findByRole('table', { name: 'Battle Champions' });
    await within(liveTable).findByText('@minhtiktok');
    await within(battleTable).findByText('325');
    expect(within(liveTable).queryByText('325')).toBeNull();
    expect(within(battleTable).queryByText('@minhtiktok')).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Thời gian Live Champions' }), { target: { value: 'weekly' } });
    await waitFor(() => expect(requests.mock.calls.some(([path]) => path.includes('/live?period=weekly'))).toBe(true));
    expect(requests.mock.calls.filter(([path]) => path.includes('/battle?'))).toHaveLength(1);
  });

  it('shows available, expired and locked awards and writes history only after confirmation', async () => {
    const claimedAt = '2026-11-24T09:00:00.000Z';
    const claimed = deferred<GalleryReward>();
    const claim = vi.fn(() => claimed.promise);
    const get = async <T,>(path: string, signal: AbortSignal): Promise<T> => path.endsWith('/awards') ? {
      rewards: [
        REWARD,
        { ...REWARD, id: 'expired', title: 'Cúp đã hết hạn', status: 'EXPIRED' },
        { ...REWARD, id: 'locked', title: 'Cúp đang khóa', status: 'LOCKED' },
      ],
      achievements: [],
    } as T : getEmpty<T>(path);
    render(<HallOfFameGallery api={{ get, claim }} userId="player" onSignIn={vi.fn()} />);
    await screen.findByText('Đã hết hạn');
    expect(screen.getByText('Chưa mở khóa')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Nhận giải thưởng' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Hoàn thành trận chung kết')).toBeInTheDocument();
    const confirm = within(dialog).getByRole('button', { name: 'Xác nhận nhận thưởng' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(claim).toHaveBeenCalledExactlyOnceWith(REWARD.id);
    expect(screen.getByText('Chưa ghi nhận giải thưởng đã nhận.')).toBeInTheDocument();

    await act(async () => claimed.resolve({ ...REWARD, claimedAt, status: 'CLAIMED' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    const history = screen.getByRole('heading', { name: 'Award History' }).closest('section')!;
    expect(within(history).getByText(REWARD.title)).toBeInTheDocument();
    expect(within(history).getByText('Đã nhận')).toBeInTheDocument();
  });
});
