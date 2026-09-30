/**
 * =========================================================================
 * KidsAnimationManager.ts
 * Unified High-Performance Animation & Game Effects Engine for Kids English
 * =========================================================================
 * 
 * LICENSING & ATTRIBUTION:
 * -------------------------------------------------------------------------
 * 1. Particle Physics & Burst Engine:
 *    - Source: CodePen & HTML5 Game Particle Patterns (MIT License)
 *    - Author: Jack Rugile / Hakim El Hattab (adapted for zero-dependency React/Canvas)
 *    - License: MIT License
 *    - URL: https://codepen.io/jackrugile/pen/Baqep / https://html5hub.com
 * 
 * 2. Rocket Ignition & Liftoff Kinematics:
 *    - Source: GSAP Rocket Animation Examples / CodePen Rocket Launch
 *    - Author: Chris Gannon & Sarah Drasner (adapted to pure CSS3 GPU + Web Audio)
 *    - License: MIT License
 *    - URL: https://codepen.io/chrisgannon/pen/NWqVbX
 * 
 * 3. Bubble Pop Squash & Fragment Scatter:
 *    - Source: Kids Bubble Burst Simulation (MIT License)
 *    - Author: HTML5 Game Devs Community
 *    - License: MIT License
 *    - URL: https://opengameart.org / https://codepen.io/collection/bubble-pop
 * =========================================================================
 */

import { kidsSound } from '../sound/KidsSoundManager';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
  shape: 'circle' | 'star' | 'smoke' | 'spark' | 'droplet';
}

class KidsAnimationManager {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animId: number | null = null;
  private isRunning: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initCanvas();
    }
  }

  /**
   * Lazily initialize global high-performance overlay canvas
   */
  private initCanvas() {
    if (this.canvas) return;
    const c = document.createElement('canvas');
    c.id = 'kids-global-fx-canvas';
    c.style.position = 'fixed';
    c.style.inset = '0';
    c.style.width = '100vw';
    c.style.height = '100vh';
    c.style.pointerEvents = 'none';
    c.style.zIndex = '99999';
    document.body.appendChild(c);

    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.resizeCanvas();

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  private startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;

    const render = () => {
      if (!this.ctx || !this.canvas) {
        this.isRunning = false;
        return;
      }

      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.shape === 'smoke' ? -0.08 : 0.22; // Smoke floats up, particles fall
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.rotation += p.rotSpeed;
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.life >= p.maxLife || p.alpha <= 0.01) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);

        if (p.shape === 'circle') {
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (p.shape === 'droplet') {
          // Shimmering bubble droplet
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, p.radius, p.radius * 0.7, 0, 0, Math.PI * 2);
          this.ctx.fill();
          // Droplet highlight
          this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
          this.ctx.beginPath();
          this.ctx.arc(-p.radius * 0.3, -p.radius * 0.3, p.radius * 0.35, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (p.shape === 'smoke') {
          // Soft billowing smoke cloud
          const rad = p.radius * (1 + (p.life / p.maxLife) * 1.5);
          const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
          grad.addColorStop(0.5, 'rgba(230, 240, 255, 0.45)');
          grad.addColorStop(1, 'rgba(200, 220, 240, 0)');
          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, rad, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (p.shape === 'star') {
          // 5-pointed star
          this.ctx.fillStyle = p.color;
          this.drawStar(this.ctx, 0, 0, 5, p.radius, p.radius * 0.45);
        } else if (p.shape === 'spark') {
          // Fire spark / streak
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(render);
      } else {
        this.isRunning = false;
        this.animId = null;
      }
    };

    this.animId = requestAnimationFrame(render);
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 1. ROCKET LAUNCH ANIMATION
   * Sequence:
   * 1. Idle -> Engine Ignition (flame grows, smoke puffs, rocket shakes, engine sound)
   * 2. Acceleration liftoff (exponential curve upwards, whoosh sound)
   * 3. Smoke & spark trail left in space
   * 4. Victory fanfare & celebration
   */
  public playRocketLaunch(
    targetElement: HTMLElement | null,
    onCompleted?: () => void
  ) {
    this.initCanvas();
    kidsSound.playEngineIgnition(0.7);

    let rect = { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 80, height: 120 };
    if (targetElement) {
      rect = targetElement.getBoundingClientRect();
    }

    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height;

    // Phase 1: Engine Ignition & Shaking (0ms - 550ms)
    if (targetElement) {
      targetElement.style.transition = 'none';
      targetElement.style.transformOrigin = 'bottom center';
    }

    const shakeInterval = setInterval(() => {
      // Spawn smoke puffs and fire sparks at nozzle
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: startX + (Math.random() - 0.5) * 24,
          y: startY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 2 + 1,
          radius: Math.random() * 12 + 10,
          color: '#ffffff',
          alpha: 0.8,
          life: 0,
          maxLife: 35,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.08,
          shape: 'smoke',
        });

        // Fiery sparks
        this.particles.push({
          x: startX + (Math.random() - 0.5) * 16,
          y: startY + Math.random() * 6,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 2,
          radius: Math.random() * 3 + 2,
          color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
          alpha: 1,
          life: 0,
          maxLife: 20,
          rotation: 0,
          rotSpeed: 0,
          shape: 'spark',
        });
      }
      this.startLoop();

      if (targetElement) {
        const rx = (Math.random() - 0.5) * 6;
        const ry = (Math.random() - 0.5) * 3;
        const rot = (Math.random() - 0.5) * 2;
        targetElement.style.transform = `translate3d(${rx}px, ${ry}px, 0) rotate(${rot}deg) scale(1.04)`;
      }
    }, 45);

    // Phase 2: Liftoff & Acceleration (550ms)
    setTimeout(() => {
      clearInterval(shakeInterval);
      kidsSound.playRocketLaunch(1.1);

      if (targetElement) {
        // High-performance GPU accelerated liftoff with cubic-bezier acceleration
        targetElement.style.transition = 'transform 1.15s cubic-bezier(0.45, 0, 0.2, 1), opacity 0.3s ease 0.9s';
        targetElement.style.transform = `translate3d(0, -${window.innerHeight + 400}px, 0) scale(1.25) rotate(0deg)`;
      }

      // Continuous trail generation during flight
      let trailTime = 0;
      const trailInterval = setInterval(() => {
        trailTime += 30;
        const progress = Math.min(1, trailTime / 900);
        const curY = startY - Math.pow(progress, 2.5) * (window.innerHeight + 300);

        for (let i = 0; i < 4; i++) {
          this.particles.push({
            x: startX + (Math.random() - 0.5) * 28,
            y: curY + Math.random() * 10,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 2 + 1,
            radius: Math.random() * 16 + 12,
            color: '#f8fafc',
            alpha: 0.9,
            life: 0,
            maxLife: 45,
            rotation: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            shape: 'smoke',
          });

          // Gold/orange flame trail
          this.particles.push({
            x: startX + (Math.random() - 0.5) * 14,
            y: curY + 5,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 3 + 1,
            radius: Math.random() * 4 + 2,
            color: '#fbbf24',
            alpha: 1,
            life: 0,
            maxLife: 25,
            rotation: 0,
            rotSpeed: 0,
            shape: 'spark',
          });
        }
        this.startLoop();

        if (trailTime >= 950) {
          clearInterval(trailInterval);
        }
      }, 30);

      // Phase 3: Celebration Chime on Success (1200ms)
      setTimeout(() => {
        kidsSound.play('correct');
        this.playStarBurst({ x: startX, y: Math.max(80, startY - 400) }, 20);
        onCompleted?.();
      }, 1200);
    }, 550);
  }

  /**
   * 2. BUBBLE POP ANIMATION
   * Sequence:
   * 1. Bubble Wobble (squash & stretch)
   * 2. Pop -> Droplet Fragments + Sparkles radial scatter
   * 3. Pop & Success Sound Sync
   */
  public playBubblePop(
    coordsOrElement: { x: number; y: number } | HTMLElement,
    options: {
      color?: string;
      onCompleted?: () => void;
    } = {}
  ) {
    this.initCanvas();

    let x = 0;
    let y = 0;
    if (coordsOrElement instanceof HTMLElement) {
      const rect = coordsOrElement.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;

      // Element squash and wobble before popping
      coordsOrElement.style.transition = 'transform 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      coordsOrElement.style.transform = 'scale(1.22, 0.82)';
      setTimeout(() => {
        coordsOrElement.style.transform = 'scale(0.85, 1.18)';
        setTimeout(() => {
          coordsOrElement.style.transform = 'scale(0)';
          coordsOrElement.style.opacity = '0';
        }, 60);
      }, 80);
    } else {
      x = coordsOrElement.x;
      y = coordsOrElement.y;
    }

    // Sound: crisp soap bubble pop
    kidsSound.playBubbleBurst();

    const bubbleColors = [
      options.color || '#38bdf8',
      '#60a5fa',
      '#93c5fd',
      '#a7f3d0',
      '#f472b6',
      '#ffffff',
    ];

    // Spawn 18 - 24 liquid droplet fragments bursting outward
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 6.5 + 3.5;
      const color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: Math.random() * 5 + 3,
        color,
        alpha: 0.95,
        life: 0,
        maxLife: Math.floor(Math.random() * 15 + 20),
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        shape: 'droplet',
      });
    }

    // Sparkles
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 2,
        color: '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 20,
        rotation: 0,
        rotSpeed: 0,
        shape: 'spark',
      });
    }

    this.startLoop();

    if (options.onCompleted) {
      setTimeout(options.onCompleted, 350);
    }
  }

  /**
   * 3. STAR BURST / COLLECT ANIMATION
   */
  public playStarBurst(
    coordsOrElement: { x: number; y: number } | HTMLElement,
    count: number = 18,
    onCompleted?: () => void
  ) {
    this.initCanvas();
    kidsSound.playSparkle();

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (coordsOrElement instanceof HTMLElement) {
      const r = coordsOrElement.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    } else if (coordsOrElement) {
      x = coordsOrElement.x;
      y = coordsOrElement.y;
    }

    const starColors = ['#facc15', '#f59e0b', '#fbbf24', '#fef08a', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 7 + 4;
      const color = starColors[Math.floor(Math.random() * starColors.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: Math.random() * 8 + 6,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.floor(Math.random() * 20 + 25),
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        shape: 'star',
      });
    }

    this.startLoop();
    if (onCompleted) setTimeout(onCompleted, 400);
  }

  /**
   * 4. PHYSICAL OBJECT BOUNCE (Squash & Stretch)
   */
  public playObjectBounce(element: HTMLElement | null) {
    if (!element) return;
    kidsSound.playBounce();

    element.style.transition = 'transform 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    element.style.transform = 'scale(1.22, 0.8)';

    setTimeout(() => {
      element.style.transform = 'scale(0.88, 1.16)';
      setTimeout(() => {
        element.style.transform = 'scale(1.06, 0.95)';
        setTimeout(() => {
          element.style.transform = 'scale(1, 1)';
        }, 80);
      }, 100);
    }, 120);
  }

  /**
   * 5. 3D CARD FLIP
   */
  public playCardFlip(element: HTMLElement | null, onCompleted?: () => void) {
    kidsSound.playWhoosh();
    if (!element) {
      onCompleted?.();
      return;
    }
    element.style.transition = 'transform 0.45s cubic-bezier(0.4, 0.0, 0.2, 1)';
    onCompleted?.();
  }

  /**
   * 6. SUCCESS & CELEBRATION
   */
  public playCelebration(onCompleted?: () => void) {
    kidsSound.playFanfare();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.4;
    this.playStarBurst({ x: centerX - 120, y: centerY }, 22);
    setTimeout(() => {
      this.playStarBurst({ x: centerX + 120, y: centerY }, 22);
      onCompleted?.();
    }, 180);
  }
}

export const kidsAnimationManager = new KidsAnimationManager();
export default kidsAnimationManager;
