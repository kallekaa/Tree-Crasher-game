export class ScorePopup {
  constructor() {
    this.container = document.getElementById('score-popups');
  }

  show(screenX, screenY, points, isCombo) {
    const el = document.createElement('div');
    el.className = 'score-popup' + (isCombo ? ' combo-popup' : '');
    el.textContent = '+' + points;
    el.style.left = screenX + 'px';
    el.style.top = screenY + 'px';

    this.container.appendChild(el);

    // Remove after animation
    setTimeout(() => {
      el.remove();
    }, 1000);
  }

  worldToScreen(position, camera) {
    const vector = position.clone().project(camera);
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
    };
  }
}
