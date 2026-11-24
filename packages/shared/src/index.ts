/**
 * @vocabflow/shared - Shared types, domain contracts & auth specifications
 */

export enum Role {
  USER = 'USER',
  PREMIUM_USER = 'PREMIUM_USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  deviceId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserSummary {
  id: string;
  email: string;
  name?: string;
  role: Role;
  avatarUrl?: string;
  isGuest?: boolean;
}

export interface GameAssetItem {
  id: string;
  category: string;
  name: string;
  nameVi: string;
  thumbnail: string;
  image: string;
}

export interface GameAssetManifest {
  version: number;
  generatedAt: number;
  totalItems: number;
  categories: string[];
  items: GameAssetItem[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export * from './components/VocabFlowLogo';
export * from './components/TikTokLogo';
export * from './components/VictoryStarModal';
export * from './components/AppSplashScreen';
export * from './config/languageStandards';
export * from './config/languageCapabilities';
export { default as enTranslations } from './locales/en.json';
export { default as viTranslations } from './locales/vi.json';
export * from './interview';
export * from './utils/feedbackSound';
export * from './arena/arenaTheme';
export * from './arena/scoringEngine';
export * from './components/arena';
export * from './config/curriculumData';


export { HallOfFame } from './components/arena/HallOfFame';

export interface ChampionshipPlayer {
  userId: string;
  displayName: string;
  avatar?: string;
  rank: number;
  score: number;
  correctCount?: number;
  answeredCount?: number;
  username?: string;
  speedPlacements?: number;
}

export interface ChampionshipResult {
  roomCode: string;
  ranking: ChampionshipPlayer[];
  inAppRanking?: ChampionshipPlayer[];
  commenterRanking?: ChampionshipPlayer[];
  playedRounds?: number;
  totalParticipants?: number;
  durationMs?: number;
  celebrationDurationSec?: number;
}

export interface GalleryStanding {
  rank: number;
  userId: string;
  displayName: string;
  avatar: string | null;
  score: number;
  matches: number;
  accuracy?: number | null;
  wins?: number;
  correctCount?: number;
  speedPlacements?: number;
}

export interface GalleryStandings {
  page: number;
  pageSize: number;
  total: number;
  podium: GalleryStanding[];
  items: GalleryStanding[];
}

export interface GalleryReward {
  id: string;
  category: 'LIVE' | 'BATTLE';
  title: string;
  eventName: string;
  description: string;
  details: string;
  conditions: string;
  expiresAt: string | null;
  claimedAt: string | null;
  status: 'AVAILABLE' | 'CLAIMED' | 'EXPIRED' | 'LOCKED';
}

export interface GalleryAchievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  condition?: unknown;
  unlockedAt: string | null;
}

export interface GalleryAwards {
  rewards: GalleryReward[];
  achievements: GalleryAchievement[];
}
