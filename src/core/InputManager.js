export class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};

    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasPressed(code) {
    return !!this.justPressed[code];
  }

  clearJustPressed() {
    this.justPressed = {};
  }

  get forward() {
    return this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  get brake() {
    return this.isDown('KeyS') || this.isDown('ArrowDown');
  }

  get left() {
    return this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  get right() {
    return this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  get enter() {
    return this.wasPressed('Enter') || this.wasPressed('Space');
  }
}
