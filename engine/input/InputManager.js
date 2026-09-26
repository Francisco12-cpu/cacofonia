/**
 * Entrada unificada: teclado+mouse, toque e controle (Gamepad API) — seção
 * 6 da bíblia. Emite ações discretas (`moveLeft`, `jump`, `dive`, `collect`,
 * `pause`, `interact`, `menu`) e um vetor analógico contínuo (`getAxis()`)
 * para o movimento livre do mundo aberto. Também rastreia qual dispositivo
 * foi usado por último, para a UI escolher os ícones certos.
 */
const KEY_TO_DIR = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right'
};

export class InputManager {
  constructor() {
    this.handlers = new Map();
    this.held = new Set();
    this.lastDevice = 'teclado';
    this._axis = { x: 0, y: 0 };
    this._joy = null;
    this._gamepadIndex = null;
    this._gpPrevButtons = [];
    this._touchSwipe = null;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('gamepadconnected', () => { this.lastDevice = 'controle'; });
    window.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') this.lastDevice = e.pointerType === 'mouse' ? 'teclado' : this.lastDevice; });
  }

  on(action, handler) {
    if (!this.handlers.has(action)) this.handlers.set(action, []);
    this.handlers.get(action).push(handler);
    return () => this.off(action, handler);
  }

  off(action, handler) {
    const list = this.handlers.get(action);
    if (list) this.handlers.set(action, list.filter((h) => h !== handler));
  }

  emit(action, payload) {
    for (const h of this.handlers.get(action) || []) h(payload);
  }

  device() { return this.lastDevice; }

  _onKeyDown(e) {
    const k = e.key.toLowerCase();
    this.lastDevice = 'teclado';
    if (KEY_TO_DIR[k]) this.held.add(KEY_TO_DIR[k]);
    if (e.repeat) return;
    if (k === ' ' || k === 'arrowup' || k === 'w') this.emit('jump');
    else if (k === 'arrowdown' || k === 's') this.emit('dive');
    else if (['e', 'k', 'enter', 'j'].includes(k)) this.emit('collect');
    else if (k === 'arrowleft' || k === 'a') this.emit('moveLeft');
    else if (k === 'arrowright' || k === 'd') this.emit('moveRight');
    else if (k === 'escape' || k === 'p') this.emit('pause');
    else if (k === 'm') this.emit('menu');
  }

  _onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (KEY_TO_DIR[k]) this.held.delete(KEY_TO_DIR[k]);
  }

  /** Vetor analógico (-1..1, -1..1) combinando teclado, joystick de toque e o stick esquerdo do controle. */
  getAxis() {
    if (this._joy) return { x: this._joy.dx, y: this._joy.dy };
    let x = 0, y = 0;
    if (this.held.has('left')) x -= 1;
    if (this.held.has('right')) x += 1;
    if (this.held.has('up')) y -= 1;
    if (this.held.has('down')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  /** Joystick de toque: chamar em touchstart/touchmove/touchend do elemento do mundo. */
  attachWorldTouch(el, { onTap } = {}) {
    el.addEventListener('touchstart', (e) => {
      if (this._joy) return;
      const t = e.changedTouches[0];
      this._joy = { id: t.identifier, x0: t.clientX, y0: t.clientY, dx: 0, dy: 0 };
      this.lastDevice = 'toque';
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      const j = this._joy; if (!j) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== j.id) continue;
        let dx = (t.clientX - j.x0) / 38, dy = (t.clientY - j.y0) / 38;
        const l = Math.hypot(dx, dy);
        if (l > 1) { dx /= l; dy /= l; }
        if (l < 0.18) { dx = 0; dy = 0; }
        j.dx = dx; j.dy = dy;
      }
    }, { passive: true });
    const end = (e) => {
      const j = this._joy; if (!j) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== j.id) continue;
        const tap = Math.hypot(t.clientX - j.x0, t.clientY - j.y0) < 8;
        this._joy = null;
        if (tap && onTap) onTap();
      }
    };
    el.addEventListener('touchend', end, { passive: true });
    el.addEventListener('touchcancel', end, { passive: true });
  }

  /** Gestos de toque na batalha: arrastar pros lados troca de pista, pra cima pula, pra baixo desce rápido. */
  attachBattleTouch(el) {
    let id = null, x0 = 0, y0 = 0, used = false;
    el.addEventListener('touchstart', (e) => {
      if (id !== null) return;
      const t = e.changedTouches[0];
      id = t.identifier; x0 = t.clientX; y0 = t.clientY; used = false;
      this.lastDevice = 'toque';
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (used) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== id) continue;
        const dx = t.clientX - x0, dy = t.clientY - y0;
        if (Math.abs(dy) > 16 && Math.abs(dy) > Math.abs(dx)) { this.emit(dy < 0 ? 'jump' : 'dive'); used = true; }
        else if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy)) { this.emit(dx > 0 ? 'moveRight' : 'moveLeft'); used = true; }
      }
    }, { passive: true });
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== id) continue;
        if (!used) {
          const dx = t.clientX - x0, dy = t.clientY - y0;
          if (Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy)) this.emit(dx > 0 ? 'moveRight' : 'moveLeft');
          else if (Math.abs(dy) > 9) this.emit(dy < 0 ? 'jump' : 'dive');
        }
        id = null; used = false;
      }
    };
    el.addEventListener('touchend', end, { passive: true });
    el.addEventListener('touchcancel', end, { passive: true });
  }

  /** Chamar uma vez por quadro: a Gamepad API não dispara eventos para eixos/botões, só polling. */
  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad = null;
    for (const p of pads) if (p) { pad = p; break; }
    if (!pad) return;
    this._gamepadIndex = pad.index;
    const prev = this._gpPrevButtons;
    const axisX = Math.abs(pad.axes[0]) > 0.35 ? pad.axes[0] : 0;
    const axisY = Math.abs(pad.axes[1]) > 0.35 ? pad.axes[1] : 0;
    const dpadX = (pad.buttons[15]?.pressed ? 1 : 0) - (pad.buttons[14]?.pressed ? 1 : 0);
    const dpadY = (pad.buttons[13]?.pressed ? 1 : 0) - (pad.buttons[12]?.pressed ? 1 : 0);
    const x = dpadX || axisX, y = dpadY || axisY;
    if (Math.abs(x) > 0.3 || Math.abs(y) > 0.3) { this._joyGamepad = { x, y }; this.lastDevice = 'controle'; }
    else this._joyGamepad = null;

    const pressed = (i) => !!pad.buttons[i]?.pressed;
    const rising = (i) => pressed(i) && !prev[i];
    if (rising(0)) { this.emit('jump'); this.lastDevice = 'controle'; }       // A / Cross
    if (rising(1)) { this.emit('dive'); this.lastDevice = 'controle'; }      // B / Circle
    if (rising(2) || rising(7)) { this.emit('collect'); this.lastDevice = 'controle'; } // X/Square ou RT
    if (rising(9)) { this.emit('pause'); this.lastDevice = 'controle'; }     // Start
    if (rising(3)) { this.emit('interact'); this.lastDevice = 'controle'; }  // Y/Triangle
    if (dpadX > 0 && !(prev._dpadX > 0)) this.emit('moveRight');
    if (dpadX < 0 && !(prev._dpadX < 0)) this.emit('moveLeft');
    prev._dpadX = dpadX;
    this._gpPrevButtons = pad.buttons.map((b) => b.pressed);
    this._gpPrevButtons._dpadX = dpadX;
  }

  /** Vetor analógico combinado incluindo o stick do controle (chamar depois de pollGamepad). */
  getAxisWithGamepad() {
    if (this._joyGamepad) return this._joyGamepad;
    return this.getAxis();
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
