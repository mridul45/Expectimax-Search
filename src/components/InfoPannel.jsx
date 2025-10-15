// src/components/InfoPanel.jsx
import React from "react";

export default function InfoPanel({ open, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={[
          "fixed right-0 top-0 z-50 h-full w-[min(560px,92vw)]",
          "rounded-l-3xl border-l border-white/10 bg-white/10 shadow-2xl backdrop-blur-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            Game & Companion — Deep Dive
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/15"
            aria-label="Close info"
          >
            ✕
          </button>
        </div>

        <div className="h-[calc(100%-60px)] overflow-y-auto px-5 py-4 space-y-6 text-sm text-slate-200">
          {/* Section: Board Model */}
          <section>
            <h4 className="text-base font-semibold text-slate-100">Board & Tile Model</h4>
            <p className="mt-1 text-slate-300">
              The grid is 4×4. Each cell holds either <code className="px-1 rounded bg-white/10">null</code> or a tile:
              <code className="px-1 rounded bg-white/10">{"{ id, value, justMerged, justSpawned }"}</code>.
              We keep a flat array of 16, and convert to a matrix when processing rows/columns.
            </p>
          </section>

          {/* Section: Move / Merge */}
          <section>
            <h4 className="text-base font-semibold text-slate-100">Move & Merge Logic</h4>
            <ol className="mt-2 list-decimal pl-5 space-y-1 text-slate-300">
              <li><b>Extract a line</b> (row/column) in the chosen direction.</li>
              <li><b>Compress</b>: drop <code className="px-1 rounded bg-white/10">null</code>s so tiles slide tightly.</li>
              <li><b>Merge pairs</b>: equal neighbors combine once into <em>double</em>, add to score, mark <code className="px-1 rounded bg-white/10">justMerged</code>.</li>
              <li><b>Pad</b> with <code className="px-1 rounded bg-white/10">null</code>s to restore length 4.</li>
              <li>Rebuild the board. If anything changed, spawn a new 2 (90%) or 4 (10%).</li>
            </ol>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[13px] font-semibold text-slate-100">Worked example (slide LEFT):</div>
              <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-slate-300">
{`Row before:    [2, 2, 4, null]
Compress:       [2, 2, 4]
Merge:          [4,   4]
Pad to len 4:   [4, 4, null, null]`}
              </pre>
              <p className="mt-2 text-slate-300">
                Score increases by the value of merged tiles (here +4). Only one merge per pair per move.
              </p>
            </div>
          </section>

          {/* Section: Win / Game Over */}
          <section>
            <h4 className="text-base font-semibold text-slate-100">Win & Game Over</h4>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-300">
              <li><b>Win</b> when any tile reaches <b>2048+</b> (we show a celebratory overlay).</li>
              <li><b>Game Over</b> when the grid has <em>no empty cells</em> and <em>no adjacent equals</em> in any row/col.</li>
            </ul>
          </section>

          {/* Section: Rendering & Animations */}
          <section>
            <h4 className="text-base font-semibold text-slate-100">Rendering & Animations</h4>
            <p className="mt-1 text-slate-300">
              Tiles render on an absolute layer sized to the board; each tile’s <code className="px-1 rounded bg-white/10">left/top</code> is derived from its
              row/col. Tailwind transitions tween position smoothly. Fresh tiles <em>pop-in</em>; merged tiles do a subtle <em>pop</em>.
            </p>
          </section>

          {/* Section: Companion */}
          <section>
            <h4 className="text-base font-semibold text-slate-100">Companion (Expectimax)</h4>
            <p className="mt-1 text-slate-300">
              The Companion uses <b>Expectimax</b>, a stochastic game-tree search that alternates between your move and
              a random spawn. Instead of worst-case (like Minimax), chance nodes take a <em>probability-weighted average</em>
              over outcomes (2 with 90%, 4 with 10%) across empty cells.
            </p>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[13px] font-semibold text-slate-100">Tiny tree snapshot:</div>
              <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-slate-300">
{`Depth 1 (Player): try {Left, Down, Right, Up}
  ↳ Depth 2 (Chance): for each move's board,
     expand spawns: 0.9 * eval(board with 2) + 0.1 * eval(board with 4)
Select the move with the highest expected value.`}
              </pre>
            </div>

            <p className="mt-2 text-slate-300">
              At leaves (or when time runs out), we score a board with a weighted heuristic:
            </p>
            <ul className="mt-2 list-disc pl-5 text-slate-300">
              <li><b>Empties</b> ↑ (most important; space = survivability)</li>
              <li><b>Merge potential</b> ↑ (adjacent equals)</li>
              <li><b>Monotonicity</b> ↑ (rows/cols sorted to funnel merges)</li>
              <li><b>Smoothness</b> ↑ (penalize jagged neighbor gaps)</li>
              <li><b>Corner bias</b> ↑ (largest tile parked in a corner)</li>
            </ul>
          </section>

          {/* Section: Sliders */}
          <section>
            <h4 className="text-base font-semibold text-slate-100">Depth · Think(ms) · Speed</h4>
            <ul className="mt-2 list-disc pl-5 text-slate-300">
              <li><b>Depth</b> — how far the tree looks (use even numbers: 4, 6, 8). Higher = smarter, costlier.</li>
              <li><b>Think (ms)</b> — per-move time budget. The AI uses <em>iterative deepening</em> and stops when time’s up.</li>
              <li><b>Speed</b> — delay between auto moves. Affects pacing, not intelligence.</li>
            </ul>
            <p className="mt-2 text-slate-300">
              <b>Pro tip:</b> For consistent 2048+, try Depth 6–8 and Think 55–75ms. If the UI feels heavy, drop to Depth 4–6.
            </p>
          </section>

          {/* Section: Example Walkthrough */}
          <section>
            <h4 className="text-base font-semibold text-slate-100">Worked Mini-Turn</h4>
            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <pre className="whitespace-pre-wrap text-[12px] leading-5 text-slate-300">
{`Board (top row only for brevity):
[ 2, 2, 4, . ]   '.' means empty

Player considers LEFT:
  compress → [2,2,4] → merge → [4,4] → pad → [4,4,.,.]
Chance spawns (on an empty cell):
  90%: place 2 → eval(board_2)
  10%: place 4 → eval(board_4)

Expected value for LEFT = 0.9*eval(board_2) + 0.1*eval(board_4)
Repeat for DOWN/RIGHT/UP; pick the move with highest expected value.`}
              </pre>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
