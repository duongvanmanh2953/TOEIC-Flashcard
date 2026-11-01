import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CandidateSkillRecord,
  CandidateSkillMasteryStatus,
  UserInterviewLearningProfileDto,
  InterviewJobBrief,
} from './interview.shared';

@Injectable()
export class InterviewLearningService {
  private readonly logger = new Logger(InterviewLearningService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves or initializes the user's interview learning profile
   */
  async getOrCreateProfile(userId: string): Promise<UserInterviewLearningProfileDto> {
    const existing = await this.prisma.interviewLearningProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      return {
        userId: existing.userId,
        careerFocus: existing.careerFocus || 'Software Engineering',
        targetSeniority: existing.targetSeniority || 'Mid-level',
        skills: (existing.skillsMatrixJson as any) || [],
        communicationPatterns: existing.communicationPatterns || [],
        languageLearningNeeds: existing.languageNeeds || [],
        totalSessions: existing.totalSessions,
        lastSessionAt: existing.lastSessionAt?.toISOString(),
        personalizationEnabled: existing.personalizationEnabled,
      };
    }

    const created = await this.prisma.interviewLearningProfile.create({
      data: {
        userId,
        careerFocus: 'Software Engineering',
        targetSeniority: 'Mid-level',
        skillsMatrixJson: [],
        communicationPatterns: [],
        languageNeeds: [],
        totalSessions: 0,
        personalizationEnabled: true,
      },
    });

    return {
      userId: created.userId,
      careerFocus: created.careerFocus || 'Software Engineering',
      targetSeniority: created.targetSeniority || 'Mid-level',
      skills: [],
      communicationPatterns: [],
      languageLearningNeeds: [],
      totalSessions: 0,
      personalizationEnabled: true,
    };
  }

  /**
   * Updates candidate learning progress after an interview turn or completed session
   */
  async recordTurnEvidence(
    userId: string,
    sessionId: string,
    turnNumber: number,
    turnResult: {
      demonstratedCompetencies: string[];
      missingEvidence: string[];
      technicalScore: number;
    },
    jobBrief?: InterviewJobBrief | null
  ) {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.personalizationEnabled) return;

    const skillsMap = new Map<string, CandidateSkillRecord>();
    for (const s of profile.skills || []) {
      skillsMap.set(s.name.toLowerCase(), { ...s });
    }

    // 1. Process demonstrated competencies
    for (const comp of turnResult.demonstratedCompetencies || []) {
      const key = comp.toLowerCase();
      const existing = skillsMap.get(key) || {
        name: comp,
        category: 'Technical',
        status: 'not_assessed' as CandidateSkillMasteryStatus,
        confidence: 0.5,
        evidenceCount: 0,
        strengths: [],
        weaknesses: [],
      };

      existing.evidenceCount += 1;
      existing.lastAssessedTurn = turnNumber;
      existing.lastAssessedSessionId = sessionId;

      // Adjust status based on score and evidence count
      if (turnResult.technicalScore >= 80) {
        existing.confidence = Math.min(1.0, existing.confidence + 0.15);
        existing.status = existing.confidence >= 0.85 ? 'strong' : 'demonstrated';
        if (!existing.strengths.includes('Clear technical explanation')) {
          existing.strengths.push('Clear technical explanation');
        }
      } else {
        existing.confidence = Math.max(0.4, existing.confidence + 0.05);
        existing.status = 'developing';
      }

      skillsMap.set(key, existing);
    }

    // 2. Process missing evidence (e.g. metrics, invalidation)
    for (const missing of turnResult.missingEvidence || []) {
      const lower = missing.toLowerCase();
      for (const [key, skill] of skillsMap.entries()) {
        if (lower.includes(key)) {
          if (!skill.weaknesses.includes(missing)) {
            skill.weaknesses.push(missing);
          }
          if (skill.status === 'demonstrated') {
            skill.status = 'developing';
          }
        }
      }
    }

    // 3. Update learning profile record
    const updatedSkills = Array.from(skillsMap.values());
    await this.prisma.interviewLearningProfile.update({
      where: { userId },
      data: {
        skillsMatrixJson: updatedSkills as any,
        careerFocus: jobBrief?.jobTitle || profile.careerFocus,
        targetSeniority: jobBrief?.seniority || profile.targetSeniority,
      },
    });
  }

  /**
   * Finalizes session learning metrics upon session completion
   */
  async finalizeSessionLearning(
    userId: string,
    session: any,
    evaluation: any
  ) {
    const profile = await this.getOrCreateProfile(userId);
    if (!profile.personalizationEnabled) return;

    const communicationPatterns = [...profile.communicationPatterns];
    if (evaluation?.weaknesses) {
      for (const w of evaluation.weaknesses) {
        if (!communicationPatterns.includes(w)) {
          communicationPatterns.push(w);
        }
      }
    }

    const languageNeeds = [...profile.languageLearningNeeds];
    if (session.supportLanguageId !== session.languageId && !languageNeeds.includes(`Spoken fluency in ${session.languageId}`)) {
      languageNeeds.push(`Spoken fluency in ${session.languageId}`);
    }

    await this.prisma.interviewLearningProfile.update({
      where: { userId },
      data: {
        totalSessions: { increment: 1 },
        lastSessionAt: new Date(),
        communicationPatterns: communicationPatterns.slice(0, 10),
        languageNeeds: languageNeeds.slice(0, 10),
      },
    });
  }

  /**
   * Resets candidate learning history for privacy and reset preference (Task 7.4)
   */
  async resetProfile(userId: string) {
    return this.prisma.interviewLearningProfile.upsert({
      where: { userId },
      create: {
        userId,
        skillsMatrixJson: [],
        communicationPatterns: [],
        languageNeeds: [],
        totalSessions: 0,
        personalizationEnabled: true,
      },
      update: {
        skillsMatrixJson: [],
        communicationPatterns: [],
        languageNeeds: [],
        totalSessions: 0,
        lastSessionAt: null,
      },
    });
  }

  /**
   * User toggles adaptive personalization ON / OFF
   */
  async setPersonalizationEnabled(userId: string, enabled: boolean) {
    return this.prisma.interviewLearningProfile.upsert({
      where: { userId },
      create: {
        userId,
        personalizationEnabled: enabled,
      },
      update: {
        personalizationEnabled: enabled,
      },
    });
  }
}
