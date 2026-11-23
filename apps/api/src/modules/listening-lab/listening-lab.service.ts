import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LISTENING_TRACKS, ListeningTrack } from './listening-data';

export interface SubmitActiveListeningDto {
  audioId: string;
  languageId?: string;
  durationSeconds: number;
  playedSeconds: number;
  comprehensionScore: number; // 0 - 100
  dictationAccuracy?: number; // 0 - 100
  shadowingScore?: number;
  transcriptRevealed?: boolean;
  capturedWords?: string[];
  weakPoints?: any;
}

export interface TrackPassivePlaybackDto {
  audioId: string;
  languageId?: string;
  durationSeconds: number;
  playedSeconds: number;
  isCompleted?: boolean;
}

export interface RecordFocusSessionDto {
  targetMinutes: number;
  actualMinutes: number;
  selectedTasks?: string[];
  completedTasks?: string[];
  status?: string; // COMPLETED, EARLY_EXIT, PAUSED
  notes?: string;
}

@Injectable()
export class ListeningLabService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all listening tracks filtered by language and mode
   */
  async getTracks(languageId: string = 'en', mode?: 'ACTIVE' | 'PASSIVE') {
    const lang = (languageId || 'en').toLowerCase();
    let tracks = LISTENING_TRACKS.filter((t) => t.languageId === lang);

    if (tracks.length === 0) {
      tracks = LISTENING_TRACKS.filter((t) => t.languageId === 'en');
    }

    if (mode === 'ACTIVE') {
      return tracks.filter((t) => t.segments.length > 0 && t.quizzes.length > 0);
    } else if (mode === 'PASSIVE') {
      return tracks.filter((t) => t.category === 'IMMERSION' || t.category === 'SLEEP' || t.category === 'PODCAST');
    }

    return tracks;
  }

  /**
   * Get track details by ID
   */
  async getTrackById(id: string): Promise<ListeningTrack> {
    const track = LISTENING_TRACKS.find((t) => t.id === id);
    if (!track) {
      throw new NotFoundException(`Không tìm thấy bài nghe mã ${id}`);
    }
    return track;
  }

  /**
   * Submit Active Listening Session
   * Saves to UserListeningSession and updates user's listening mastery in profile
   */
  async submitActiveListening(userId: string, dto: SubmitActiveListeningDto) {
    const track = LISTENING_TRACKS.find((t) => t.id === dto.audioId);
    const audioTitle = track ? track.title : 'Active Listening Session';
    const audioCategory = track ? track.category : 'CONVERSATION';
    const lang = (dto.languageId || track?.languageId || 'en').toLowerCase();

    const session = await this.prisma.userListeningSession.create({
      data: {
        userId,
        languageId: lang,
        mode: 'ACTIVE',
        audioId: dto.audioId,
        audioTitle,
        audioCategory,
        durationSeconds: dto.durationSeconds,
        playedSeconds: dto.playedSeconds,
        comprehensionScore: dto.comprehensionScore,
        dictationAccuracy: dto.dictationAccuracy || null,
        shadowingScore: dto.shadowingScore || null,
        isCompleted: true,
        exposureOnly: false,
        transcriptRevealed: !!dto.transcriptRevealed,
        capturedWords: dto.capturedWords || [],
        weakPoints: dto.weakPoints || null,
      },
    });

    // Update listening assessment in LearningProfile
    const profile = await this.prisma.learningProfile.findUnique({
      where: { userId_languageId: { userId, languageId: lang } },
    });

    if (profile) {
      const skills = (profile.skillAssessments as Record<string, any>) || {};
      const prevListening = skills.listening || { score: 60, confidence: 0.5 };
      const newScore = Math.round(prevListening.score * 0.7 + dto.comprehensionScore * 0.3);

      await this.prisma.learningProfile.update({
        where: { id: profile.id },
        data: {
          skillAssessments: {
            ...skills,
            listening: {
              status: 'ASSESSED',
              score: newScore,
              confidence: Math.min(1.0, (prevListening.confidence || 0.5) + 0.1),
            },
          },
        },
      });
    }

    return {
      success: true,
      sessionId: session.id,
      comprehensionScore: dto.comprehensionScore,
      dictationAccuracy: dto.dictationAccuracy,
      message: 'Đã ghi nhận kết quả luyện nghe chủ động vào hồ sơ năng lực.',
    };
  }

  /**
   * Record Passive Immersion playback
   * Ghi nhận exposure, strictly avoids granting false active mastery
   */
  async trackPassivePlayback(userId: string, dto: TrackPassivePlaybackDto) {
    const track = LISTENING_TRACKS.find((t) => t.id === dto.audioId);
    const audioTitle = track ? track.title : 'Passive Immersion Audio';
    const audioCategory = track ? track.category : 'IMMERSION';
    const lang = (dto.languageId || track?.languageId || 'en').toLowerCase();

    // Prevent duplicate spam if playedSeconds is negligible (< 5s)
    if (dto.playedSeconds < 5) {
      return { success: false, reason: 'Thời gian nghe quá ngắn để ghi nhận' };
    }

    const session = await this.prisma.userListeningSession.create({
      data: {
        userId,
        languageId: lang,
        mode: 'PASSIVE',
        audioId: dto.audioId,
        audioTitle,
        audioCategory,
        durationSeconds: dto.durationSeconds,
        playedSeconds: dto.playedSeconds,
        isCompleted: !!dto.isCompleted,
        exposureOnly: true,
      },
    });

    return {
      success: true,
      sessionId: session.id,
      exposureSeconds: dto.playedSeconds,
    };
  }

  /**
   * Record a Deep Focus session
   */
  async recordFocusSession(userId: string, dto: RecordFocusSessionDto) {
    const session = await this.prisma.userFocusSession.create({
      data: {
        userId,
        targetMinutes: dto.targetMinutes,
        actualMinutes: dto.actualMinutes,
        selectedTasks: dto.selectedTasks || [],
        completedTasks: dto.completedTasks || [],
        status: dto.status || 'COMPLETED',
        notes: dto.notes,
      },
    });

    return {
      success: true,
      session,
    };
  }

  /**
   * Get overall listening lab analytics
   */
  async getListeningStats(userId: string, languageId: string = 'en') {
    const lang = (languageId || 'en').toLowerCase();
    const sessions = await this.prisma.userListeningSession.findMany({
      where: { userId, languageId: lang },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const focusSessions = await this.prisma.userFocusSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    let activeSeconds = 0;
    let passiveSeconds = 0;
    let activeScoreSum = 0;
    let activeScoreCount = 0;
    let sentencesPracticed = 0;

    sessions.forEach((s) => {
      if (s.mode === 'ACTIVE') {
        activeSeconds += s.playedSeconds;
        if (s.comprehensionScore !== null && s.comprehensionScore !== undefined) {
          activeScoreSum += s.comprehensionScore;
          activeScoreCount++;
        }
        sentencesPracticed += 4;
      } else {
        passiveSeconds += s.playedSeconds;
      }
    });

    const averageComprehension = activeScoreCount > 0 ? Math.round(activeScoreSum / activeScoreCount) : 85;

    // Word of the Day for lock screen vocabulary
    const wordOfTheDay = {
      word: 'Resilience',
      ipa: '/rɪˈzɪl.jəns/',
      meaning: 'Khả năng phục hồi, kiên cường vượt qua thử thách',
      example: 'The team showed great resilience during the challenging phase.',
      level: 'B2',
    };

    return {
      activeListeningMinutes: Math.round(activeSeconds / 60),
      passiveExposureMinutes: Math.round(passiveSeconds / 60),
      averageComprehensionAccuracy: averageComprehension,
      totalSessionsCount: sessions.length,
      sentencesPracticed,
      totalFocusMinutes: Math.round(focusSessions.reduce((acc, f) => acc + f.actualMinutes, 0)),
      completedFocusCount: focusSessions.filter((f) => f.status === 'COMPLETED').length,
      wordOfTheDay,
      recentSessions: sessions.slice(0, 5),
    };
  }
}
