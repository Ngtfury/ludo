import { useState, useEffect, useCallback } from 'react';
import type { GameState } from '@/app/api/game/route';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/game');
      const data = await res.json();
      setGameState(data);
    } catch (e) {
      console.error("Failed to fetch game state", e);
    }
  }, []);

  useEffect(() => {
    fetchState();
    if (isPolling) {
      const interval = setInterval(fetchState, 1000);
      return () => clearInterval(interval);
    }
  }, [fetchState, isPolling]);

  const rollDice = async () => {
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ROLL_DICE' })
      });
      const data = await res.json();
      if (res.ok) setGameState(data);
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const moveToken = async (tokenId: number) => {
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MOVE_TOKEN', tokenId })
      });
      const data = await res.json();
      if (res.ok) setGameState(data);
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const resetGame = async () => {
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_GAME' })
      });
      const data = await res.json();
      if (res.ok) setGameState(data);
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const voteReset = async (playerColor: string) => {
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VOTE_RESET', playerColor })
      });
      const data = await res.json();
      if (res.ok) setGameState(data);
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  return {
    gameState,
    rollDice,
    moveToken,
    resetGame,
    voteReset,
    setIsPolling
  };
}
