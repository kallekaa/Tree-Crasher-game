export class HUD {
  constructor() {
    this.speedEl = document.getElementById('speed-value');
    this.scoreEl = document.getElementById('score-value');
    this.comboEl = document.getElementById('combo');
    this.comboValueEl = document.getElementById('combo-value');
    this.treesEl = document.getElementById('trees-value');
    this.progressEl = document.getElementById('progress-bar');
    this.hudEl = document.getElementById('hud');

    // Score state
    this.score = 0;
    this.treesDestroyed = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
    this.comboTimeout = 1500; // ms
    this.displayedScore = 0;
  }

  show() {
    this.hudEl.classList.remove('hidden');
  }

  hide() {
    this.hudEl.classList.add('hidden');
  }

  addHit(carSpeed, maxSpeed) {
    const now = performance.now();

    // Combo check
    if (now - this.lastHitTime < this.comboTimeout) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastHitTime = now;

    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }

    // Speed multiplier: 1x at 0, 5x at max
    const speedRatio = Math.abs(carSpeed) / maxSpeed;
    const speedMultiplier = 1 + speedRatio * 4;

    // Combo multiplier (capped at 10x)
    const comboMultiplier = Math.min(this.comboCount, 10);

    const points = Math.round(100 * speedMultiplier * comboMultiplier);
    this.score += points;
    this.treesDestroyed++;

    // Update combo display
    if (this.comboCount > 1) {
      this.comboEl.classList.remove('hidden');
      this.comboValueEl.textContent = this.comboCount;
      // Re-trigger animation
      this.comboEl.style.animation = 'none';
      void this.comboEl.offsetHeight;
      this.comboEl.style.animation = '';
    }

    return { points, comboMultiplier, speedMultiplier };
  }

  update(speed, progress) {
    this.speedEl.textContent = Math.round(speed);
    this.progressEl.style.width = (progress * 100) + '%';
    this.treesEl.textContent = this.treesDestroyed;

    // Animate score counting up
    this.displayedScore += (this.score - this.displayedScore) * 0.15;
    if (Math.abs(this.score - this.displayedScore) < 1) {
      this.displayedScore = this.score;
    }
    this.scoreEl.textContent = Math.round(this.displayedScore);

    // Hide combo after timeout
    const now = performance.now();
    if (now - this.lastHitTime > this.comboTimeout && this.comboCount > 0) {
      this.comboCount = 0;
      this.comboEl.classList.add('hidden');
    }
  }

  reset() {
    this.score = 0;
    this.displayedScore = 0;
    this.treesDestroyed = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
    this.scoreEl.textContent = '0';
    this.speedEl.textContent = '0';
    this.treesEl.textContent = '0';
    this.progressEl.style.width = '0%';
    this.comboEl.classList.add('hidden');
  }
}
