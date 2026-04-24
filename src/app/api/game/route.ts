import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export type PlayerColor = 'yellow' | 'blue';

export type Token = {
  id: number;
  progress: number; // -1 (Base) to 56 (Won)
};

export type GameState = {
  gameId: number;
  turn: PlayerColor;
  diceValue: number | null;
  sixCount: number;
  tokens: {
    yellow: Token[];
    blue: Token[];
  };
  winner: PlayerColor | null;
  log: string;
  lastActionId: number;
  resetVotes: PlayerColor[];
};

const STATE_KEY = 'ludo_game_state_v1';

const getInitialState = (): GameState => ({
  gameId: Date.now(),
  turn: 'yellow',
  diceValue: null,
  sixCount: 0,
  tokens: {
    yellow: [0, 1, 2, 3].map(id => ({ id, progress: -1 })),
    blue: [0, 1, 2, 3].map(id => ({ id, progress: -1 })),
  },
  winner: null,
  log: "Game started! Yellow's turn.",
  lastActionId: Date.now(),
  resetVotes: []
});

const SAFE_SPOTS = [0, 8, 21, 26, 34, 47];

export async function GET() {
  let state = await kv.get<GameState>(STATE_KEY);
  if (!state) {
    state = getInitialState();
    await kv.set(STATE_KEY, state);
  }
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action, tokenId, playerColor } = body;
  
  let state = await kv.get<GameState>(STATE_KEY);
  if (!state) {
    state = getInitialState();
  }

  if (action === 'VOTE_RESET') {
    if (playerColor && !state.resetVotes.includes(playerColor as PlayerColor)) {
      state.resetVotes.push(playerColor as PlayerColor);
      if (state.resetVotes.length === 2) {
        state = getInitialState();
        state.log = "Game was reset by both players!";
        await kv.set(STATE_KEY, state);
        return NextResponse.json(state);
      }
      await kv.set(STATE_KEY, state);
    }
    return NextResponse.json(state);
  }

  if (state.winner) {
    if (action === 'RESET_GAME') {
      state = getInitialState();
      await kv.set(STATE_KEY, state);
    }
    return NextResponse.json(state);
  }

  const switchTurn = (logMsg?: string) => {
    state.turn = state.turn === 'yellow' ? 'blue' : 'yellow';
    state.sixCount = 0;
    state.diceValue = null;
    if (logMsg) state.log = logMsg;
    else state.log = `${state.turn.charAt(0).toUpperCase() + state.turn.slice(1)}'s turn.`;
  };

  const getValidMoves = (color: PlayerColor, dice: number) => {
    return state.tokens[color].filter(t => {
      if (t.progress === 56) return false;
      if (t.progress === -1) return dice === 6;
      return t.progress + dice <= 56;
    });
  };

  if (action === 'ROLL_DICE') {
    if (state.diceValue !== null) {
      return NextResponse.json({ error: "Already rolled! Must move a token." }, { status: 400 });
    }

    // Secure RNG avoiding modulo bias
    const array = new Uint32Array(1);
    const range = 6;
    const maxSafe = 0xffffffff - (0xffffffff % range);
    let randomValue = 0;
    do {
      crypto.getRandomValues(array);
      randomValue = array[0];
    } while (randomValue >= maxSafe);

    const roll = (randomValue % range) + 1;
    
    state.lastActionId = Date.now();

    if (roll === 6) {
      state.sixCount += 1;
      if (state.sixCount === 3) {
        switchTurn("Rolled three 6s! Turn skipped.");
        await kv.set(STATE_KEY, state);
        return NextResponse.json(state);
      }
    } else {
      state.sixCount = 0;
    }

    state.diceValue = roll;
    state.log = `${state.turn.charAt(0).toUpperCase() + state.turn.slice(1)} rolled a ${roll}.`;

    const validMoves = getValidMoves(state.turn, roll);
    if (validMoves.length === 0) {
      // Auto-skip if no moves possible
      if (roll === 6) {
        state.diceValue = null;
        state.log += " No valid moves. Roll again.";
      } else {
        switchTurn(state.log + " No valid moves. Turn ends.");
      }
    }

    await kv.set(STATE_KEY, state);
    return NextResponse.json(state);
  }

  if (action === 'MOVE_TOKEN') {
    if (state.diceValue === null) {
      return NextResponse.json({ error: "Must roll the dice first!" }, { status: 400 });
    }

    const color = state.turn;
    const token = state.tokens[color].find(t => t.id === tokenId);

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 400 });
    }

    const validMoves = getValidMoves(color, state.diceValue);
    if (!validMoves.find(t => t.id === tokenId)) {
      return NextResponse.json({ error: "Invalid move for this token" }, { status: 400 });
    }

    // Execute Move
    let extraTurnGranted = state.diceValue === 6; // Rolling 6 gives an extra turn
    let captureMessage = "";

    if (token.progress === -1) {
      token.progress = 0;
    } else {
      token.progress += state.diceValue;

      // Check capture
      if (token.progress <= 50) { // Only main path can have captures
        const offset = color === 'yellow' ? 0 : 26;
        const mainPathPos = (token.progress + offset) % 52;
        
        if (!SAFE_SPOTS.includes(mainPathPos)) {
          const opponentColor = color === 'yellow' ? 'blue' : 'yellow';
          const oppOffset = opponentColor === 'yellow' ? 0 : 26;
          
          let captured = false;
          state.tokens[opponentColor].forEach(oppToken => {
            if (oppToken.progress >= 0 && oppToken.progress <= 50) {
              const oppMainPathPos = (oppToken.progress + oppOffset) % 52;
              if (mainPathPos === oppMainPathPos) {
                oppToken.progress = -1; // Sent back to base!
                captured = true;
              }
            }
          });

          if (captured) {
            extraTurnGranted = true;
            captureMessage = " Captured opponent! Extra roll granted.";
          }
        }
      }
    }

    // Check Win
    if (state.tokens[color].every(t => t.progress === 56)) {
      state.winner = color;
      state.log = `${color.toUpperCase()} WINS THE GAME!`;
      state.diceValue = null;
      await kv.set(STATE_KEY, state);
      return NextResponse.json(state);
    }

    // Finalize turn
    state.diceValue = null;
    state.lastActionId = Date.now();

    if (extraTurnGranted) {
      state.log = `Moved.${captureMessage} Roll again!`;
    } else {
      switchTurn();
    }

    await kv.set(STATE_KEY, state);
    return NextResponse.json(state);
  }

  if (action === 'RESET_GAME') {
    state = getInitialState();
    await kv.set(STATE_KEY, state);
    return NextResponse.json(state);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
