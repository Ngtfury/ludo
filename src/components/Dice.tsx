import React, { useState, useEffect } from "react";
import clsx from "clsx";

const Dot = ({ dotColor }: { dotColor: string }) => <div className={clsx("w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]", dotColor)} />;

const getDots = (val: number, dotColor: string) => {
  switch (val) {
    case 1:
      return <div className="col-start-2 row-start-2"><Dot dotColor={dotColor} /></div>;
    case 2:
      return (
        <>
          <div className="col-start-1 row-start-1"><Dot dotColor={dotColor} /></div>
          <div className="col-start-3 row-start-3"><Dot dotColor={dotColor} /></div>
        </>
      );
    case 3:
      return (
        <>
          <div className="col-start-1 row-start-1"><Dot dotColor={dotColor} /></div>
          <div className="col-start-2 row-start-2"><Dot dotColor={dotColor} /></div>
          <div className="col-start-3 row-start-3"><Dot dotColor={dotColor} /></div>
        </>
      );
    case 4:
      return (
        <>
          <div className="col-start-1 row-start-1"><Dot dotColor={dotColor} /></div>
          <div className="col-start-3 row-start-1"><Dot dotColor={dotColor} /></div>
          <div className="col-start-1 row-start-3"><Dot dotColor={dotColor} /></div>
          <div className="col-start-3 row-start-3"><Dot dotColor={dotColor} /></div>
        </>
      );
    case 5:
      return (
        <>
          <div className="col-start-1 row-start-1"><Dot dotColor={dotColor} /></div>
          <div className="col-start-3 row-start-1"><Dot dotColor={dotColor} /></div>
          <div className="col-start-2 row-start-2"><Dot dotColor={dotColor} /></div>
          <div className="col-start-1 row-start-3"><Dot dotColor={dotColor} /></div>
          <div className="col-start-3 row-start-3"><Dot dotColor={dotColor} /></div>
        </>
      );
    case 6:
      return (
        <>
          <div className="col-start-1 row-start-1"><Dot dotColor={dotColor} /></div>
          <div className="col-start-3 row-start-1"><Dot dotColor={dotColor} /></div>
          <div className="col-start-1 row-start-2"><Dot dotColor={dotColor} /></div>
          <div className="col-start-3 row-start-2"><Dot dotColor={dotColor} /></div>
          <div className="col-start-1 row-start-3"><Dot dotColor={dotColor} /></div>
          <div className="col-start-3 row-start-3"><Dot dotColor={dotColor} /></div>
        </>
      );
    default:
      return null;
  }
};

const Face = ({ value, style, turnColor }: { value: number, style: React.CSSProperties, turnColor?: string }) => {
  const bgClass = turnColor === "yellow" ? "bg-yellow-500 border-yellow-600" : 
                  turnColor === "blue" ? "bg-blue-500 border-blue-600" : 
                  "bg-zinc-100 border-zinc-300";
  const dotColor = turnColor === "blue" ? "bg-white" : "bg-zinc-900";

  return (
    <div 
      className={clsx("absolute w-full h-full rounded-xl border shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] flex items-center justify-center p-2 transition-colors duration-500", bgClass)}
      style={style}
    >
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-1 place-items-center">
        {getDots(value, dotColor)}
      </div>
    </div>
  );
};

interface DiceProps {
  onRoll: () => Promise<{ diceValue: number | null } | null>;
  disabled: boolean;
  value: number | null;
  lastActionId?: number;
  turnColor?: string;
}

export default function Dice({ onRoll, disabled, value, lastActionId, turnColor }: DiceProps) {
  const [rotation, setRotation] = useState({ x: -15, y: -15 }); // Slight initial tilt
  const [isRolling, setIsRolling] = useState(false);
  const [localValue, setLocalValue] = useState(6); // Default visual face

  // Update visual face when backend value exists but we didn't just roll
  useEffect(() => {
    if (value && !isRolling) {
      animateToValue(value);
    }
  }, [value, lastActionId]); // eslint-disable-line

  const playRollSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const clackCount = Math.floor(Math.random() * 3) + 5;
      for (let i = 0; i < clackCount; i++) {
        const t = ctx.currentTime + (Math.random() * 0.7);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.03);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5 + (Math.random() * 0.3), t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const animateToValue = (targetValue: number) => {
    let baseX = 0;
    let baseY = 0;

    switch (targetValue) {
      case 1: baseX = 0; baseY = 0; break;
      case 6: baseX = 180; baseY = 0; break;
      case 2: baseX = -90; baseY = 0; break;
      case 5: baseX = 90; baseY = 0; break;
      case 3: baseX = 0; baseY = -90; break;
      case 4: baseX = 0; baseY = 90; break;
    }

    const spinsX = Math.floor(rotation.x / 360) * 360 + 1440; 
    const spinsY = Math.floor(rotation.y / 360) * 360 + 1440; 
    
    const wobbleArray = new Uint32Array(2);
    window.crypto.getRandomValues(wobbleArray);
    const wobbleX = ((wobbleArray[0] % 100) / 100 - 0.5) * 45;
    const wobbleY = ((wobbleArray[1] % 100) / 100 - 0.5) * 45;

    setRotation({
      x: spinsX + baseX + wobbleX,
      y: spinsY + baseY + wobbleY
    });

    setTimeout(() => {
      setRotation({
        x: spinsX + baseX,
        y: spinsY + baseY
      });
    }, 800);
  };

  const rollDice = async () => {
    if (isRolling || disabled) return;
    setIsRolling(true);
    playRollSound();

    const state = await onRoll();
    
    if (state && state.diceValue) {
      setLocalValue(state.diceValue);
      animateToValue(state.diceValue);
    } else {
      // It might be a skipped turn due to three 6s, just animate to something
      animateToValue(Math.floor(Math.random() * 6) + 1);
    }

    setTimeout(() => {
      setIsRolling(false);
    }, 1200);
  };

  return (
    <div className={clsx("flex flex-col items-center justify-center gap-8 mt-8 transition-opacity duration-300", disabled && !isRolling ? "opacity-50" : "opacity-100")} style={{ perspective: "1000px" }}>
      <button
        onClick={rollDice}
        disabled={disabled || isRolling}
        className="relative w-16 h-16 focus:outline-none cursor-pointer disabled:cursor-not-allowed"
        style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(-32px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: "transform 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <Face value={1} style={{ transform: "rotateY(0deg) translateZ(32px)" }} turnColor={turnColor} />
        <Face value={6} style={{ transform: "rotateX(180deg) translateZ(32px)" }} turnColor={turnColor} />
        <Face value={2} style={{ transform: "rotateX(90deg) translateZ(32px)" }} turnColor={turnColor} />
        <Face value={5} style={{ transform: "rotateX(-90deg) translateZ(32px)" }} turnColor={turnColor} />
        <Face value={3} style={{ transform: "rotateY(90deg) translateZ(32px)" }} turnColor={turnColor} />
        <Face value={4} style={{ transform: "rotateY(-90deg) translateZ(32px)" }} turnColor={turnColor} />
      </button>
      
      <div className="text-zinc-500 font-sans tracking-widest text-sm uppercase h-4">
        {isRolling ? "Rolling..." : (!disabled ? "Tap to Roll" : "Wait")}
      </div>
    </div>
  );
}
