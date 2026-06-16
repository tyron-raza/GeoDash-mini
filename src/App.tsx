import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Instructions from './instructions';
import { GamePhase } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  Gamepad2, 
  ShieldAlert, 
  History, 
  Zap,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface ScoreLog {
  id: string;
  score: number;
  speed: number;
  timestamp: string;
}

export default function App() {
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('geodash_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [hearts, setHearts] = useState(3);
  const [phase, setPhase] = useState<GamePhase>('START');
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [scoreHistory, setScoreHistory] = useState<ScoreLog[]>(() => {
    const saved = localStorage.getItem('geodash_score_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Track personal high score updates
  const handleHighScoreUpdate = (newHigh: number) => {
    setHighScore(newHigh);
    localStorage.setItem('geodash_high_score', newHigh.toString());
  };

  // Track game phase shifts to record last score and logs on gameover
  const handlePhaseChange = (newPhase: GamePhase) => {
    setPhase(newPhase);

    if (newPhase === 'GAMEOVER') {
      const log: ScoreLog = {
        id: `log-${Date.now()}`,
        score: currentScore,
        speed: speed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setScoreHistory(prev => {
        const next = [log, ...prev].slice(0, 5); // Keep last 5 entries
        localStorage.setItem('geodash_score_history', JSON.stringify(next));
        return next;
      });

      // Update highscore
      if (currentScore > highScore) {
        handleHighScoreUpdate(currentScore);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans border-8 border-zinc-900 selection:bg-[#00FF00]/20 selection:text-white">
      {/* Header Navigation */}
      <nav className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-6 border-b-2 border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="flex flex-col text-center md:text-left">
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-1">Project Name</span>
            <h1 className="text-4xl font-display font-black tracking-tighter italic text-[#00FF00]">GEO DASH MINI</h1>
          </div>
          <div className="hidden md:block h-12 w-[2px] bg-zinc-800"></div>
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-1">Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse shadow-[0_0_8px_#00FF00]"></div>
              <span className="text-sm font-mono tracking-widest text-zinc-200">SYSTEM ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-8 md:gap-12 items-center mt-4 md:mt-0">
          <div className="flex flex-col items-center md:items-end">
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-1">Current Score</span>
            <span className="text-4xl font-mono font-bold text-white tracking-widest">
              {String(currentScore).padStart(6, '0')}
            </span>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-1">Health</span>
            <div className="flex gap-2 mt-1">
              <div className={`w-6 h-6 rotate-45 border-2 transition-all duration-300 ${hearts >= 1 ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] border-white/20' : 'bg-zinc-800 border-zinc-700'}`}></div>
              <div className={`w-6 h-6 rotate-45 border-2 transition-all duration-300 ${hearts >= 2 ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] border-white/20' : 'bg-zinc-800 border-zinc-700'}`}></div>
              <div className={`w-6 h-6 rotate-45 border-2 transition-all duration-300 ${hearts >= 3 ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] border-white/20' : 'bg-zinc-800 border-zinc-700'}`}></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8-Grid): Game screen block */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <GameCanvas
            onScoreUpdate={setCurrentScore}
            onHighScoreUpdate={handleHighScoreUpdate}
            onHeartsUpdate={setHearts}
            onPhaseChange={handlePhaseChange}
            onPausedChange={setIsPaused}
            onSpeedChange={setSpeed}
          />

          <Instructions />
        </div>

        {/* Right Column (4-Grid): Live panel scores ledger & stats details */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Active Status Display Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black border-2 border-zinc-800 rounded-lg p-5 shadow-[0_4px_15px_rgba(0,0,0,0.85)] text-zinc-100"
          >
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-4 font-mono flex items-center justify-between">
              <span>SYSTEM CONTROL</span>
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  phase === 'PLAYING' && !isPaused ? 'bg-[#00FF00]' : 'bg-zinc-600'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  phase === 'PLAYING' && !isPaused ? 'bg-[#00FF00]' : 'bg-zinc-500'
                }`}></span>
              </span>
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/80">
                <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider font-mono">Engine Phase</span>
                <span className={`font-mono text-xs font-bold py-1 px-2.5 rounded tracking-widest uppercase ${
                  phase === 'GAMEOVER' 
                    ? 'bg-red-950/30 text-red-500 border border-red-900/50' 
                    : phase === 'PLAYING' 
                      ? isPaused 
                        ? 'bg-amber-950/30 text-amber-500 border border-amber-900/40' 
                        : 'bg-emerald-950/30 text-[#00FF00] border border-[#00FF00]/30'
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                }`}>
                  {phase}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-800/80">
                <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider font-mono">Live Score</span>
                <span className="font-mono text-2xl font-black text-white tracking-widest">{String(currentScore).padStart(6, '0')}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-800/80">
                <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider font-mono">Safety Vector</span>
                <div className="flex gap-1.5">
                  {phase === 'START' ? (
                    <span className="text-[10px] text-[#00FF00] font-bold font-mono tracking-wider">SECURE</span>
                  ) : phase === 'GAMEOVER' ? (
                    <div className="flex items-center gap-1 text-xs text-red-500 font-bold font-mono tracking-widest">
                      <ShieldAlert size={14} className="animate-bounce text-red-500" />
                      CRITICAL FAILED
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className={`w-4 h-4 rotate-45 border transition-all duration-300 ${hearts >= 1 ? 'bg-red-600 border-white/10 shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'bg-zinc-800 border-zinc-700'}`}></div>
                      <div className={`w-4 h-4 rotate-45 border transition-all duration-300 ${hearts >= 2 ? 'bg-red-600 border-white/10 shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'bg-zinc-800 border-zinc-700'}`}></div>
                      <div className={`w-4 h-4 rotate-45 border transition-all duration-300 ${hearts >= 3 ? 'bg-red-600 border-white/10 shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'bg-zinc-800 border-zinc-700'}`}></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider font-mono">Velocity Multiplier</span>
                <span className="font-mono text-lg font-black text-orange-500 italic tracking-wider">{speed.toFixed(2)}x</span>
              </div>
            </div>
          </motion.div>

          {/* Scores History Log Book */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black border-2 border-zinc-800 rounded-lg p-5 shadow-[0_4px_15px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-2">
                <History size={14} className="text-[#00FF00]" />
                Recent Attempts
              </h3>
              {scoreHistory.length > 0 && (
                <button 
                  onClick={() => {
                    setScoreHistory([]);
                    localStorage.removeItem('geodash_score_history');
                  }}
                  className="text-[9px] text-[#00FF00] hover:text-white transition uppercase tracking-[0.2em] font-mono font-bold"
                >
                  Clear history
                </button>
              )}
            </div>

            {scoreHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono flex flex-col items-center gap-2">
                <Sparkles size={16} className="text-zinc-700 animate-pulse" />
                No entries recorded yet.<br/>Start playing to register runs!
              </div>
            ) : (
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {scoreHistory.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-zinc-950 hover:bg-zinc-900 transition p-3 rounded border border-zinc-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                          <span>{log.timestamp}</span>
                          <span>•</span>
                          <span className="text-orange-500">{log.speed}x speed</span>
                        </div>
                        <div className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">PILOT RECORD</div>
                      </div>
                      <div className="font-mono text-sm font-bold text-[#00FF00]">
                        {String(log.score).padStart(3, '0')} <span className="text-[9px] text-zinc-500 font-normal uppercase tracking-wider">PTS</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Quick Info Alerts */}
          <div className="bg-zinc-950 border-2 border-zinc-900 p-4 rounded-lg flex items-start gap-2.5 text-[11px] text-zinc-500 leading-relaxed font-mono">
            <Info size={14} className="text-[#00FF00] shrink-0 mt-0.5" />
            <p>
              Emulated viewport bounds mapping. Target translation converts vertices using explicit midpoints coordinates. Jump dynamics switch acceleration vectors on keyboard space-up inputs instantly.
            </p>
          </div>
        </div>
      </main>

      {/* Retro Footer */}
      <footer className="py-8 mt-12 bg-black border-t-2 border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-zinc-500 font-mono space-y-1">
          <p className="tracking-widest">© 2026 GEO DASH-MINI • GOOGLE AI STUDIO EMULATION CONSOLE</p>
          <p className="text-[10px] text-zinc-650 uppercase tracking-wider">Bresenham Pipeline • Responsive Frame Buffer Engine</p>
        </div>
      </footer>
    </div>
  );
}
