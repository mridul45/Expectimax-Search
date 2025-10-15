import React, { useEffect, useRef, useState } from "react";
import { chooseBestMoveExpectimax } from "./utils/companion";
import { valueClasses } from "./utils/tailwind";
import {
    boardToMatrix,
    cloneBoard,
    emptyBoard,
    hasMoves,
    moveDown,
    moveLeft,
    moveRight,
    moveUp,
    SIZE,
    spawnTile
} from "./utils/gameLogic";
import {
  handleMove as handleMoveLogic,
  newGame as newGameLogic,
  undo as undoLogic,
  onTouchStart as onTouchStartLogic,
  onTouchEnd as onTouchEndLogic,
} from "./utils/gameManager";

/** ============================== App ============================== **/
export default function App() {
  const [board, setBoard]   = useState(() => spawnTile(spawnTile(emptyBoard())));
  const [score, setScore]   = useState(0);
  const [best, setBest]     = useState(() => Number(localStorage.getItem("best_2048") || 0));
  const [won, setWon]       = useState(false);
  const [over, setOver]     = useState(false);
  const [tick, setTick]     = useState(0); // for CSS nudge
  const [companion, setCompanion] = useState(false);
  const [speedMs, setSpeedMs]     = useState(140); // UI cadence
  const [maxDepth, setMaxDepth]   = useState(6);   // AI depth (even numbers only recommended)
  const [timeBudget, setTimeBudget] = useState(55); // ms per move think time

  const prevRef = useRef({ board: null, score: 0 });
  const touchStart = useRef({ x: 0, y: 0 });
  const loopRef = useRef(null);

  useEffect(() => { localStorage.setItem("best_2048", String(best)); }, [best]);

  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowLeft:"left", ArrowRight:"right", ArrowUp:"up", ArrowDown:"down", a:"left", d:"right", w:"up", s:"down" };
      const dir = map[e.key]; if (!dir) return; e.preventDefault(); handleMove(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board, score, won, over]);

  // Companion loop
  useEffect(() => {
    clearInterval(loopRef.current);
    if (!companion || over || won) return;
    loopRef.current = setInterval(() => {
      const dir = chooseBestMoveExpectimax(board, maxDepth, timeBudget);
      if (dir) handleMove(dir);
    }, Math.max(80, speedMs));
    return () => clearInterval(loopRef.current);
  }, [companion, board, over, won, speedMs, maxDepth, timeBudget]);

  function commitMove(nextBoard, gained) {
    // clear transient, then spawn one new tile (animates in)
    let b = nextBoard.map((t) => (t ? { ...t, justSpawned: false } : null));
    b = spawnTile(b);
    setBoard(b);
    const nextScore = score + gained;
    setScore(nextScore);
    if (nextScore > best) setBest(nextScore);
    if (!won && b.some(t => t && t.value >= 2048)) setWon(true);
    if (!hasMoves(b)) setOver(true);
    setTick((x) => x + 1);
  }

  const handleMove = (direction) => handleMoveLogic(direction, {
    over,
    prevRef,
    board,
    score,
    commitMove,
  });

  const newGame = () => newGameLogic({
    setBoard,
    setScore,
    setWon,
    setOver,
    setTick,
  });

  const undo = () => undoLogic({
    prevRef,
    setBoard,
    setScore,
    setWon,
    setOver,
    setTick,
  });

  const onTouchStart = (e) => onTouchStartLogic(e, { touchStart });

  const onTouchEnd = (e) => onTouchEndLogic(e, { touchStart, handleMove });

  const matrix  = boardToMatrix(board);
  const TILE = 92;     // px
  const GAP  = 8;      // px (gap-2)

  const boardPx = SIZE * TILE + (SIZE + 1) * GAP;

  return (
    <div
      className="relative min-h-screen text-slate-100 bg-slate-950 overflow-hidden selection:bg-cyan-400/20 selection:text-cyan-100"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* local keyframes for pop effects */}
      <style>{`
        @keyframes tile-pop-in { from { transform: scale(0.7); opacity: .6 } to { transform: scale(1); opacity: 1 } }
        @keyframes tile-merge-pop { 30% { transform: scale(1.08) } 100% { transform: scale(1) } }
      `}</style>

      {/* ambient glow */}
      <div className="pointer-events-none absolute -inset-40 blur-3xl">
        <div className="absolute left-10 top-10 h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-indigo-500/15 to-cyan-400/10" />
        <div className="absolute right-20 top-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-emerald-400/15 to-indigo-400/10" />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan-400/10 to-purple-400/10" />
      </div>

      {/* top bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-extrabold bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            2048
          </div>
          <div className="text-xs text-slate-400">Dark • Liquid-Glass</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatCard label="Score" value={score} />
          <StatCard label="Best"  value={best} />
          <button
            onClick={() => setCompanion(v => !v)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold backdrop-blur-md border transition
              ${companion
                ? "border-emerald-400/40 bg-emerald-400/20 hover:bg-emerald-400/25"
                : "border-white/10 bg-white/10 hover:bg-white/15"}`}
            title="Auto-play Companion (Expectimax)"
          >
            🤖 Companion: {companion ? "On" : "Off"}
          </button>

          {/* Tweaks for testing */}
          <label className="ml-2 text-xs text-slate-400">Speed</label>
          <input type="range" min="90" max="300" value={speedMs}
            onChange={(e)=>setSpeedMs(parseInt(e.target.value))}
            className="h-1.5 w-24 accent-cyan-400"
          />
          <label className="ml-2 text-xs text-slate-400">Depth</label>
          <input type="range" min="4" max="8" step="2" value={maxDepth}
            onChange={(e)=>setMaxDepth(parseInt(e.target.value))}
            className="h-1.5 w-20 accent-indigo-400"
          />
          <label className="ml-2 text-xs text-slate-400">Think(ms)</label>
          <input type="range" min="30" max="90" value={timeBudget}
            onChange={(e)=>setTimeBudget(parseInt(e.target.value))}
            className="h-1.5 w-24 accent-emerald-400"
          />

          <button
            onClick={undo}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur-md hover:bg-white/15 transition"
            title="Undo"
          >
            ↶ Undo
          </button>
          <button
            onClick={() => { setCompanion(false); newGame(); }}
            className="rounded-xl border border-cyan-400/30 bg-gradient-to-b from-indigo-400/30 to-cyan-400/20 px-3 py-2 text-sm font-semibold backdrop-blur-md hover:brightness-110 transition"
          >
            ⟲ New Game
          </button>
        </div>
      </header>

      {/* stage */}
      <main className="relative z-10 grid place-items-center px-4 pb-8">
        <div
          className="relative rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-md"
          style={{ width: boardPx, height: boardPx }}
          data-tick={tick}
        >
          {/* background cells */}
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: SIZE * SIZE }, (_, i) => (
              <div
                key={`bg-${i}`}
                className="h-[92px] w-[92px] rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>

          {/* tiles with smooth tween */}
          <div className="absolute inset-2">
            {matrix.map((row, r) =>
              row.map((tile, c) => {
                if (!tile) return null;
                const { id, value, justMerged, justSpawned } = tile;
                const left = c * (TILE + GAP);
                const top  = r * (TILE + GAP);
                const grads = valueClasses(value);
                return (
                  <div
                    key={id}
                    className={[
                      "absolute grid h-[92px] w-[92px] place-items-center rounded-2xl",
                      "border border-white/10 text-slate-50 font-extrabold",
                      "bg-gradient-to-b shadow-xl",
                      "transition-[left,top,transform,opacity] duration-200 ease-out will-change-transform",
                      justSpawned ? "ring-2 ring-cyan-300/50"     : "",
                      justMerged  ? "ring-2 ring-emerald-400/60"   : "",
                      grads,
                    ].join(" ")}
                    style={{
                      left, top,
                      animation: justSpawned
                        ? "tile-pop-in 160ms ease-out"
                        : justMerged
                        ? "tile-merge-pop 160ms ease-out"
                        : undefined,
                    }}
                  >
                    <span className="drop-shadow">{value}</span>
                  </div>
                );
              })
            )}
          </div>

          {(won || over) && (
            <div className="absolute inset-0 grid place-items-center rounded-3xl bg-slate-950/50 backdrop-blur-sm">
              <div className="w-[min(92vw,420px)] rounded-2xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-md">
                <h2 className="bg-gradient-to-r from-emerald-300 to-indigo-400 bg-clip-text text-xl font-bold text-transparent">
                  {won ? "You made 2048! 🎉" : "No moves left 😵"}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  {won ? "Keep going or start fresh." : "Try a new run!"}
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  {!over && (
                    <button
                      onClick={() => setWon(false)}
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur-md hover:bg-white/15 transition"
                    >
                      Continue
                    </button>
                  )}
                  <button
                    onClick={() => { setCompanion(false); newGame(); }}
                    className="rounded-xl border border-cyan-400/30 bg-gradient-to-b from-indigo-400/30 to-cyan-400/20 px-3 py-2 text-sm font-semibold backdrop-blur-md hover:brightness-110 transition"
                  >
                    New Game
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 text-slate-400">
          <span>Use Arrow Keys / WASD • Swipe on touch</span>
          <span className="text-slate-500">Undo • 🤖 Expectimax Companion</span>
        </div>
      </main>
    </div>
  );
}

/** small UI piece **/
function StatCard({ label, value }) {
  return (
    <div className="min-w-[110px] rounded-xl border border-white/10 bg-white/10 px-4 py-2 shadow backdrop-blur-md">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}