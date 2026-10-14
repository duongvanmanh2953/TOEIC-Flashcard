/**
 * SUNNY MEADOW V2.0 - DUAL EYE-CARE GUARD
 * Implements 20-20-20 rule timer & warm filter controller
 */

type RestCallback = () => void;

class EyeCareGuardService {
  private activeDurationSeconds = 0;
  private intervalId: number | null = null;
  private listeners: Set<RestCallback> = new Set();
  private readonly REST_INTERVAL_SECONDS = 20 * 60; // 20 minutes in real production

  constructor() {
    this.startTracking();
  }

  public startTracking(): void {
    if (typeof window === 'undefined') return;
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.activeDurationSeconds += 1;
      if (this.activeDurationSeconds >= this.REST_INTERVAL_SECONDS) {
        this.triggerRestPrompt();
        this.activeDurationSeconds = 0;
      }
    }, 1000);
  }

  public onRestRequired(cb: RestCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public triggerRestPrompt(): void {
    this.listeners.forEach((fn) => fn());
  }

  public resetTimer(): void {
    this.activeDurationSeconds = 0;
  }

  public getMinutesRemaining(): number {
    return Math.max(0, Math.ceil((this.REST_INTERVAL_SECONDS - this.activeDurationSeconds) / 60));
  }
}

export const eyeCareGuard = new EyeCareGuardService();
export default eyeCareGuard;
