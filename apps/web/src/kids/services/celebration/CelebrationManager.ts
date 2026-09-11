/**
 * CelebrationManager.ts
 * Unified Celebration & Encouragement System for Kids English Learning System
 * - Child-friendly Vietnamese praises randomized from pool
 * - Web Audio API synthesized applause, cheers, fanfares & chimes
 * - Web Speech API Vietnamese greeting & praise voice
 * - Event bus for confetti & mascot animations
 */

import { kidsSound } from '../sound/KidsSoundManager';
import { kidsSpeech } from '../speech/KidsSpeechManager';

export type CelebrationTier =
  | 'small'         // Quick correct answer
  | 'good'          // Multi-step streak or high score
  | 'lessonComplete'// Finished entire lesson
  | 'levelUp'       // Gained level or unlocked new world
  | 'gameWin';      // Won mini-game

export interface CelebrationEvent {
  tier: CelebrationTier;
  praiseVi: string;
  confetti: boolean;
  soundType: 'correct' | 'celebration' | 'fanfare' | 'applause';
}

const VIETNAMESE_PRAISES_SMALL = [
  'Đúng rồi!',
  'Giỏi lắm bé ơi!',
  'Hay quá!',
  'Chuẩn luôn!',
  'Tuyệt vời!',
  'Bé thông minh quá!',
];

const VIETNAMESE_PRAISES_BIG = [
  'Yeahhh! Bé giỏi quá!',
  'Xuất sắc! Bé làm được rồi!',
  'Tuyệt vời quá đi thôi!',
  'Chiến thắng rồi! Hoan hô bé!',
  'Bé đỉnh thật đấy! Xuất sắc!',
  'Ôi, tuyệt quá! Bé giỏi quá chừng!',
  'Hoàn thành rồi! Chúc mừng bé!',
];

const VIETNAMESE_GREETINGS = [
  'Chào bé!',
  'Bé giỏi quá!',
  'Mình học nhé!',
];

class CelebrationManager {
  private listeners: Set<(event: CelebrationEvent) => void> = new Set();

  /**
   * Get random praise string from pool
   */
  public getRandomPraise(isBig: boolean = false): string {
    const pool = isBig ? VIETNAMESE_PRAISES_BIG : VIETNAMESE_PRAISES_SMALL;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  /**
   * Get random greeting
   */
  public getRandomGreeting(): string {
    const idx = Math.floor(Math.random() * VIETNAMESE_GREETINGS.length);
    return VIETNAMESE_GREETINGS[idx];
  }

  /**
   * Trigger celebration sequence
   */
  public celebrate(tier: CelebrationTier = 'small', customPraise?: string): CelebrationEvent {
    const isBig = tier === 'lessonComplete' || tier === 'levelUp' || tier === 'gameWin';
    const praise = customPraise || this.getRandomPraise(isBig);

    let soundType: CelebrationEvent['soundType'] = 'correct';
    if (tier === 'lessonComplete' || tier === 'levelUp') {
      soundType = 'fanfare';
      kidsSound.play('celebration');
    } else if (tier === 'gameWin') {
      soundType = 'applause';
      kidsSound.play('celebration');
    } else if (tier === 'good') {
      soundType = 'celebration';
      kidsSound.play('success');
    } else {
      soundType = 'correct';
      kidsSound.play('correct');
    }

    const event: CelebrationEvent = {
      tier,
      praiseVi: praise,
      confetti: isBig,
      soundType,
    };

    // Notify UI listeners (for confetti, badges, mascot reactions)
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (_) {}
    });

    return event;
  }

  /**
   * Greet the child in Vietnamese with speech & audio
   */
  public greetChild() {
    const greeting = this.getRandomGreeting();
    kidsSound.play('pop');
    kidsSpeech.speakVi(greeting);
    return greeting;
  }

  /**
   * Speak encouragement in Vietnamese
   */
  public speakPraise(praise?: string) {
    const text = praise || this.getRandomPraise(false);
    kidsSpeech.speakVi(text.replace(/[^\p{L}\p{N}\s!?,.]/gu, '').trim());
  }

  /**
   * Audio instruction for games so kids who cannot read can still play:
   * e.g. "Bé hãy tìm: Con sư tử!" -> "Lion"
   */
  public promptFindItem(enWord: string, viMeaning?: string) {
    const meaning = viMeaning || kidsSpeech.getViMeaning(enWord);
    const viPhrase = meaning ? `Bé hãy tìm ${meaning}!` : `Bé hãy tìm từ này!`;
    kidsSpeech.speakVi(viPhrase, {
      onEnd: () => {
        setTimeout(() => {
          kidsSpeech.speak(enWord);
        }, 250);
      },
    });
  }

  /**
   * Subscribe to celebration events (e.g. for global confetti)
   */
  public onCelebrate(listener: (event: CelebrationEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const celebrationManager = new CelebrationManager();

