import React, { useState, useEffect } from "react";
import { Star, ChevronDown, ChevronUp, Crown } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { getTokenCoordinate } from "@/utils/boardMap";
import type { GameState } from "@/app/api/game/route";

const Token = ({ color, boardRotation }: { color: "yellow" | "blue", boardRotation: number }) => {
  const innerBg = color === "yellow" ? "bg-yellow-500" : "bg-blue-500";
  const shadowColor = color === "yellow" ? "rgba(234, 179, 8, 0.6)" : "rgba(59, 130, 246, 0.6)";
  
  return (
    <div 
      className="relative w-[70%] h-[70%] md:w-[80%] md:h-[80%] rounded-full flex items-center justify-center shadow-[0_4px_6px_rgba(0,0,0,0.7),inset_0_-3px_5px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.9)]"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #e4e4e7 100%)",
        transform: `rotate(${-boardRotation}deg)`,
        transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      <div 
        className={clsx(
          "w-[65%] h-[65%] rounded-full flex items-center justify-center border border-black/20",
          innerBg
        )}
        style={{
          boxShadow: `inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3), 0 0 10px ${shadowColor}`
        }}
      >
        <Crown className="w-[40%] h-[40%] text-white drop-shadow-md" strokeWidth={3} />
      </div>
    </div>
  );
};

const playMoveSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Quick "tap" sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

interface LudoBoardProps {
  gameState?: GameState | null;
  onMoveToken?: (id: number) => void;
  playerColor?: string | null;
}

export default function LudoBoard({ gameState, onMoveToken, playerColor }: LudoBoardProps) {
  const boardRotation = playerColor?.toLowerCase() === "yellow" ? 180 : 0;
  const [visualProgress, setVisualProgress] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (gameState) {
      ['yellow', 'blue'].forEach(color => {
        gameState.tokens[color as keyof typeof gameState.tokens].forEach(t => {
          init[`${color}-${t.id}`] = t.progress;
        });
      });
    }
    return init;
  });

  // Sync actual progress to visual progress step-by-step
  useEffect(() => {
    if (!gameState) return;

    let hasChanges = false;
    const nextVisual = { ...visualProgress };

    ['yellow', 'blue'].forEach(color => {
      gameState.tokens[color as keyof typeof gameState.tokens].forEach(t => {
        const key = `${color}-${t.id}`;
        const current = visualProgress[key] ?? t.progress;
        
        if (current !== t.progress) {
          hasChanges = true;
          if (t.progress === -1) {
            nextVisual[key] = -1; // Captured -> Teleport to base immediately
          } else if (current === -1) {
            nextVisual[key] = 0; // Coming out of base -> Jump to 0
            playMoveSound();
          } else {
            // Walk 1 step towards target
            nextVisual[key] = current + (t.progress > current ? 1 : -1);
            playMoveSound();
          }
        }
      });
    });

    if (hasChanges) {
      const timer = setTimeout(() => {
        setVisualProgress(nextVisual);
      }, 250); // Speed of walking
      return () => clearTimeout(timer);
    }
  }, [gameState, visualProgress]);

  const cells = [];

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      // Bases
      if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8)) {
        if (r === 0 && c === 0) {
          cells.push(<div key="top-left-base" className="col-span-6 row-span-6 bg-[#18181b] border border-zinc-500/50" />);
        } else if (r === 0 && c === 9) {
          cells.push(
            <div key="top-right-base" className="col-span-6 row-span-6 p-2 sm:p-4 flex items-center justify-center bg-[#18181b] border border-zinc-500/50">
              <div className="w-full h-full rounded-2xl border border-yellow-500/50 bg-yellow-500/15 relative shadow-[inset_0_0_20px_rgba(234,179,8,0.1)]" />
            </div>
          );
        } else if (r === 9 && c === 0) {
          cells.push(
            <div key="bottom-left-base" className="col-span-6 row-span-6 p-2 sm:p-4 flex items-center justify-center bg-[#18181b] border border-zinc-500/50">
              <div className="w-full h-full rounded-2xl border border-blue-500/50 bg-blue-500/15 relative shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]" />
            </div>
          );
        } else if (r === 9 && c === 9) {
          cells.push(<div key="bottom-right-base" className="col-span-6 row-span-6 bg-[#18181b] border border-zinc-500/50" />);
        }
      } 
      // Center Home
      else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
        if (r === 6 && c === 6) {
          cells.push(
            <div key="center-home" className="col-span-3 row-span-3 relative overflow-hidden border border-zinc-500/50 bg-[#18181b]">
              <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
                <polygon points="0,0 100,0 50,50" className="fill-yellow-500/80" />
                <polygon points="0,100 50,50 0,0" className="fill-blue-500/80" />
                <polygon points="100,100 0,100 50,50" className="fill-zinc-700/40" />
                <polygon points="100,0 100,100 50,50" className="fill-zinc-700/40" />
                
                <line x1="0" y1="0" x2="100" y2="100" className="stroke-zinc-500/50" strokeWidth="1.5" />
                <line x1="100" y1="0" x2="0" y2="100" className="stroke-zinc-500/50" strokeWidth="1.5" />
              </svg>
            </div>
          );
        }
      } 
      // Paths
      else {
        const isYellowStretch = c === 7 && r >= 1 && r <= 5;
        const isBlueStretch = c === 7 && r >= 9 && r <= 13;
        const isYellowStart = r === 1 && c === 8;
        const isBlueStart = r === 13 && c === 6;
        const isTopStar = r === 2 && c === 6;
        const isBottomStar = r === 12 && c === 8;
        const isLeftStar = r === 8 && c === 2;
        const isRightStar = r === 6 && c === 12;
        
        let cellContent = null;
        if (isTopStar || isBottomStar || isLeftStar || isRightStar) {
          cellContent = <Star size={18} className="text-zinc-500" />;
        } else if (isYellowStart) {
          cellContent = <ChevronDown size={22} className="text-zinc-950" />;
        } else if (isBlueStart) {
          cellContent = <ChevronUp size={22} className="text-white" />;
        } else if (r === 0 && c === 7) {
          cellContent = <ChevronDown size={22} className="text-yellow-500/90" />;
        } else if (r === 14 && c === 7) {
          cellContent = <ChevronUp size={22} className="text-blue-500/90" />;
        }

        cells.push(
          <div
            key={`cell-${r}-${c}`}
            className={clsx(
              "flex items-center justify-center border border-zinc-500/50 transition-all duration-300 relative",
              isYellowStretch && "bg-yellow-500/25",
              isBlueStretch && "bg-blue-500/25",
              isYellowStart && "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]",
              isBlueStart && "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]",
              !isYellowStretch && !isBlueStretch && !isYellowStart && !isBlueStart && "bg-[#18181b]"
            )}
          >
            {cellContent}
            {isYellowStart && <div className="absolute inset-1 border border-black/15 rounded-sm" />}
            {isBlueStart && <div className="absolute inset-1 border border-white/25 rounded-sm" />}
          </div>
        );
      }
    }
  }

  // Group tokens for overlapping
  const cellGroups: Record<string, { id: number, color: string }[]> = {};
  if (gameState) {
    ['yellow', 'blue'].forEach((color) => {
      gameState.tokens[color as keyof typeof gameState.tokens].forEach(t => {
        const vp = visualProgress[`${color}-${t.id}`] ?? t.progress;
        if (vp >= 0 && vp <= 55) { // Group them if they are on the path
          const pos = getTokenCoordinate(color as "yellow" | "blue", vp, t.id);
          const key = `${pos.r},${pos.c}`;
          if (!cellGroups[key]) cellGroups[key] = [];
          cellGroups[key].push({ id: t.id, color });
        }
      });
    });
  }

  return (
    <div className="w-full max-w-[500px] aspect-square mx-auto p-2 sm:p-4 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-600 shadow-[0_0_40px_rgba(255,255,255,0.05)] relative">
      <div 
        className="w-full h-full grid border border-zinc-500/50 bg-[#18181b] relative"
        style={{ 
          gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
          transform: `rotate(${boardRotation}deg)`,
          transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        {cells}

        {/* Dynamic Tokens Overlay */}
        {gameState && (
          <div className="absolute inset-0 pointer-events-none">
            {['yellow', 'blue'].map((color) => 
              gameState.tokens[color as keyof typeof gameState.tokens].map((t) => {
                const vp = visualProgress[`${color}-${t.id}`] ?? t.progress;
                const pos = getTokenCoordinate(color as "yellow" | "blue", vp, t.id);
                const top = `${(pos.r / 15) * 100}%`;
                const left = `${(pos.c / 15) * 100}%`;
                
                let scale = 1;
                let translateX = "0%";
                let translateY = "0%";

                if (vp >= 0 && vp <= 55) {
                  const group = cellGroups[`${pos.r},${pos.c}`];
                  if (group && group.length > 1) {
                    scale = 0.75;
                    const index = group.findIndex(x => x.id === t.id && x.color === color);
                    if (group.length === 2) {
                      translateX = index === 0 ? "-15%" : "15%";
                    } else if (group.length === 3) {
                      translateX = index === 0 ? "-15%" : index === 1 ? "15%" : "0%";
                      translateY = index === 0 ? "10%" : index === 1 ? "10%" : "-15%";
                    } else {
                      translateX = index % 2 === 0 ? "-15%" : "15%";
                      translateY = Math.floor(index / 2) === 0 ? "-15%" : "15%";
                    }
                  }
                }
                
                // A token is clickable if it's the current player's turn, the player is playing that color, and the dice has been rolled
                const isClickable = gameState.turn === color && playerColor?.toLowerCase() === color && gameState.diceValue !== null && onMoveToken;
                
                return (
                  <motion.div
                    key={`${color}-${t.id}`}
                    initial={false}
                    animate={{ top, left, scale, x: translateX, y: translateY }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={clsx(
                      "absolute w-[6.66%] h-[6.66%] flex items-center justify-center z-20 pointer-events-auto",
                      isClickable && "cursor-pointer hover:scale-110 z-30"
                    )}
                    onClick={() => isClickable && onMoveToken(t.id)}
                  >
                    <Token color={color as "yellow" | "blue"} boardRotation={boardRotation} />
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
