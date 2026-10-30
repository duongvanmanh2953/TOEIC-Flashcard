import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScriptType } from '@prisma/client';

export interface VerifyStrokeDto {
  strokeIndex: number;
  drawnPoints: Array<{ x: number; y: number }>;
  timeSpentMs?: number;
}

@Injectable()
export class ScriptsService {
  private readonly logger = new Logger(ScriptsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed initial characters for scripts (Hiragana, Kanji, Hanzi, Hangul) if empty
   */
  async seedInitialCharactersIfNeeded() {
    const count = await this.prisma.scriptSystem.count();
    if (count > 0) return;

    this.logger.log('Seeding initial scripts and character stroke data...');

    // 1. Japanese Hiragana
    await this.prisma.scriptSystem.create({
      data: {
        code: ScriptType.HIRAGANA,
        name: 'Japanese Hiragana (Bảng chữ cái Hiragana)',
        languageId: 'ja',
        description: 'Bảng chữ cái ngữ âm cơ bản nhất của tiếng Nhật gồm 46 ký tự chuẩn.',
        characters: {
          create: [
            {
              literal: 'あ',
              strokeCount: 3,
              readingsJson: { romaji: 'a' },
              meaningsJson: ['Ký tự A', 'Âm A'],
              svgPaths: [
                'M 300 280 L 720 280', // Nét 1: ngang
                'M 512 180 Q 500 500 480 820', // Nét 2: dọc hơi cong
                'M 420 420 C 320 460 260 620 360 720 C 460 820 720 800 760 600 C 800 420 580 340 420 420', // Nét 3: vòng cung lớn
              ],
            },
            {
              literal: 'い',
              strokeCount: 2,
              readingsJson: { romaji: 'i' },
              meaningsJson: ['Ký tự I', 'Âm I'],
              svgPaths: [
                'M 340 240 C 330 480 340 680 400 780 C 410 790 420 760 410 720', // Nét 1: cong trái có móc
                'M 680 340 C 690 480 670 600 640 680', // Nét 2: ngắn bên phải
              ],
            },
            {
              literal: 'う',
              strokeCount: 2,
              readingsJson: { romaji: 'u' },
              meaningsJson: ['Ký tự U', 'Âm U'],
              svgPaths: [
                'M 450 200 Q 520 220 580 280', // Nét 1: dấu phẩy trên
                'M 380 400 C 580 360 720 440 700 620 C 680 780 480 820 400 800', // Nét 2: vòng cung dưới
              ],
            },
          ],
        },
      },
    });

    // 2. Japanese Kanji (JLPT N5)
    await this.prisma.scriptSystem.create({
      data: {
        code: ScriptType.KANJI,
        name: 'Japanese Kanji JLPT N5',
        languageId: 'ja',
        description: 'Chữ Hán cơ bản thiết yếu trong kỳ thi tiếng Nhật JLPT N5.',
        characters: {
          create: [
            {
              literal: '日',
              strokeCount: 4,
              readingsJson: { on: ['ニチ', 'ジツ'], kun: ['ひ', '-び', '-か'] },
              meaningsJson: ['Mặt trời', 'Ngày', 'Nhật Bản'],
              radicals: '日 (nhật)',
              jlptOrHskLevel: 'N5',
              svgPaths: [
                'M 300 200 L 300 820', // Nét 1: sổ dọc trái
                'M 300 200 L 720 200 L 720 820', // Nét 2: ngang gập phải
                'M 300 500 L 720 500', // Nét 3: ngang giữa
                'M 300 820 L 720 820', // Nét 4: ngang đáy
              ],
            },
            {
              literal: '月',
              strokeCount: 4,
              readingsJson: { on: ['ゲツ', 'ガツ'], kun: ['つき'] },
              meaningsJson: ['Mặt trăng', 'Tháng'],
              radicals: '月 (nguyệt)',
              jlptOrHskLevel: 'N5',
              svgPaths: [
                'M 320 200 C 310 450 280 720 200 850', // Nét 1: phẩy trái
                'M 320 200 L 700 200 L 700 820 C 700 850 670 840 650 820', // Nét 2: ngang gập có móc
                'M 320 420 L 700 420', // Nét 3: ngang giữa
                'M 320 620 L 700 620', // Nét 4: ngang dưới
              ],
            },
            {
              literal: '水',
              strokeCount: 4,
              readingsJson: { on: ['スイ'], kun: ['みず'] },
              meaningsJson: ['Nước', 'Thủy'],
              radicals: '水 (thủy)',
              jlptOrHskLevel: 'N5',
              svgPaths: [
                'M 512 160 L 512 800 C 512 850 480 840 450 810', // Nét 1: sổ có móc
                'M 360 400 L 260 520', // Nét 2: phẩy trái
                'M 180 750 L 380 620', // Nét 3: hất lên
                'M 680 350 C 600 550 780 780 840 820', // Nét 4: mác phải
              ],
            },
          ],
        },
      },
    });

    // 3. Simplified Chinese Hanzi (HSK 1)
    await this.prisma.scriptSystem.create({
      data: {
        code: ScriptType.HANZI_SIMPLIFIED,
        name: 'Chinese Hanzi HSK 1 (Hán tự Giản thể)',
        languageId: 'zh',
        description: 'Hán tự căn bản theo hệ chuẩn HSK 1 với phiên âm Pinyin và thứ tự nét chuẩn.',
        characters: {
          create: [
            {
              literal: '人',
              strokeCount: 2,
              readingsJson: { pinyin: ['rén'] },
              meaningsJson: ['Người', 'Nhân loại'],
              jlptOrHskLevel: 'HSK1',
              svgPaths: [
                'M 512 180 C 480 400 360 680 200 820', // Nét 1: phẩy trái
                'M 460 460 C 560 620 700 750 840 820', // Nét 2: mác phải
              ],
            },
            {
              literal: '大',
              strokeCount: 3,
              readingsJson: { pinyin: ['dà'] },
              meaningsJson: ['Lớn', 'To', 'Đại'],
              jlptOrHskLevel: 'HSK1',
              svgPaths: [
                'M 200 400 L 824 400', // Nét 1: ngang
                'M 512 180 C 480 460 380 700 200 820', // Nét 2: phẩy
                'M 470 420 C 580 600 720 740 840 820', // Nét 3: mác
              ],
            },
          ],
        },
      },
    });

    this.logger.log('Scripts and initial stroke data seeding complete!');
  }

  /**
   * Get all script systems
   */
  async getScriptSystems() {
    await this.seedInitialCharactersIfNeeded();
    return this.prisma.scriptSystem.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { characters: true } },
      },
    });
  }

  /**
   * Get characters for a specific script system with user progress
   */
  async getCharactersByScript(scriptCode: string, userId?: string) {
    await this.seedInitialCharactersIfNeeded();

    const script = await this.prisma.scriptSystem.findFirst({
      where: {
        code: scriptCode.toUpperCase() as ScriptType,
      },
      include: {
        characters: {
          include: {
            userProgress: userId
              ? {
                  where: { userId },
                }
              : false,
          },
        },
      },
    });

    if (!script) {
      throw new NotFoundException(`Hệ chữ viết ${scriptCode} không tồn tại.`);
    }

    return {
      script: {
        id: script.id,
        code: script.code,
        name: script.name,
        languageId: script.languageId,
        description: script.description,
      },
      characters: script.characters.map((ch) => {
        const prog = ch.userProgress?.[0];
        return {
          id: ch.id,
          literal: ch.literal,
          strokeCount: ch.strokeCount,
          readings: ch.readingsJson,
          meanings: ch.meaningsJson,
          svgPaths: ch.svgPaths,
          radicals: ch.radicals,
          level: ch.jlptOrHskLevel,
          progress: prog
            ? {
                strokeAccuracy: prog.strokeAccuracy,
                practiceCount: prog.practiceCount,
                masteryScore: prog.masteryScore,
                lastPracticedAt: prog.lastPracticedAt,
              }
            : null,
        };
      }),
    };
  }

  /**
   * Helper: Parse rough endpoints and direction from an SVG path string
   */
  private parseSvgStrokeGeometry(pathStr: string, canvasSize: number = 500) {
    const coords = (pathStr.match(/[-+]?[0-9]*\.?[0-9]+/g) || []).map(Number);
    if (coords.length < 2) {
      return {
        startX: canvasSize / 2,
        startY: canvasSize / 2,
        endX: canvasSize / 2,
        endY: canvasSize / 2,
        dx: 0,
        dy: 0,
      };
    }
    const is1024 = /1024|[4-9]\d{2}/.test(pathStr);
    const authoringSize = is1024 ? 1024 : 109;
    const scale = canvasSize / authoringSize;

    const startX = coords[0] * scale;
    const startY = coords[1] * scale;
    const endX = (coords[coords.length - 2] ?? coords[0]) * scale;
    const endY = (coords[coords.length - 1] ?? coords[1]) * scale;

    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.hypot(dx, dy);

    return {
      startX,
      startY,
      endX,
      endY,
      dx: len > 0 ? dx / len : 0,
      dy: len > 0 ? dy / len : 0,
      length: len,
    };
  }

  /**
   * Verify and evaluate user handwriting stroke on canvas using authentic vector math
   */
  async verifyStroke(userId: string, characterId: string, strokeDto: VerifyStrokeDto) {
    const character = await this.prisma.characterData.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException(`Ký tự #${characterId} không tồn tại.`);
    }

    const { strokeIndex, drawnPoints } = strokeDto;

    // Validate points length
    if (!drawnPoints || drawnPoints.length < 2) {
      return {
        isValid: false,
        accuracy: 25,
        feedback: 'Nét vẽ quá ngắn hoặc chưa đủ dứt khoát. Hãy vẽ lại dứt khoát hơn!',
      };
    }

    const startPoint = drawnPoints[0];
    const endPoint = drawnPoints[drawnPoints.length - 1];
    const userDx = endPoint.x - startPoint.x;
    const userDy = endPoint.y - startPoint.y;
    const userLen = Math.hypot(userDx, userDy);

    const userNormDir = {
      dx: userLen > 0 ? userDx / userLen : 0,
      dy: userLen > 0 ? userDy / userLen : 0,
    };

    // Reference stroke path evaluation
    const refPathStr = character.svgPaths[strokeIndex] || character.svgPaths[0] || '';
    const refGeom = this.parseSvgStrokeGeometry(refPathStr, 500);

    // Direction vector cosine similarity [-1, 1]
    const cosSim = userNormDir.dx * refGeom.dx + userNormDir.dy * refGeom.dy;
    const isBackwards = cosSim < -0.2;
    const dirScore = Math.max(0, Math.min(100, Math.round(((cosSim + 1) / 2) * 100)));

    // Endpoints distance tolerance
    const canvasDiagonal = Math.hypot(500, 500);
    const startDist = Math.hypot(startPoint.x - refGeom.startX, startPoint.y - refGeom.startY);
    const endDist = Math.hypot(endPoint.x - refGeom.endX, endPoint.y - refGeom.endY);
    const normEndpointDist = (startDist + endDist) / 2 / canvasDiagonal;
    const endpointScore = Math.max(0, Math.min(100, Math.round((1 - normEndpointDist / 0.35) * 100)));

    // Length ratio score
    const lenRatio = refGeom.length > 0 ? Math.min(userLen, refGeom.length) / Math.max(userLen, refGeom.length) : 0.8;
    const lengthScore = Math.round(lenRatio * 100);

    // Deterministic synthesized accuracy (No Math.random)
    let accuracy = Math.round(endpointScore * 0.35 + dirScore * 0.4 + lengthScore * 0.25);
    if (isBackwards) {
      accuracy = Math.min(accuracy, 30);
    }

    const isValid = accuracy >= 70 && !isBackwards;

    // Update UserCharacterProgress based on authentic pre-morph accuracy
    const existing = await this.prisma.userCharacterProgress.findUnique({
      where: {
        userId_characterId: { userId, characterId },
      },
    });

    const currentMastery = existing ? existing.masteryScore : 0;
    const increment = isValid ? (accuracy >= 85 ? 12 : 7) : 2;
    const newMastery = Math.min(100, currentMastery + increment);

    await this.prisma.userCharacterProgress.upsert({
      where: {
        userId_characterId: { userId, characterId },
      },
      create: {
        userId,
        characterId,
        strokeAccuracy: accuracy,
        practiceCount: 1,
        masteryScore: newMastery,
        lastPracticedAt: new Date(),
      },
      update: {
        strokeAccuracy: accuracy,
        practiceCount: { increment: 1 },
        masteryScore: newMastery,
        lastPracticedAt: new Date(),
      },
    });

    let feedback = 'Nét vẽ rất chuẩn xác! Đúng thứ tự và hướng nét quy chuẩn.';
    if (isBackwards) {
      feedback = 'Nét vẽ bị ngược chiều! Bạn đang kéo ngược so với hướng chuẩn của nét.';
    } else if (endpointScore < 50) {
      feedback = 'Điểm đặt bút hoặc điểm nhấc bút còn lệch so với vị trí quy chuẩn.';
    } else if (!isValid) {
      feedback = 'Độ cong hoặc góc nghiêng của nét chưa đạt chuẩn. Hãy quan sát khung mẫu!';
    }

    return {
      isValid,
      accuracy,
      strokeIndex,
      isBackwards,
      feedback,
      newMastery,
      canSnapToReference: isValid && accuracy >= 75,
    };
  }

  /**
   * Record complete writing session attempt
   */
  async recordPracticeSession(
    userId: string,
    characterId: string,
    data: {
      preMorphScore: number;
      strokesCount: number;
      mistakesCount: number;
      mode: string;
    }
  ) {
    const character = await this.prisma.characterData.findUnique({
      where: { id: characterId },
    });
    if (!character) {
      throw new NotFoundException(`Ký tự #${characterId} không tồn tại.`);
    }

    const accuracy = Math.max(0, Math.min(100, Math.round(data.preMorphScore)));
    const isSuccess = accuracy >= 75 && data.mistakesCount === 0;

    const existing = await this.prisma.userCharacterProgress.findUnique({
      where: { userId_characterId: { userId, characterId } },
    });

    const currentMastery = existing?.masteryScore || 0;
    // Spaced repetition progression
    const bonus = isSuccess ? 15 : accuracy >= 60 ? 5 : 0;
    const newMastery = Math.min(100, currentMastery + bonus);

    const updated = await this.prisma.userCharacterProgress.upsert({
      where: { userId_characterId: { userId, characterId } },
      create: {
        userId,
        characterId,
        strokeAccuracy: accuracy,
        practiceCount: 1,
        masteryScore: newMastery,
        lastPracticedAt: new Date(),
      },
      update: {
        strokeAccuracy: accuracy,
        practiceCount: { increment: 1 },
        masteryScore: newMastery,
        lastPracticedAt: new Date(),
      },
    });

    return {
      success: true,
      masteryScore: updated.masteryScore,
      strokeAccuracy: updated.strokeAccuracy,
      practiceCount: updated.practiceCount,
      isSuccess,
    };
  }
}

