import { cloneBoard, moveLeft, moveRight, moveUp, moveDown, spawnTile, emptyBoard } from "./gameLogic";

function doMove(fn, { over, prevRef, board, score, commitMove }) {
  if (over) return;
  prevRef.current = { board: cloneBoard(board), score };
  const { next, moved, gained } = fn(board);
  if (!moved) return;
  commitMove(next, gained);
}

export function handleMove(direction, options) {
  if (direction === "left") return doMove(moveLeft, options);
  if (direction === "right") return doMove(moveRight, options);
  if (direction === "up") return doMove(moveUp, options);
  if (direction === "down") return doMove(moveDown, options);
}

export function newGame({ setBoard, setScore, setWon, setOver, setTick }) {
  setBoard(spawnTile(spawnTile(emptyBoard())));
  setScore(0); setWon(false); setOver(false); setTick((x)=>x+1);
}

export function undo({ prevRef, setBoard, setScore, setWon, setOver, setTick }) {
  if (!prevRef.current.board) return;
  setBoard(prevRef.current.board);
  setScore(prevRef.current.score);
  setWon(false); setOver(false); setTick((x)=>x+1);
}

export function onTouchStart(e, { touchStart }){
  const t=e.touches[0];
  touchStart.current={x:t.clientX,y:t.clientY};
}

export function onTouchEnd(e, { touchStart, handleMove }){
  const t=e.changedTouches[0];
  const dx=t.clientX-touchStart.current.x, dy=t.clientY-touchStart.current.y;
  const ax=Math.abs(dx), ay=Math.abs(dy);
  if (Math.max(ax,ay)<20) return;
  const direction = ax>ay ? (dx>0?"right":"left") : (dy>0?"down":"up");
  handleMove(direction);
}
