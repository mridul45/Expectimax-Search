
import {
    boardToMatrix,
    cloneBoard,
    getEmptyCells,
    matrixToBoard,
    moveDown,
    moveLeft,
    moveRight,
    moveUp
} from "./gameLogic";

/** ======================== Expectimax Companion ======================== **/
const DIRS = ["left", "down", "right", "up"]; // good move ordering
const SIZE = 4;

function toVals(board) {
  const m = boardToMatrix(board);
  return m.map(row => row.map(t => (t ? t.value : 0)));
}

function countMergesPotential(vals) {
  let merges = 0;
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    const v = vals[r][c]; if (!v) continue;
    if (r+1<SIZE && vals[r+1][c] === v) merges++;
    if (c+1<SIZE && vals[r][c+1] === v) merges++;
  }
  return merges;
}
function monotonicScore(vals) {
  let score = 0;
  for (let r=0;r<SIZE;r++) {
    const row = vals[r];
    const inc = row.every((v,i,a)=> i===0 || a[i-1] <= v);
    const dec = row.every((v,i,a)=> i===0 || a[i-1] >= v);
    if (inc || dec) score += 1;
  }
  for (let c=0;c<SIZE;c++) {
    const col = Array.from({length:SIZE},(_,r)=>vals[r][c]);
    const inc = col.every((v,i,a)=> i===0 || a[i-1] <= v);
    const dec = col.every((v,i,a)=> i===0 || a[i-1] >= v);
    if (inc || dec) score += 1;
  }
  return score;
}
function smoothness(vals) {
  // penalize large neighbor differences
  let pen = 0;
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    const v = vals[r][c]; if (!v) continue;
    if (r+1<SIZE) pen -= Math.abs(v - vals[r+1][c]);
    if (c+1<SIZE) pen -= Math.abs(v - vals[r][c+1]);
  }
  return pen;
}
function maxCornerBias(vals) {
  let maxV = 0, maxPos = [0,0];
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    const v = vals[r][c]; if (v > maxV) { maxV = v; maxPos = [r,c]; }
  }
  const corners = [[0,0],[0,SIZE-1],[SIZE-1,0],[SIZE-1,SIZE-1]];
  const inCorner = corners.some(([rr,cc]) => rr===maxPos[0] && cc===maxPos[1]);
  return (inCorner ? Math.log2(maxV || 2) : 0);
}

function evalBoard(board) {
  const vals = toVals(board);
  const empties = getEmptyCells(board).length;

  // weights tuned for strong play
  const wEmpty = 120.0;
  const wMerge =  12.0;
  const wMono  =   8.0;
  const wSmooth=   0.15; // small (penalty is negative)
  const wCorner=   8.0;

  const score =
    wEmpty * empties +
    wMerge * countMergesPotential(vals) +
    wMono  * monotonicScore(vals) +
    wSmooth* smoothness(vals) +
    wCorner* maxCornerBias(vals);

  return score;
}

const MOVERS = { left: moveLeft, right: moveRight, up: moveUp, down: moveDown };

function simulateMove(board, dir) {
  const { next, moved, gained } = MOVERS[dir](board);
  return { next, moved, gained };
}

function expectimax(board, depth, isPlayerTurn, startTs, timeBudgetMs) {
  // time cutoff
  if (performance.now() - startTs > timeBudgetMs) {
    return { score: evalBoard(board), dir: null, cutoff: true };
  }
  if (depth === 0) {
    return { score: evalBoard(board), dir: null, cutoff: false };
  }

  if (isPlayerTurn) {
    let bestScore = -Infinity, bestDir = null;
    for (const dir of DIRS) {
      const { next, moved, gained } = simulateMove(board, dir);
      if (!moved) continue;
      const child = expectimax(next, depth - 1, false, startTs, timeBudgetMs);
      const value = child.score + gained * 0.6; // prioritize immediate merges slightly
      if (value > bestScore) { bestScore = value; bestDir = dir; }
      if (child.cutoff) return { score: bestScore, dir: bestDir, cutoff: true };
    }
    // if all moves are dead, just evaluate
    if (bestDir === null) return { score: evalBoard(board), dir: null, cutoff: false };
    return { score: bestScore, dir: bestDir, cutoff: false };
  } else {
    // chance node: average over spawns (2 with 0.9, 4 with 0.1) at all empty cells
    const empties = getEmptyCells(board);
    if (!empties.length) return { score: evalBoard(board), dir: null, cutoff: false };

    let acc = 0;
    // Optional optimization: sample up to K empties to keep it fast
    const SAMPLE_K = 6;
    const cells = empties.length > SAMPLE_K
      ? shuffle(empties).slice(0, SAMPLE_K)
      : empties;

    for (const pos of cells) {
      // spawn 2
      {
        const b2 = cloneBoard(board);
        b2[pos] = { id: "__tmp", value: 2, justMerged: false, justSpawned: false };
        const child = expectimax(b2, depth - 1, true, startTs, timeBudgetMs);
        acc += 0.9 * child.score;
        if (child.cutoff) return { score: acc / cells.length, dir: null, cutoff: true };
      }
      // spawn 4
      {
        const b4 = cloneBoard(board);
        b4[pos] = { id: "__tmp", value: 4, justMerged: false, justSpawned: false };
        const child = expectimax(b4, depth - 1, true, startTs, timeBudgetMs);
        acc += 0.1 * child.score;
        if (child.cutoff) return { score: acc / cells.length, dir: null, cutoff: true };
      }
    }
    return { score: acc / cells.length, dir: null, cutoff: false };
  }
}
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

export function chooseBestMoveExpectimax(board, maxDepth = 6, timeBudgetMs = 45) {
  // iterative deepening under a small time budget keeps UI responsive
  const start = performance.now();
  let bestDir = null, bestScore = -Infinity;

  for (let depth = 2; depth <= maxDepth; depth += 2) {
    const res = expectimax(board, depth, true, start, timeBudgetMs);
    if (res.dir) { bestDir = res.dir; bestScore = res.score; }
    if (performance.now() - start > timeBudgetMs) break;
  }
  // fallback: try legal DIRS if time ran out and no dir was chosen
  if (!bestDir) {
    for (const d of DIRS) {
      if (simulateMove(board, d).moved) { bestDir = d; break; }
    }
  }
  return bestDir;
}
