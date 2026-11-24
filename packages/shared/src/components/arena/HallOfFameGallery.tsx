import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Award, BookOpen, ChevronLeft, ChevronRight, CircleCheck, Compass, Crown, Flag, Flame,
  Gift, History, LockKeyhole, Medal, Radio, Shield, Swords, Target, Trophy, Zap,
} from 'lucide-react';
import type { GalleryAchievement, GalleryAwards, GalleryReward, GalleryStanding, GalleryStandings } from '../../index';
import { PlayerAvatar } from './PlayerAvatar';

type Track = 'live' | 'battle';
type Period = 'all-time' | 'weekly' | 'monthly';

interface GalleryApi {
  get<T>(path: string, signal: AbortSignal): Promise<T>;
  claim(id: string): Promise<GalleryReward>;
}

const API = '/games/hall-of-fame';
const number = new Intl.NumberFormat('vi-VN');
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' });
const deadline = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
const TRACK = {
  live: { title: 'Live Champions', subtitle: 'Vinh danh những người tham gia livestream', Icon: Radio },
  battle: { title: 'Battle Champions', subtitle: 'Vinh danh những chiến binh đấu trường', Icon: Swords },
};
const PLACES = [
  { rank: 1, name: 'Quán quân' },
  { rank: 2, name: 'Á quân' },
  { rank: 3, name: 'Hạng ba' },
];
const REWARD_STATUS = {
  AVAILABLE: 'Sẵn sàng nhận',
  CLAIMED: 'Đã nhận',
  EXPIRED: 'Đã hết hạn',
  LOCKED: 'Chưa mở khóa',
};

function useGalleryData<T>(api: GalleryApi, path: string | null) {
  const [state, setState] = useState<{ path: string; data?: T; failed?: boolean }>();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    api.get<T>(path, controller.signal).then(
      (data) => { if (!controller.signal.aborted) setState({ path, data }); },
      () => { if (!controller.signal.aborted) setState({ path, failed: true }); },
    );
    return () => controller.abort();
  }, [api, path, version]);

  return {
    data: state?.path === path ? state?.data : undefined,
    failed: state?.path === path && state?.failed,
    retry: () => { setState(undefined); setVersion((value) => value + 1); },
  };
}

function Cup() {
  return (
    <span className="hfg-cup" aria-hidden="true">
      <span className="hfg-cup-bowl"><span>V</span></span>
      <span className="hfg-cup-base" />
    </span>
  );
}

function Podium({ track, winners }: { track: Track; winners: GalleryStanding[] }) {
  return (
    <ol className="hfg-podium" aria-label={`Bục trao giải ${TRACK[track].title}`}>
      {PLACES.map(({ rank, name }) => {
        const player = winners.find((entry) => entry.rank === rank);
        return (
          <li key={rank} data-place={rank} data-empty={!player}>
            <div className="hfg-podium-person">
              {player ? (
                <PlayerAvatar avatarUrl={player.avatar} displayName={player.displayName} size="md" />
              ) : <div className="hfg-empty-avatar" aria-hidden="true"><Award size={20} /></div>}
              <span className="hfg-place-name">{name}</span>
              {player ? (
                <>
                  <strong title={track === 'live' ? `@${player.userId}` : player.displayName}>
                    {track === 'live' ? `@${player.userId}` : player.displayName}
                  </strong>
                  <b className="hfg-podium-score">{number.format(player.score)} <small>điểm</small></b>
                </>
              ) : <span className="hfg-open-place">Chưa có người</span>}
            </div>
            <div className="hfg-pedestal">
              {rank === 1 ? <Cup /> : <Medal aria-hidden="true" size={24} strokeWidth={1.35} />}
              <span aria-label={`Hạng ${rank}`}>0{rank}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Standings({ track, api }: { track: Track; api: GalleryApi }) {
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState<Period>('all-time');
  const { title, subtitle, Icon } = TRACK[track];
  const heading = useId();
  const scrollRegion = useRef<HTMLDivElement>(null);
  const live = track === 'live';
  const { data, failed, retry } = useGalleryData<GalleryStandings>(api, `${API}/${track}?period=${period}&page=${page}`);
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 10)));
  const [podium, setPodium] = useState<{ period: Period; players: GalleryStanding[] }>();
  useEffect(() => {
    if (data) setPodium({ period, players: data.podium });
  }, [data, period]);

  const goToPage = (nextPage: number) => {
    if (scrollRegion.current) scrollRegion.current.scrollTop = 0;
    setPage(nextPage);
  };

  return (
    <section className="hfg-standing" data-track={track} aria-labelledby={heading}>
      <header className="hfg-standing-head">
        <Icon size={21} strokeWidth={1.5} aria-hidden="true" />
        <div><h2 id={heading}>{title}</h2><p>{subtitle}</p></div>
      </header>
      <Podium track={track} winners={data?.podium ?? (podium?.period === period ? podium.players : [])} />
      <div className="hfg-ranking">
        <header><h3>Bảng xếp hạng</h3>
          <select aria-label={`Thời gian ${title}`} value={period}
            onChange={(event) => { setPeriod(event.target.value as Period); goToPage(1); }}>
            <option value="all-time">Toàn thời gian</option>
            <option value="weekly">7 ngày qua</option>
            <option value="monthly">30 ngày qua</option>
          </select>
        </header>
        <div className="hfg-table-scroll" role="region" aria-labelledby={heading} tabIndex={0} ref={scrollRegion}>
          <table aria-labelledby={heading}>
            <thead><tr><th scope="col">Hạng</th><th scope="col">{live ? 'TikTok' : 'Người chơi'}</th>
              <th scope="col">Điểm</th><th scope="col">{live ? 'Top 3' : 'Trận / Thắng'}</th>
              <th scope="col">{live ? 'Đúng' : 'Chính xác'}</th></tr></thead>
            <tbody>
              {data?.items.map((player) => (
                <tr key={player.userId} data-place={player.rank <= 3 ? player.rank : undefined}>
                  <td>{player.rank}</td>
                  <th scope="row"><div className="hfg-table-name">
                    <PlayerAvatar avatarUrl={player.avatar} displayName={player.displayName} size="xs" />
                    <span>{live ? `@${player.userId}` : player.displayName}</span>
                  </div></th>
                  <td>{number.format(player.score)}</td>
                  <td>{live ? player.speedPlacements ?? '–' : `${player.matches} / ${player.wins ?? '–'}`}</td>
                  <td>{live ? player.correctCount ?? '–' : player.accuracy == null ? '–' : `${player.accuracy}%`}</td>
                </tr>
              ))}
              {!data?.items.length && (
                <tr><td colSpan={5} className="hfg-table-state">
                  {failed ? <div role="alert">Không tải được bảng xếp hạng. <button onClick={retry}>Thử lại</button></div>
                    : !data ? <span role="status">Đang tải bảng xếp hạng…</span>
                    : data.total ? <button onClick={() => goToPage(1)}>Về trang đầu</button>
                    : live ? 'Chưa có kết quả TikTok Live trong thời gian này.'
                    : 'Chưa có kết quả Arena Battle trong thời gian này.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {(page > 1 || pageCount > 1) && (
          <nav aria-label={`Phân trang ${title}`}>
            <button type="button" aria-label="Trang trước" disabled={page <= 1 || !data}
              onClick={() => goToPage(page - 1)}><ChevronLeft size={17} /></button>
            <span aria-live="polite">{page} / {data ? pageCount : '–'}</span>
            <button type="button" aria-label="Trang sau" disabled={page >= pageCount || !data}
              onClick={() => goToPage(page + 1)}><ChevronRight size={17} /></button>
          </nav>
        )}
      </div>
    </section>
  );
}

const achievementArt = {
  'ri-flag-line': Flag,
  'ri-fire-line': Flame,
  'ri-flashlight-line': Zap,
  'ri-trophy-line': Trophy,
  'ri-book-line': BookOpen,
  'ri-book-read-line': BookOpen,
  'ri-compass-3-line': Compass,
  'ri-award-line': Award,
  CHAMPION_TOP_1: Crown,
  ACCURACY_SNIPER: Target,
} as const;

function AchievementCard({ achievement }: { achievement: GalleryAchievement }) {
  const Icon = achievementArt[achievement.code as keyof typeof achievementArt]
    ?? achievementArt[achievement.icon as keyof typeof achievementArt] ?? Medal;
  const condition = typeof achievement.condition === 'string' ? achievement.condition
    : typeof achievement.condition === 'object' && achievement.condition !== null
      ? Object.entries(achievement.condition).filter(([, value]) => ['number', 'string'].includes(typeof value))
        .map(([key, value]) => `${key.replace(/_/g, ' ')} · ${value}`).join(' / ')
      : null;
  return (
    <li className="hfg-achievement" data-unlocked={Boolean(achievement.unlockedAt)}>
      <span className="hfg-medallion"><Icon size={26} strokeWidth={1.5} aria-hidden="true" /></span>
      <div>
        <h4>{achievement.name}</h4>
        <p>{achievement.description}</p>
        {condition && <p>Điều kiện · {condition}</p>}
        <p className="hfg-achievement-source">VocabFlow · {achievement.unlockedAt ? date.format(new Date(achievement.unlockedAt)) : 'Chưa mở khóa'}</p>
      </div>
    </li>
  );
}

function RewardDetails({ reward, busy, message, onClose, onClaim }: {
  reward: GalleryReward;
  busy: boolean;
  message: string;
  onClose: () => void;
  onClaim: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog ref={dialog} className="hfg-dialog" aria-labelledby={title}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <span className="hfg-medallion"><Gift size={25} aria-hidden="true" /></span>
      <h3 id={title}>{reward.title}</h3>
      <p className="hfg-event">{reward.category} · {reward.eventName}</p>
      <p>{reward.description}</p>
      <dl>
        <dt>Phần thưởng</dt><dd>{reward.details}</dd>
        <dt>Điều kiện nhận</dt><dd>{reward.conditions}</dd>
        {reward.expiresAt && <><dt>Hạn nhận</dt><dd>{deadline.format(new Date(reward.expiresAt))}</dd></>}
        <dt>Trạng thái</dt><dd>{REWARD_STATUS[reward.status]}</dd>
      </dl>
      {message && <p role="alert">{message}</p>}
      <footer>
        <button type="button" onClick={onClose} disabled={busy}>Đóng</button>
        {reward.status === 'AVAILABLE' && <button type="button" data-primary onClick={onClaim} disabled={busy}>
          {busy ? 'Đang xác nhận…' : 'Xác nhận nhận thưởng'}
        </button>}
      </footer>
    </dialog>
  );
}

function AwardState({ text, icon: Icon = LockKeyhole }: { text: string; icon?: typeof Trophy }) {
  return <div className="hfg-award-empty"><Icon size={24} strokeWidth={1.4} aria-hidden="true" /><p>{text}</p></div>;
}

function Awards({ api, userId, onSignIn }: { api: GalleryApi; userId?: string; onSignIn: () => void }) {
  const { data, failed, retry } = useGalleryData<GalleryAwards>(api, userId ? `${API}/awards` : null);
  const [confirmed, setConfirmed] = useState<Record<string, GalleryReward>>({});
  const [selected, setSelected] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const processing = useRef(false);
  const heading = useId();
  const rewards = (data?.rewards ?? []).map((reward) => confirmed[reward.id] ?? reward);
  const history = rewards.filter((reward) => reward.status === 'CLAIMED' && reward.claimedAt)
    .sort((a, b) => Date.parse(b.claimedAt!) - Date.parse(a.claimedAt!));
  const reward = rewards.find(({ id }) => id === selected);
  const unavailable = !userId ? 'Đăng nhập để xem hồ sơ vinh danh của bạn.'
    : failed ? 'Không tải được hồ sơ vinh danh.' : data ? '' : 'Đang tải hồ sơ vinh danh…';

  const claimReward = async () => {
    if (!reward || reward.status !== 'AVAILABLE' || processing.current) return;
    processing.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await api.claim(reward.id);
      if (result.id !== reward.id || result.status !== 'CLAIMED' || !result.claimedAt) {
        throw new Error('Claim was not confirmed');
      }
      setConfirmed((previous) => ({ ...previous, [result.id]: result }));
      setSelected(undefined);
    } catch {
      const refreshed = await api.get<GalleryAwards>(`${API}/awards`, AbortSignal.timeout(8000)).catch(() => null);
      const saved = refreshed?.rewards.find(({ id }) => id === reward.id);
      if (saved) setConfirmed((previous) => ({ ...previous, [saved.id]: saved }));
      if (saved?.status === 'CLAIMED' && saved.claimedAt) setSelected(undefined);
      else setMessage(saved?.status === 'EXPIRED'
        ? 'Phần thưởng đã hết hạn nhận.'
        : 'Chưa thể xác nhận nhận thưởng. Vui lòng thử lại.');
    } finally {
      setBusy(false);
      processing.current = false;
    }
  };

  return (
    <section className="hfg-awards" aria-labelledby={heading}>
      <header className="hfg-awards-head">
        <span className="hfg-medallion"><Award size={30} strokeWidth={1.5} aria-hidden="true" /></span>
        <div><h2 id={heading}>Awards &amp; Rewards</h2><p>Phần thưởng và bộ sưu tập thành tích</p></div>
        {!userId && <button type="button" data-primary onClick={onSignIn}>Đăng nhập</button>}
        {failed && <button type="button" onClick={retry}>Tải lại</button>}
      </header>
      {failed && <p className="hfg-feedback" role="alert">{unavailable}</p>}
      {userId && !data && !failed && <p className="hfg-feedback" role="status">{unavailable}</p>}

      <section className="hfg-award-panel">
        <h3><Gift size={17} aria-hidden="true" /> Your Rewards</h3>
        {rewards.length ? (
          <ul className="hfg-rewards-grid">
            {rewards.map((item) => (
              <li className="hfg-reward" key={item.id}>
                <span className="hfg-medallion">{item.category === 'LIVE'
                  ? <Radio size={23} aria-hidden="true" /> : <Shield size={23} aria-hidden="true" />}</span>
                <div className="hfg-reward-meta"><span>{item.category}</span>
                  <span data-status={item.status}>{REWARD_STATUS[item.status]}</span></div>
                <h4>{item.title}</h4>
                <p className="hfg-event">{item.eventName}</p>
                <p>{item.description}</p>
                <p className="hfg-reward-details">{item.details}</p>
                {item.expiresAt && <p>Hạn nhận · {deadline.format(new Date(item.expiresAt))}</p>}
                <button type="button" data-primary={item.status === 'AVAILABLE' || undefined}
                  onClick={() => { setSelected(item.id); setMessage(''); }}>
                  {item.status === 'AVAILABLE' ? 'Nhận giải thưởng' : 'Xem chi tiết'}
                </button>
              </li>
            ))}
          </ul>
        ) : <AwardState text={(!userId ? 'Đăng nhập để xem phần thưởng dành cho bạn.' : unavailable) || 'Hiện chưa có phần thưởng dành cho bạn.'} />}
      </section>

      <div className="hfg-awards-grid">
        <section className="hfg-award-panel">
          <h3><Medal size={17} aria-hidden="true" /> My Achievements</h3>
          {data?.achievements.length ? (
            <>
              {!data.achievements.some((item) => item.unlockedAt) && <p className="hfg-case-note">Bạn chưa mở khóa thành tích nào.</p>}
              <ul className="hfg-achievements">{data.achievements.map((item) => <AchievementCard key={item.id} achievement={item} />)}</ul>
            </>
          ) : <AwardState icon={Medal} text={(!userId ? 'Đăng nhập để xem bộ sưu tập của bạn.' : unavailable) || 'Bộ sưu tập của bạn chưa có thành tích.'} />}
        </section>
        <section className="hfg-award-panel">
          <h3><History size={17} aria-hidden="true" /> Award History</h3>
          {history.length ? (
            <ul className="hfg-history">
              {history.map((item) => (
                <li key={item.id}>
                  <CircleCheck size={18} aria-hidden="true" />
                  <div><h4>{item.title}</h4><p>{item.category} · {item.eventName}</p></div>
                  <div><time dateTime={item.claimedAt ?? undefined}>{date.format(new Date(item.claimedAt!))}</time><p>Đã nhận</p></div>
                </li>
              ))}
            </ul>
          ) : <AwardState icon={History} text={(!userId ? 'Đăng nhập để xem lịch sử nhận thưởng.' : unavailable) || 'Chưa ghi nhận giải thưởng đã nhận.'} />}
        </section>
      </div>
      {reward && <RewardDetails key={reward.id} reward={reward} busy={busy} message={message}
        onClose={() => setSelected(undefined)} onClaim={claimReward} />}
    </section>
  );
}

export function HallOfFameGallery({ api, userId, onSignIn }: {
  api: GalleryApi;
  userId?: string;
  onSignIn: () => void;
}) {
  return (
    <div className="hfg">
      <header className="hfg-hero">
        <div className="hfg-crest"><Cup /></div>
        <p className="hfg-brand">VocabFlow <span>Hall of Fame</span></p>
        <h1>Bảng Vàng</h1>
        <p className="hfg-subtitle">Vinh danh những nhà vô địch</p>
        <p className="hfg-tagline">Mỗi thành tích là một dấu ấn. Mỗi chiến thắng là một niềm tự hào.</p>
      </header>
      <div className="hfg-gallery">
        <div className="hfg-standings"><Standings track="live" api={api} /><Standings track="battle" api={api} /></div>
        <Awards key={userId ?? 'guest'} api={api} userId={userId} onSignIn={onSignIn} />
      </div>
    </div>
  );
}
