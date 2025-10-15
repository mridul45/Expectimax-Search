
export const SIZE = 4;
const TILE = 92;     // px
const GAP  = 8;      // px (gap-2)
const NEW_TILE_VALUES  = [2, 4];
const NEW_TILE_WEIGHTS = [0.9, 0.1];

const randId = () => Math.random().toString(36).slice(2);
export const idx = (r, c) => r * SIZE + c;

function rngChoice(values, weights) {
  const x = Math.random(); let acc = 0;
  for (let i = 0; i < values.length; i++) { acc += weights[i]; if (x <= acc) return values[i]; }
  return values[values.length - 1];
}
export function emptyBoard()      { return Array.from({ length: SIZE * SIZE }, () => null); }
export function cloneBoard(board) { return board.map((t) => (t ? { ...t } : null)); }
export function boardToMatrix(board) {
  return Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => board[idx(r, c)])
  );
}
export function matrixToBoard(mat) {
  const flat = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) flat.push(mat[r][c]);
  return flat;
}
export function getEmptyCells(board) { const a=[]; for (let i=0;i<board.length;i++) if(!board[i]) a.push(i); return a; }
export function spawnTile(board) {
  const spaces = getEmptyCells(board);
  if (!spaces.length) return board;
  const pos = spaces[Math.floor(Math.random() * spaces.length)];
  const val = rngChoice(NEW_TILE_VALUES, NEW_TILE_WEIGHTS);
  const next = cloneBoard(board);
  next[pos] = { id: randId(), value: val, justMerged: false, justSpawned: true };
  return next;
}
export function hasMoves(board) {
  if (getEmptyCells(board).length) return true;
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    const t = board[idx(r,c)]; if (!t) continue;
    if (r+1<SIZE){ const d=board[idx(r+1,c)]; if(d && d.value===t.value) return true; }
    if (c+1<SIZE){ const d=board[idx(r,c+1)]; if(d && d.value===t.value) return true; }
  }
  return false;
}
function compressLine(line) {
  const tiles = line.filter(Boolean).map(t => ({ ...t, justMerged: false }));
  const out = []; let scoreGain = 0; let i = 0;
  while (i < tiles.length) {
    if (i+1 < tiles.length && tiles[i].value === tiles[i+1].value) {
      const v = tiles[i].value * 2;
      out.push({ id: randId(), value: v, justMerged: true, justSpawned: false });
      scoreGain += v; i += 2;
    } else {
      out.push({ ...tiles[i], justMerged: false, justSpawned: false }); i += 1;
    }
  }
  while (out.length < SIZE) out.push(null);
  return { line: out, scoreGain };
}
const reverseRows = (m) => m.map(r => [...r].reverse());
function transpose(m) {
  const t = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) t[c][r] = m[r][c];
  return t;
}
export function moveLeft(board) {
  const m = boardToMatrix(board); let moved=false, gained=0, out=[];
  for (let r=0;r<SIZE;r++) {
    const row = m[r];
    const { line, scoreGain } = compressLine(row);
    gained += scoreGain;
    for (let c=0;c<SIZE;c++){
      const before=row[c]?.value ?? null, after=line[c]?.value ?? null;
      if (before !== after) moved = true;
    }
    out.push(line);
  }
  return { next: matrixToBoard(out), moved, gained };
}
export function moveRight(board) {
  const m = boardToMatrix(board), rev = reverseRows(m); let moved=false, gained=0, out=[];
  for (let r=0;r<SIZE;r++) {
    const { line, scoreGain } = compressLine(rev[r]);
    gained += scoreGain;
    for (let c=0;c<SIZE;c++){
      const before=rev[r][c]?.value ?? null, after=line[c]?.value ?? null;
      if (before !== after) moved = true;
    }
    out.push(line.reverse());
  }
  return { next: matrixToBoard(out), moved, gained };
}
export function moveUp(board) {
  const m = boardToMatrix(board), t=transpose(m); let moved=false, gained=0, outT=[];
  for (let r=0;r<SIZE;r++) {
    const { line, scoreGain } = compressLine(t[r]);
    gained += scoreGain;
    for (let c=0;c<SIZE;c++){
      const before=t[r][c]?.value ?? null, after=line[c]?.value ?? null;
      if (before !== after) moved = true;
    }
    outT.push(line);
  }
  return { next: matrixToBoard(transpose(outT)), moved, gained };
}
export function moveDown(board) {
  const m = boardToMatrix(board), t=transpose(m), rev=reverseRows(t); let moved=false, gained=0, outR=[];
  for (let r=0;r<SIZE;r++) {
    const { line, scoreGain } = compressLine(rev[r]);
    gained += scoreGain;
    for (let c=0;c<SIZE;c++){
      const before=rev[r][c]?.value ?? null, after=line[c]?.value ?? null;
      if (before !== after) moved = true;
    }
    outR.push(line.reverse());
  }
  return { next: matrixToBoard(transpose(outR)), moved, gained };
}
export const MOVERS = { left: moveLeft, right: moveRight, up: moveUp, down: moveDown };
