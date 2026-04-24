"use client";

import { useState, useEffect } from "react";
import LudoBoard from "@/components/LudoBoard";
import Dice from "@/components/Dice";
import { useGameState } from "@/hooks/useGameState";

export default function Home() {
  const [player, setPlayer] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { gameState, rollDice, moveToken, voteReset, resetGame } = useGameState();
  const [initialGameId, setInitialGameId] = useState<number | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (gameState) {
      if (initialGameId === null) {
        setInitialGameId(gameState.gameId);
      } else if (gameState.gameId !== initialGameId) {
        window.location.reload();
      }
    }
  }, [gameState, initialGameId]);

  useEffect(() => {
    if (gameState?.winner && !winMessage) {
      if (gameState.winner === "yellow") {
        setWinMessage("kalikan ariyilenki nirthi po!");
      } else if (gameState.winner === "blue") {
        setWinMessage("ludo alla jeevitham!");
      }

      setTimeout(() => {
        resetGame().then(() => {
          window.location.reload();
        });
      }, 3000);
    }
  }, [gameState?.winner, winMessage, resetGame]);

  const handleSelectPlayer = (name: string) => {
    setPlayer(name);
    if (name === "Niya") {
      setShowPrompt(true);
      setTimeout(() => {
        setShowPrompt(false);
      }, 3000);
    }
  };

  if (!player) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden relative">
        {deferredPrompt && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50">
            <button
              onClick={async () => {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                  setDeferredPrompt(null);
                }
              }}
              className="px-6 py-3 bg-blue-600/90 hover:bg-blue-500 rounded-full text-xs font-bold tracking-widest uppercase text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] animate-bounce"
            >
              Install on your phone
            </button>
          </div>
        )}
        <div className="z-10 w-full max-w-md flex flex-col items-center gap-12 p-12 rounded-3xl bg-black/40 backdrop-blur-xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform animate-in fade-in zoom-in duration-700">
          <h1 className="text-4xl md:text-5xl font-bold text-center tracking-wider font-dancing silver-text">
            Who is this?
          </h1>
          
          <div className="flex flex-col w-full gap-4">
            <button 
              onClick={() => handleSelectPlayer("Niya")}
              className="w-full py-4 rounded-full border border-zinc-700/50 hover:border-yellow-500/50 hover:bg-yellow-500/10 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] text-zinc-300 transition-all duration-300 tracking-widest uppercase text-sm font-medium"
            >
              Niya
            </button>
            <button 
              onClick={() => handleSelectPlayer("Sreeram")}
              className="w-full py-4 rounded-full border border-zinc-700/50 hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] text-zinc-300 transition-all duration-300 tracking-widest uppercase text-sm font-medium"
            >
              Sreeram
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (showPrompt || winMessage) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden relative bg-black z-50">
        <h1 className="text-4xl md:text-6xl font-bold text-center tracking-wider font-dancing silver-text animate-pulse duration-1000 max-w-2xl leading-relaxed">
          {winMessage || "tholkan ready aano?"}
        </h1>
      </main>
    );
  }

  // Map player name to game color
  const playerColor = player === "Sreeram" ? "yellow" : player === "Niya" ? "blue" : null;
  const isMyTurn = gameState?.turn === playerColor;
  const hasVoted = playerColor && gameState?.resetVotes.includes(playerColor);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-12 lg:p-24 overflow-hidden relative animate-in fade-in duration-1000">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm flex flex-col gap-8 md:gap-12">
        
        {/* Top Text */}
        <div className="flex flex-col items-center gap-2 mt-4 md:mt-8 h-20">
          <div className="text-zinc-500 tracking-widest uppercase text-xs">
            Playing as <span className="text-zinc-300 font-bold">{player}</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold text-center tracking-wider font-dancing silver-text">
            {isMyTurn ? "Your Turn!" : "Waiting..."}
          </h1>
        </div>

        {/* Board Component */}
        <div className="w-full flex items-center justify-center">
          <LudoBoard gameState={gameState} onMoveToken={moveToken} playerColor={playerColor} />
        </div>

        {/* Dice Component */}
        <div className="mb-2">
          {!gameState?.winner && (
            <Dice 
              onRoll={rollDice} 
              disabled={!isMyTurn || gameState?.diceValue !== null} 
              value={gameState?.diceValue || null}
              lastActionId={gameState?.lastActionId}
              turnColor={gameState?.turn}
            />
          )}
        </div>

        {/* Reset Voting */}
        <div className="mb-8 flex flex-col items-center gap-3">
          {gameState && !gameState.winner && (
            <button
              onClick={() => playerColor && voteReset(playerColor)}
              disabled={!!hasVoted}
              className="px-6 py-2 rounded-full border border-red-900/50 hover:bg-red-900/20 text-red-500/80 hover:text-red-400 text-xs tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {hasVoted ? "Voted to Reset" : "Vote to Reset Game"}
            </button>
          )}
          {gameState && gameState.resetVotes.length > 0 && !gameState.winner && (
            <div className="text-zinc-600 text-[10px] tracking-widest uppercase">
              Reset Votes: <span className="text-zinc-400">{gameState.resetVotes.length} / 2</span>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
