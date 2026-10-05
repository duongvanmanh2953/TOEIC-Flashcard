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
export * from './config/languageStandards';
export { default as enTranslations } from './locales/en.json';
export { default as viTranslations } from './locales/vi.json';
