import React from 'react';
import { Space, ArrowLeftRight, HelpCircle, Cpu, ShieldCheck } from 'lucide-react';

export default function Instructions() {
  return (
    <div className="bg-black border-2 border-zinc-800 rounded-lg p-6 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold mb-5 flex items-center gap-2">
        <HelpCircle size={14} className="text-[#00FF00]" />
        How To Play & Controls
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-zinc-300">
        <div className="space-y-5">
          <div className="flex gap-4 items-start">
            <div className="bg-zinc-900 px-3 py-1.5 rounded text-white border-2 border-zinc-700 font-mono font-bold shrink-0 self-start text-xs min-w-[90px] text-center shadow">
              SPACEBAR
            </div>
            <div>
              <p className="font-display font-bold text-white tracking-tight">Gravity-Switch Jump</p>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
                Switches gravity to launch you vertically towards the opposite floor/ceiling. Tap while on ground to fly up; tap while on ceiling to fly down.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-zinc-900 px-3 py-1.5 rounded text-white border-2 border-zinc-700 font-mono font-bold shrink-0 self-start text-xs min-w-[90px] text-center shadow">
              ← / →
            </div>
            <div>
              <p className="font-display font-bold text-white tracking-tight">Shift Position</p>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
                Use Left and Right arrow keys to fine-tune your player's precise horizontal position. Use this to avoid blocks or optimize your paths!
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-zinc-900 px-3 py-1.5 rounded text-white border-2 border-zinc-700 font-mono font-bold shrink-0 self-start text-xs min-w-[90px] text-center shadow">
              ↑ / ↓
            </div>
            <div>
              <p className="font-display font-bold text-white tracking-tight">Modify Block Speed</p>
              <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
                Adjust obstacle speeds on-the-fly dynamically. Up arrow accelerates, Down arrow slows things down. Capped between 0.5x and 10x!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-zinc-950/80 p-5 rounded-lg border-2 border-zinc-900 font-mono text-xs text-zinc-400 leading-relaxed">
          <div className="flex items-center gap-2 text-[#00FF00] font-bold tracking-wider mb-2">
            <Cpu size={14} />
            AUTHENTIC ALGORITHMS PORTED
          </div>
          <p className="text-[11px] text-zinc-450">
            This emulated environment implements the original <span className="text-[#00FF00] font-bold">Bresenham-Midpoint line-drawing algorithm</span> inside an HTML5 Canvas:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-1 text-[10px] text-zinc-500">
            <li>
              <span className="text-zinc-300 font-bold">Zone Translation:</span> Identifies one of <span className="text-[#00FF00] font-semibold">8 unique octant zones</span> to normalize all line vectors.
            </li>
            <li>
              <span className="text-zinc-300 font-bold">Zone 0 Normalization:</span> Converts lines into Zone 0 where <span className="text-white">0 &le; dy &le; dx</span> for simplified calculations.
            </li>
            <li>
              <span className="text-zinc-300 font-bold">Midpoint Circle:</span> Plots 17 concentric circles incrementally using standard Bresenham octant symmetry for a beautiful striped neon player.
            </li>
          </ul>

          <div className="pt-3.5 border-t border-zinc-900 flex items-center gap-1.5 text-[#00FF00] font-extrabold text-[10px] tracking-wider">
            <ShieldCheck size={12} fill="currentColor" className="text-[#00FF00]/10" />
            100% CLIENT-SIDE • NO DEPLOYMENT BACKENDS REQUESTED
          </div>
        </div>
      </div>
    </div>
  );
}

