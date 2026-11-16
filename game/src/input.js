// Keyboard and mouse input manager for LANTERNFALL

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 480, y: 300, down: false, rightDown: false };
    this.justPressedKeys = new Set();
    this.justClicked = false;
    this.dashRequested = false;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys.has(code)) {
        this.justPressedKeys.add(code);
      }
      this.keys.add(code);

      if (code === 'Space') {
        this.dashRequested = true;
      }
      // Prevent scrolling on arrows/space
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.updateMousePos(e);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.updateMousePos(e);
      if (e.button === 0) {
        this.mouse.down = true;
        this.justClicked = true;
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
        this.dashRequested = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouse.x = (e.clientX - rect.left) * scaleX;
    this.mouse.y = (e.clientY - rect.top) * scaleY;
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.SQRT2;
      dx *= invLen;
      dy *= invLen;
    }

    return { dx, dy };
  }

  isFiring() {
    return this.mouse.down || this.keys.has('KeyF') || this.keys.has('KeyJ');
  }

  isDashRequested() {
    const req = this.dashRequested || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    this.dashRequested = false;
    return req;
  }

  wasKeyPressed(code) {
    return this.justPressedKeys.has(code);
  }

  wasClicked() {
    return this.justClicked;
  }

  flush() {
    this.justPressedKeys.clear();
    this.justClicked = false;
  }

  reset() {
    this.keys.clear();
    this.justPressedKeys.clear();
    this.mouse.down = false;
    this.mouse.rightDown = false;
    this.justClicked = false;
    this.dashRequested = false;
  }
}
