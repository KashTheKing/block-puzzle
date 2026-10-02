// Block Puzzle: drag pieces from the tray onto the 8x8 board. Full rows and columns clear.
// The whole game is drawn with pen stamps, so this one sprite renders everything each frame.
import { game } from "./Stage";

// ---- shapes (generated): cells of shape i are SX/SY[SSTART[i] .. SSTART[i] + SLEN[i] - 1] ----
const SX = [0, 0, 1, 0, 0, 0, 1, 2, 0, 0, 0, 0, 1, 2, 3, 0, 0, 0, 0, 0, 1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 2, 0, 0, 0, 1, 2, 2, 2, 0, 0, 0, 1, 2, 2, 2, 0, 1, 2, 0, 1, 2, 1, 1, 0, 1, 2, 0, 0, 1, 0, 1, 0, 1, 1, 1, 2, 0, 1, 0, 1, 1, 2, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 2, 0, 0, 1, 2, 2, 0, 0, 1, 2, 2, 0, 1, 2];
const SY = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 1, 2, 3, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 2, 2, 2, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 2, 2, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 2, 0, 0, 0, 1, 2, 0, 1, 2, 2, 2, 0, 1, 2, 2, 2, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 2, 0, 1, 1, 2, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 2, 0, 1, 1, 2, 0, 1, 2, 2, 0, 1, 2, 2, 0, 0, 1, 2, 0, 0, 1, 2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1];
const SSTART = [0, 1, 3, 5, 8, 11, 15, 19, 24, 29, 33, 42, 48, 54, 57, 60, 63, 66, 71, 76, 81, 86, 90, 94, 98, 102, 106, 110, 114, 118, 122, 126, 130, 134, 138, 142, 146];
const SLEN = [1, 2, 2, 3, 3, 4, 4, 5, 5, 4, 9, 6, 6, 3, 3, 3, 3, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
const SW = [1, 2, 1, 3, 1, 4, 1, 5, 1, 2, 3, 3, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3];
const SH = [1, 1, 2, 1, 3, 1, 4, 1, 5, 2, 3, 2, 3, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 3, 3, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2];

// ---- layout ----
const N = 8; // board is N x N
const CELL = 34; // board cell size in pixels
const BX = -226; // board left edge
const BY = 122; // board top edge (room for the score monitors above)
const TRAY_X = 162;
const slotY = [78, -24, -126];

// ---- state ----
const grid: number[] = []; // 0 = empty, 1..7 = block colour
const trayShape: number[] = []; // shape index per tray slot, -1 = used
const trayColor: number[] = [];
const fullRows: number[] = [];
const fullCols: number[] = [];
let dragging = -1; // tray slot being dragged
let wasDown = false;
let over = false;
let flash = 0; // frames left of the line-clear flash

/** @warp */
function newGame() {
  grid.length = 0;
  repeat(N * N, () => {
    grid.push(0);
  });
  trayShape.length = 0;
  trayColor.length = 0;
  repeat(3, () => {
    trayShape.push(-1);
    trayColor.push(0);
  });
  game.score = 0;
  over = false;
  dragging = -1;
  refill();
}

/** Deal three new pieces once the tray is empty. */
/** @warp */
function refill() {
  if (trayShape[0] === -1 && trayShape[1] === -1 && trayShape[2] === -1) {
    for (let i = 0; i < 3; i++) {
      trayShape[i] = random(0, SLEN.length - 1);
      trayColor[i] = random(1, 7);
    }
  }
}

/** @warp */
function fits(shape: number, c: number, r: number): boolean {
  if (shape < 0) return false;
  for (let k = SSTART[shape]; k < SSTART[shape] + SLEN[shape]; k++) {
    const cc = c + SX[k];
    const rr = r + SY[k];
    if (cc < 0 || cc >= N || rr < 0 || rr >= N) return false;
    if (grid[rr * N + cc] !== 0) return false;
  }
  return true;
}

/** @warp */
function anyMove(): boolean {
  for (let s = 0; s < 3; s++) {
    if (trayShape[s] !== -1) {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const ok = fits(trayShape[s], c, r);
          if (ok) return true;
        }
      }
    }
  }
  return false;
}

/** @warp */
function clearLines() {
  fullRows.length = 0;
  fullCols.length = 0;
  for (let r = 0; r < N; r++) {
    let full = true;
    for (let c = 0; c < N; c++) if (grid[r * N + c] === 0) full = false;
    if (full) fullRows.push(r);
  }
  for (let c = 0; c < N; c++) {
    let full = true;
    for (let r = 0; r < N; r++) if (grid[r * N + c] === 0) full = false;
    if (full) fullCols.push(c);
  }
  for (let i = 0; i < fullRows.length; i++) for (let c = 0; c < N; c++) grid[fullRows[i] * N + c] = 0;
  for (let i = 0; i < fullCols.length; i++) for (let r = 0; r < N; r++) grid[r * N + fullCols[i]] = 0;
  const lines = fullRows.length + fullCols.length;
  if (lines > 0) {
    game.score += 10 * lines * lines; // combos are worth more
    flash = 6;
    if (lines > 1) playSound("combo");
    else playSound("clear");
  }
}

/** @warp */
function place(slot: number, c: number, r: number) {
  const shape = trayShape[slot];
  for (let k = SSTART[shape]; k < SSTART[shape] + SLEN[shape]; k++) {
    grid[(r + SY[k]) * N + c + SX[k]] = trayColor[slot];
  }
  game.score += SLEN[shape];
  trayShape[slot] = -1;
  playSound("place");
  clearLines();
  refill();
  const canMove = anyMove();
  if (!canMove) {
    over = true;
    game.best = Math.max(game.best, game.score);
    playSound("gameover");
  }
}

/** Stamp a tray piece centred on (cx, cy) at the given size percent. */
/** @warp */
function drawPiece(slot: number, cx: number, cy: number, size: number) {
  const shape = trayShape[slot];
  const cell = (CELL * size) / 100;
  const left = cx - (SW[shape] * cell) / 2;
  const top = cy + (SH[shape] * cell) / 2;
  me.size = size;
  switchCostume(trayColor[slot]);
  for (let k = SSTART[shape]; k < SSTART[shape] + SLEN[shape]; k++) {
    goTo(left + SX[k] * cell + cell / 2, top - SY[k] * cell - cell / 2);
    stamp();
  }
}

/** @warp */
function render() {
  penClear();
  me.size = 100;
  clearEffects();
  switchCostume("board");
  goTo(BX + (N * CELL) / 2, BY - (N * CELL) / 2);
  stamp();
  if (flash > 0) {
    setEffect("brightness", flash * 6);
    flash--;
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = grid[r * N + c];
      if (v === 0) switchCostume("empty");
      else switchCostume(v);
      goTo(BX + c * CELL + CELL / 2, BY - r * CELL - CELL / 2);
      stamp();
    }
  }
  clearEffects();

  // tray
  for (let s = 0; s < 3; s++) {
    me.size = 100;
    switchCostume("slot");
    goTo(TRAY_X, slotY[s]);
    stamp();
    if (trayShape[s] !== -1 && s !== dragging) drawPiece(s, TRAY_X, slotY[s], 50);
  }

  // dragged piece, with a ghost where it would land
  if (dragging !== -1) {
    const shape = trayShape[dragging];
    const tc = Math.round((mouseX() - (SW[shape] * CELL) / 2 - BX) / CELL);
    const tr = Math.round((BY - mouseY() - (SH[shape] * CELL) / 2) / CELL);
    const ok = fits(shape, tc, tr);
    if (ok) {
      setEffect("ghost", 60);
      drawPiece(dragging, BX + (tc + SW[shape] / 2) * CELL, BY - (tr + SH[shape] / 2) * CELL, 100);
      clearEffects();
    }
    drawPiece(dragging, mouseX(), mouseY(), 100);
  }

  if (over) {
    me.size = 100;
    switchCostume("gameover");
    goTo(BX + (N * CELL) / 2, BY - (N * CELL) / 2);
    stamp();
  }
  switchCostume("blank");
}

whenFlag(() => {
  me.visible = true;
  goToFront();
  newGame();
  forever(() => {
    const down = mouseDown();
    if (over) {
      if (down && !wasDown) newGame();
    } else if (dragging === -1) {
      if (down && !wasDown && mouseX() > TRAY_X - 75) {
        for (let s = 0; s < 3; s++) {
          if (Math.abs(mouseY() - slotY[s]) < 50 && trayShape[s] !== -1) dragging = s;
        }
        if (dragging !== -1) playSound("pick");
      }
    } else if (!down) {
      const shape = trayShape[dragging];
      const tc = Math.round((mouseX() - (SW[shape] * CELL) / 2 - BX) / CELL);
      const tr = Math.round((BY - mouseY() - (SH[shape] * CELL) / 2) / CELL);
      const ok = fits(shape, tc, tr);
      if (ok) place(dragging, tc, tr);
      else if (mouseX() < TRAY_X - 75) playSound("deny"); // dropped on the board where it doesn't fit
      dragging = -1;
    }
    wasDown = down;
    render();
  });
});
