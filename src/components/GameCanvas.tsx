import React, { useEffect, useRef, useState } from 'react';
import { GamePhase, GameObstacle, PlayerState, WINDOW_X, WINDOW_Y, GROUND_Y, CEILING_Y, BLOCK_WIDTH, BLOCK_HEIGHT, TRIANGLE_BASE, TRIANGLE_HEIGHT, MIN_GAP, SPEED_INCREMENT, MAX_SPEED, INITIAL_SPEED, JUMP_VELOCITY } from '../types';
import { audio } from '../utils/audio';
import { RotateCcw, Play, Pause, X, Zap, Volume2, VolumeX, Eye, Flame } from 'lucide-react';

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onHighScoreUpdate: (highScore: number) => void;
  onHeartsUpdate: (hearts: number) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onPausedChange: (isPaused: boolean) => void;
  onSpeedChange: (speed: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export default function GameCanvas({
  onScoreUpdate,
  onHighScoreUpdate,
  onHeartsUpdate,
  onPhaseChange,
  onPausedChange,
  onSpeedChange,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Display Settings state synced to React for toggle buttons
  const [renderMode, setRenderMode] = useState<'RETRO' | 'NEO'>('NEO');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Game Engine state in React just for overlay syncing (rendered HUDs)
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('START');
  const [currentSpeed, setCurrentSpeed] = useState(INITIAL_SPEED);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Increment session active timer
  useEffect(() => {
    let t: any;
    if (gamePhase === 'PLAYING' && !isPaused) {
      t = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [gamePhase, isPaused]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [hrs, mins, secs]
      .map((v) => String(v).padStart(2, '0'))
      .join(':');
  };

  // Game state references for high-performance physics loops
  const stateRef = useRef({
    phase: 'START' as GamePhase,
    isPaused: false,
    score: 0,
    highScore: 0,
    collisionsCount: 0,
    blockSpeed: INITIAL_SPEED,

    player: {
      x: 100,
      y: 225,
      vy: 0,
      isJumping: false,
      onFloor: true,
      onCeiling: false,
      pulseColor: 'rgb(255, 0, 100)',
    } as PlayerState,

    obstacles: [] as GameObstacle[],
    particles: [] as Particle[],
    screenShake: 0,
    frameId: 0,
    lastFrameTime: 0,
    concentricColorTimer: 0,
    glitchColors: [] as string[],
  });

  // Sound toggling
  const handleToggleSound = () => {
    const nextVal = audio.toggleSound();
    setSoundEnabled(nextVal);
  };

  // Bresenham Midpoint Line Algorithm Coordinates & Helper
  const findZone = (x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dx2 = dx * dx;
    const dy2 = dy * dy;
    if (dx >= 0) {
      if (dy >= 0) {
        return dx2 > dy2 ? 0 : 1;
      } else {
        return dx2 > dy2 ? 7 : 6;
      }
    } else {
      if (dy >= 0) {
        return dx2 > dy2 ? 3 : 2;
      } else {
        return dx2 > dy2 ? 4 : 5;
      }
    }
  };

  const convertToZone0 = (x: number, y: number, zone: number): [number, number] => {
    switch (zone) {
      case 0: return [x, y];
      case 1: return [y, x];
      case 2: return [y, -x];
      case 3: return [-x, y];
      case 4: return [-x, -y];
      case 5: return [-y, -x];
      case 6: return [-y, x];
      case 7: return [x, -y];
      default: return [x, y];
    }
  };

  const convertToOriginalZone = (x: number, y: number, zone: number): [number, number] => {
    switch (zone) {
      case 0: return [x, y];
      case 1: return [y, x];
      case 2: return [-y, x];
      case 3: return [-x, y];
      case 4: return [-x, -y];
      case 5: return [-y, -x];
      case 6: return [y, -x];
      case 7: return [x, -y];
      default: return [x, y];
    }
  };

  const drawPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(WINDOW_Y - y), size, size);
  };

  const drawMidpointLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, size = 1) => {
    const zone = findZone(x1, y1, x2, y2);
    const [nx1, ny1] = convertToZone0(x1, y1, zone);
    const [nx2, ny2] = convertToZone0(x2, y2, zone);

    const dx = nx2 - nx1;
    const dy = ny2 - ny1;
    let d = 2 * dy - dx;
    const dPL = 2 * dy;
    const dPH = 2 * (dy - dx);
    let x = nx1;
    let y = ny1;

    const [ox, oy] = convertToOriginalZone(x, y, zone);
    drawPixel(ctx, ox, oy, color, size);

    while (x < nx2) {
      if (d <= 0) {
        d += dPL;
        x += 1;
      } else {
        d += dPH;
        x += 1;
        y += 1;
      }
      const [origX, origY] = convertToOriginalZone(x, y, zone);
      drawPixel(ctx, origX, origY, color, size);
    }
  };

  const drawMidpointCircle = (ctx: CanvasRenderingContext2D, xc: number, yc: number, r: number, color: string, size = 1) => {
    let x = 0;
    let y = r;
    let d = 1 - r;

    const plotCirclePoints = (cx: number, cy: number, px: number, py: number) => {
      drawPixel(ctx, cx + px, cy + py, color, size); // Octant 1
      drawPixel(ctx, cx - px, cy + py, color, size); // Octant 2
      drawPixel(ctx, cx + px, cy - py, color, size); // Octant 3
      drawPixel(ctx, cx - px, cy - py, color, size); // Octant 4
      drawPixel(ctx, cx + py, cy + px, color, size); // Octant 5
      drawPixel(ctx, cx - py, cy + px, color, size); // Octant 6
      drawPixel(ctx, cx + py, cy - px, color, size); // Octant 7
      drawPixel(ctx, cx - py, cy - px, color, size); // Octant 8
    };

    plotCirclePoints(xc, yc, x, y);

    while (x < y) {
      if (d < 0) {
        d = d + 2 * x + 3;
      } else {
        d = d + 2 * (x - y) + 5;
        y -= 1;
      }
      x += 1;
      plotCirclePoints(xc, yc, x, y);
    }
  };

  // Helper to spawn explosion debris
  const createExplosion = (x: number, y: number, color: string) => {
    const list: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      list.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 30,
      });
    }
    stateRef.current.particles.push(...list);
  };

  // Helper to spawn trailing engine sparks
  const createTrail = (x: number, y: number, color: string) => {
    const vyRange = (Math.random() - 0.5) * 3;
    stateRef.current.particles.push({
      x,
      y,
      vx: -(2 + Math.random() * 4), // Fly backwards
      vy: vyRange,
      size: 1.5 + Math.random() * 3,
      color,
      alpha: 0.8,
      life: 0,
      maxLife: 20 + Math.random() * 15,
    });
  };

  // Gap Checker between obstacles
  const checkGap = (newX: number, existing: GameObstacle[]): boolean => {
    for (const obj of existing) {
      if (Math.abs(newX - obj.x) < MIN_GAP) {
        return false;
      }
    }
    return true;
  };

  // Obstacle Spawners
  const spawnObstacle = (forceType?: 'BLOCK' | 'TRIANGLE') => {
    const s = stateRef.current;
    const type = forceType || (Math.random() > 0.5 ? 'BLOCK' : 'TRIANGLE');

    // Attempt positions starting at WINDOW_X to WINDOW_X + 400
    const startX = WINDOW_X + Math.floor(Math.random() * 100);

    if (checkGap(startX, s.obstacles)) {
      if (type === 'BLOCK') {
        s.obstacles.push({
          id: `b-${Date.now()}-${Math.random()}`,
          type: 'BLOCK',
          x: startX,
          y: GROUND_Y,
          width: BLOCK_WIDTH,
          height: BLOCK_HEIGHT,
          passed: false,
          color: 'rgb(127, 50, 204)', // Purple
          glowColor: 'rgba(204, 50, 204, 0.5)',
        });
      } else {
        const flipped = Math.random() > 0.5; // True = ceiling, False = ground
        s.obstacles.push({
          id: `t-${Date.now()}-${Math.random()}`,
          type: 'TRIANGLE',
          x: startX,
          y: flipped ? CEILING_Y : GROUND_Y,
          width: TRIANGLE_BASE,
          height: TRIANGLE_HEIGHT,
          flipped,
          passed: false,
          color: 'rgb(50, 204, 102)', // Green
          glowColor: 'rgba(204, 204, 50, 0.4)', // Yellow glow
        });
      }
    }
  };

  // Complete initialization (from user Python script)
  const initGame = () => {
    const s = stateRef.current;
    s.obstacles = [];
    s.particles = [];
    s.score = 0;
    s.collisionsCount = 0;
    s.blockSpeed = INITIAL_SPEED;

    s.player.x = 100;
    s.player.y = 225;
    s.player.vy = 0;
    s.player.isJumping = false;
    s.player.onFloor = true;
    s.player.onCeiling = false;

    // Prefill some obstacles exactly like create_blocks and create_triangles
    let pos_x = WINDOW_X;
    for (let i = 0; i < 3; i++) {
      if (checkGap(pos_x, s.obstacles)) {
        const isBlock = Math.random() > 0.5;
        if (isBlock) {
          s.obstacles.push({
            id: `b-init-${i}`,
            type: 'BLOCK',
            x: pos_x,
            y: GROUND_Y,
            width: BLOCK_WIDTH,
            height: BLOCK_HEIGHT,
            passed: false,
          });
        } else {
          const flipped = Math.random() > 0.5;
          s.obstacles.push({
            id: `t-init-${i}`,
            type: 'TRIANGLE',
            x: pos_x,
            y: flipped ? CEILING_Y : GROUND_Y,
            width: TRIANGLE_BASE,
            height: TRIANGLE_HEIGHT,
            flipped,
            passed: false,
          });
        }
      }
      pos_x += MIN_GAP + BLOCK_WIDTH;
    }

    // Sync views
    setScore(0);
    setHearts(3);
    setCurrentSpeed(INITIAL_SPEED);
  };

  const handleStartPlay = () => {
    audio.playCoin();
    const s = stateRef.current;
    s.phase = 'PLAYING';
    s.isPaused = false;
    setGamePhase('PLAYING');
    setIsPaused(false);
    onPhaseChange('PLAYING');
    onPausedChange(false);
    initGame();
  };

  const togglePause = () => {
    const s = stateRef.current;
    if (s.phase !== 'PLAYING') return;

    s.isPaused = !s.isPaused;
    setIsPaused(s.isPaused);
    onPausedChange(s.isPaused);
    audio.playCoin();
  };

  const triggerReset = () => {
    audio.playCoin();
    initGame();
    const s = stateRef.current;
    s.isPaused = false;
    setIsPaused(false);
    onPausedChange(false);
  };

  const handleExitToMenu = () => {
    audio.playGameOver();
    const s = stateRef.current;
    s.phase = 'START';
    s.isPaused = false;
    setGamePhase('START');
    setIsPaused(false);
    onPhaseChange('START');
    onPausedChange(false);
  };

  // Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;

      // START screen space press directly launches
      if (s.phase === 'START') {
        if (e.key === ' ') {
          e.preventDefault();
          handleStartPlay();
        }
        return;
      }

      // GAMEOVER screen space press restarts
      if (s.phase === 'GAMEOVER') {
        if (e.key === ' ' || e.key === 'r') {
          e.preventDefault();
          handleStartPlay();
        }
        return;
      }

      // SPACEBAR - Gravity Switch Jump Physics
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!s.isPaused) {
          // If on floor: jump UP toward ceiling
          if (s.player.onFloor && !s.player.isJumping) {
            s.player.vy = JUMP_VELOCITY;
            s.player.isJumping = true;
            s.player.onFloor = false;
            s.player.onCeiling = true; // goal target when finished
            audio.playJump();
          }
          // If on ceiling: jump DOWN toward floor
          else if (!s.player.onFloor && !s.player.isJumping) {
            s.player.vy = -JUMP_VELOCITY;
            s.player.isJumping = true;
            s.player.onFloor = true; // goal target when finished
            s.player.onCeiling = false;
            audio.playJump();
          }
        }
      }

      // SPECIAL KEYBOARD CONTROLS (from GLUT template code)
      const step = 15;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!s.isPaused) {
          s.player.x = Math.max(0, s.player.x - step);
        }
      }
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!s.isPaused) {
          s.player.x = Math.min(WINDOW_X - 50, s.player.x + step);
        }
      }
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!s.isPaused) {
          s.blockSpeed = Math.min(MAX_SPEED, s.blockSpeed + 1);
          setCurrentSpeed(parseFloat(s.blockSpeed.toFixed(1)));
          onSpeedChange(parseFloat(s.blockSpeed.toFixed(1)));
        }
      }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!s.isPaused) {
          s.blockSpeed = Math.max(0.5, s.blockSpeed - 1);
          setCurrentSpeed(parseFloat(s.blockSpeed.toFixed(1)));
          onSpeedChange(parseFloat(s.blockSpeed.toFixed(1)));
        }
      }
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
      }
      else if (e.key === 'Escape') {
        e.preventDefault();
        handleExitToMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Canvas Mouse Clicks Box Detection
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Translate mouse click horizontally & vertically into logical 800x600 grid orientation
    const clickX = ((e.clientX - rect.left) / rect.width) * WINDOW_X;
    const rawY = ((e.clientY - rect.top) / rect.height) * WINDOW_Y;
    const clickY_bottomUp = WINDOW_Y - rawY; // Bottom-up OpenGL viewport coord

    const s = stateRef.current;

    // START screen Button coordinates
    if (s.phase === 'START') {
      // Python code: "if 350 <= opengl_x <= 450 and 280 <= opengl_y <= 320"
      if (clickX >= 350 && clickX <= 450 && clickY_bottomUp >= 280 && clickY_bottomUp <= 320) {
        handleStartPlay();
      }
      return;
    }

    if (s.phase === 'GAMEOVER') {
      // If clicked inside the centered restart region
      if (clickX >= 300 && clickX <= 500 && clickY_bottomUp >= 200 && clickY_bottomUp <= 260) {
        handleStartPlay();
      }
      return;
    }

    // GAMEPLAY Top Buttons detection (mouse Y relative to top):
    // 1. Restart left arrow: "if 10 <= x <= 35 and 10 <= y <= 30" (GLUT raw coordinates from top)
    if (clickX >= 10 && clickX <= 35 && rawY >= 10 && rawY <= 30) {
      triggerReset();
      return;
    }

    // 2. Pause: "if 10 <= x <= 35 and 50 <= y <= 80" (GLUT raw coordinates from top)
    if (clickX >= 10 && clickX <= 35 && rawY >= 50 && rawY <= 80) {
      togglePause();
      return;
    }

    // 3. Exit: "if 10 <= x <= 35 and 100 <= y <= 125" (GLUT raw coordinates from top)
    if (clickX >= 10 && clickX <= 35 && rawY >= 100 && rawY <= 125) {
      handleExitToMenu();
      return;
    }
  };

  const checkCollision = () => {
    const s = stateRef.current;
    const px = s.player.x;
    const py = s.player.y;

    // Player box for collision
    const pLeft = px - 25;
    const pRight = px + 25;
    const pBottom = py - 25;
    const pTop = py + 25;

    for (let i = s.obstacles.length - 1; i >= 0; i--) {
      const obj = s.obstacles[i];

      if (obj.type === 'BLOCK') {
        const oLeft = obj.x;
        const oRight = obj.x + obj.width;
        const oBottom = obj.y;
        const oTop = obj.y + obj.height;

        if (pLeft < oRight && pRight > oLeft && pBottom < oTop && pTop > oBottom) {
          // Explode block + lose 1 heart
          createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, 'rgb(168, 85, 247)');
          audio.playHit();
          s.collisionsCount += 1;
          s.obstacles.splice(i, 1);
          s.screenShake = 15;

          const heartsCount = Math.max(0, 3 - s.collisionsCount);
          setHearts(heartsCount);
          onHeartsUpdate(heartsCount);

          if (s.collisionsCount >= 3) {
            triggerGameOver();
          }
          return;
        }
      } else {
        // Triangle collision
        const oLeft = obj.x;
        const oRight = obj.x + obj.width;

        if (obj.flipped) {
          // Flipped triangle (on ceiling)
          const oTop = obj.y;
          const oBottom = obj.y - obj.height;

          if (pLeft < oRight && pRight > oLeft && pBottom < oTop && pTop > oBottom) {
            createExplosion(obj.x + obj.width / 2, obj.y - obj.height / 2, 'rgb(34, 197, 94)');
            audio.playHit();
            s.collisionsCount += 1;
            s.obstacles.splice(i, 1);
            s.screenShake = 15;

            const heartsCount = Math.max(0, 3 - s.collisionsCount);
            setHearts(heartsCount);
            onHeartsUpdate(heartsCount);

            if (s.collisionsCount >= 3) {
              triggerGameOver();
            }
            return;
          }
        } else {
          // Normal ground triangle
          const oBottom = obj.y;
          const oTop = obj.y + obj.height;

          if (pLeft < oRight && pRight > oLeft && pBottom < oTop && pTop > oBottom) {
            createExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, 'rgb(34, 197, 94)');
            audio.playHit();
            s.collisionsCount += 1;
            s.obstacles.splice(i, 1);
            s.screenShake = 15;

            const heartsCount = Math.max(0, 3 - s.collisionsCount);
            setHearts(heartsCount);
            onHeartsUpdate(heartsCount);

            if (s.collisionsCount >= 3) {
              triggerGameOver();
            }
            return;
          }
        }
      }
    }
  };

  const triggerGameOver = () => {
    audio.playGameOver();
    const s = stateRef.current;
    s.phase = 'GAMEOVER';
    setGamePhase('GAMEOVER');
    onPhaseChange('GAMEOVER');

    if (s.score > s.highScore) {
      s.highScore = Math.floor(s.score);
      setHighScore(s.highScore);
      onHighScoreUpdate(s.highScore);
    }
  };

  // Main animation engine running at exact 60Hz
  useEffect(() => {
    const s = stateRef.current;
    initGame();

    // Fill basic flashing colors
    s.glitchColors = [
      'rgb(255,0,0)',
      'rgb(0,255,0)',
      'rgb(0,0,255)',
      'rgb(255,255,0)',
      'rgb(0,255,255)',
      'rgb(255,0,255)',
      'rgb(255,100,0)',
    ];

    const loop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        s.frameId = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        s.frameId = requestAnimationFrame(loop);
        return;
      }

      // 1. CALCULATE STATE UPDATES (only if playing and not paused)
      if (s.phase === 'PLAYING' && !s.isPaused) {
        // Move & accelerate obstacles
        s.obstacles.forEach((obj) => {
          obj.x -= s.blockSpeed;

          // Check if passed player and reward points
          if (!obj.passed && obj.x + obj.width < s.player.x - 25) {
            obj.passed = true;
            s.score += 1;
            setScore(Math.floor(s.score));
            onScoreUpdate(Math.floor(s.score));
            audio.playScore();
          }
        });

        // Filter out screen escaped obstacles
        s.obstacles = s.obstacles.filter((obj) => obj.x + obj.width >= 0);

        // Gradually increase block speed inside limits
        if (s.blockSpeed < MAX_SPEED) {
          s.blockSpeed += SPEED_INCREMENT;
          setCurrentSpeed(parseFloat(s.blockSpeed.toFixed(2)));
          onSpeedChange(parseFloat(s.blockSpeed.toFixed(2)));
        }

        // Spawn new obstacles as space clears out
        if (s.obstacles.length < 3) {
          spawnObstacle();
        }

        // Apply Player Gravity physics
        if (s.player.isJumping) {
          s.score += 0.04; // Custom score boost while flying (from Python code logic)
          setScore(Math.floor(s.score));
          onScoreUpdate(Math.floor(s.score));

          s.player.y += s.player.vy;
          s.player.x += 1.8; // Glides horizontally forward while jumping

          // Spawn engine exhaust trail sparks
          createTrail(s.player.x - 15, s.player.y, s.player.pulseColor);
        }

        // Clamp ceiling
        if (s.player.y >= 375) {
          s.player.y = 375;
          s.player.vy = 0;
          s.player.isJumping = false;
          s.player.x -= 0.15; // Ground friction offset
        }

        // Clamp floor
        if (s.player.y <= 225) {
          s.player.y = 225;
          s.player.vy = 0;
          s.player.isJumping = false;
          s.player.x -= 0.1; // Ground friction offset
        }

        // Prevent player from floating off boundaries
        s.player.x = Math.max(20, Math.min(WINDOW_X - 60, s.player.x));

        // Perform collisions checks
        checkCollision();
      }

      // Update Particles
      s.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;
      });
      s.particles = s.particles.filter((p) => p.life < p.maxLife);

      // Handle Screen Shake dampening
      if (s.screenShake > 0) {
        s.screenShake *= 0.9;
        if (s.screenShake < 0.2) s.screenShake = 0;
      }

      // Incremental counter for concentric glow player effect
      s.concentricColorTimer += 1.2;
      const pulseIndex = Math.floor(s.concentricColorTimer / 8) % s.glitchColors.length;
      s.player.pulseColor = s.glitchColors[pulseIndex];

      // 2. CLEAR & PREPARE DRAWING
      ctx.clearRect(0, 0, WINDOW_X, WINDOW_Y);
      ctx.save();

      // Apply screen shake offset on hits
      if (s.screenShake > 0) {
        const dx = (Math.random() - 0.5) * s.screenShake;
        const dy = (Math.random() - 0.5) * s.screenShake;
        ctx.translate(dx, dy);
      }

      // Draw Grid / Cosmic visual environment (Modern only, retro stays clean black)
      if (renderMode === 'NEO') {
        // Dark theme background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, WINDOW_Y);
        bgGrad.addColorStop(0, '#0a0518'); // Cosmic purple deep dark
        bgGrad.addColorStop(0.5, '#05020a');
        bgGrad.addColorStop(1, '#0e0b1e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, WINDOW_X, WINDOW_Y);

        // Retro visual grid lines
        ctx.strokeStyle = 'rgba(128, 90, 213, 0.08)';
        ctx.lineWidth = 1;
        const gridSpace = 40;
        for (let x = 0; x < WINDOW_X; x += gridSpace) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, WINDOW_Y);
          ctx.stroke();
        }
        for (let y = 0; y < WINDOW_Y; y += gridSpace) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(WINDOW_X, y);
          ctx.stroke();
        }
      } else {
        // AUTHENTIC OPENGL BLACK ENVIRONMENT
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, WINDOW_X, WINDOW_Y);
      }

      // 3. DRAW GAME PLAYGROUND (Ceiling, Floor boundaries)
      const boundaryColor = renderMode === 'NEO' ? 'rgb(34, 197, 94)' : 'rgb(255, 255, 255)';
      
      if (renderMode === 'NEO') {
        // Modern glowing boundaries
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
        
        ctx.strokeStyle = boundaryColor;
        ctx.lineWidth = 4;
        
        // Floor line
        ctx.beginPath();
        ctx.moveTo(0, WINDOW_Y - GROUND_Y);
        ctx.lineTo(WINDOW_X, WINDOW_Y - GROUND_Y);
        ctx.stroke();

        // Ceiling line
        ctx.beginPath();
        ctx.moveTo(0, WINDOW_Y - CEILING_Y);
        ctx.lineTo(WINDOW_X, WINDOW_Y - CEILING_Y);
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset
      } else {
        // Authentic OpenGL pixel perfect boundaries
        drawMidpointLine(ctx, 0, GROUND_Y, WINDOW_X, GROUND_Y, '#ffffff', 2);
        drawMidpointLine(ctx, 0, CEILING_Y, WINDOW_X, CEILING_Y, '#ffffff', 2);
      }

      // 4. DRAW SYSTEM PARTICLES
      s.particles.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (renderMode === 'NEO') {
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.color;
        }
        ctx.beginPath();
        ctx.arc(p.x, WINDOW_Y - p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      });

      // 5. DRAW PLAYERS
      if (s.phase === 'PLAYING' || s.phase === 'GAMEOVER') {
        const pColor = s.player.pulseColor;
        
        if (renderMode === 'RETRO') {
          // AUTHENTIC NESTED MIDPOINT CIRCLES (Drawn sphere pixel-by-pixel, literally from user PyOpenGL script)
          const radii = [25, 24, 23, 22, 21, 20, 15, 14, 13, 12, 11, 10, 5, 4, 3, 2, 1];
          radii.forEach((r) => {
            // Pick static concentric index offsets
            const patternIndex = (pulseIndex + r) % s.glitchColors.length;
            const subColor = s.glitchColors[patternIndex];
            drawMidpointCircle(ctx, s.player.x, s.player.y, r, subColor, 1.5);
          });
        } else {
          // NEO MODERN GLOWING METEOR BALL
          ctx.shadowBlur = 20;
          ctx.shadowColor = pColor;

          // Nested glow layers
          const grad = ctx.createRadialGradient(
            s.player.x, WINDOW_Y - s.player.y, 1,
            s.player.x, WINDOW_Y - s.player.y, 25
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, pColor);
          grad.addColorStop(0.7, 'rgba(124, 58, 237, 0.4)');
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.player.x, WINDOW_Y - s.player.y, 25, 0, Math.PI * 2);
          ctx.fill();

          // Outer glowing loop edge ring
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(s.player.x, WINDOW_Y - s.player.y, 25, 0, Math.PI * 2);
          ctx.stroke();

          // Dynamic center core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(s.player.x, WINDOW_Y - s.player.y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
        }
      }

      // 6. DRAW OBSTACLES
      s.obstacles.forEach((obj) => {
        if (obj.type === 'BLOCK') {
          // DRAW BLOCKS
          if (renderMode === 'RETRO') {
            // Authentic pixel glow
            // Decreasing alpha on outer layers
            for (let i = 1; i <= 8; i++) {
              const alphaFraction = 0.5 * (6 - i);
              if (alphaFraction <= 0) continue;
              const col = `rgba(204, 50, 204, ${alphaFraction})`;
              const scale = 0.7 * i;
              const gx1 = obj.x - scale;
              const gy1 = obj.y - scale;
              const gx2 = obj.x + obj.width + scale;
              const gy2 = obj.y + obj.height + scale;

              // Draw glow boundary box
              drawMidpointLine(ctx, gx1, gy1, gx2, gy1, col, 1);
              drawMidpointLine(ctx, gx2, gy1, gx2, gy2, col, 1);
              drawMidpointLine(ctx, gx2, gy2, gx1, gy2, col, 1);
              drawMidpointLine(ctx, gx1, gy2, gx1, gy1, col, 1);
            }
            
            // Draw solid block with points in loop (from Python loop vertex2f)
            const ptsColor = 'rgb(127, 50, 204)';
            for (let px = Math.round(obj.x); px <= Math.round(obj.x + obj.width); px += 2) {
              drawMidpointLine(ctx, px, obj.y, px, obj.y + obj.height, ptsColor, 1);
            }
          } else {
            // NEO GLOWING GRADIENT BOX
            const blockGlow = 'rgba(168, 85, 247, 0.45)';
            ctx.shadowBlur = 15;
            ctx.shadowColor = blockGlow;

            const blockGrad = ctx.createLinearGradient(
              obj.x, WINDOW_Y - (obj.y + obj.height),
              obj.x + obj.width, WINDOW_Y - obj.y
            );
            blockGrad.addColorStop(0, '#c084fc'); // Light purple
            blockGrad.addColorStop(0.5, '#7e22ce');
            blockGrad.addColorStop(1, '#3b0764'); // Deep indigo dark border

            ctx.fillStyle = blockGrad;
            ctx.beginPath();
            ctx.roundRect(obj.x, WINDOW_Y - (obj.y + obj.height), obj.width, obj.height, 8);
            ctx.fill();

            // Glowing border
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Innermost neon diagonal highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.moveTo(obj.x + 10, WINDOW_Y - obj.y - 10);
            ctx.lineTo(obj.x + obj.width - 10, WINDOW_Y - obj.y - obj.height + 10);
            ctx.stroke();

            ctx.shadowBlur = 0;
          }
        } else {
          // DRAW TRIANGLES
          const flipped = !!obj.flipped;
          
          if (renderMode === 'RETRO') {
            // 20 to 30 yellowish glow layers
            for (let i = 20; i < 30; i++) {
              const alphaFraction = 0.05 * (6 - i); // some layers negative but we clamp
              if (alphaFraction <= 0) continue;
              const scale = 0.1 * i;
              const col = `rgba(204, 204, 50, ${alphaFraction})`;
              
              let x1, y1, x2, y2, x3, y3;
              if (flipped) {
                x1 = obj.x - scale; y1 = obj.y + scale;
                x2 = obj.x + obj.width / 2; y2 = obj.y - obj.height - scale;
                x3 = obj.x + obj.width + scale; y3 = obj.y + scale;
              } else {
                x1 = obj.x - scale; y1 = obj.y - scale;
                x2 = obj.x + obj.width / 2; y2 = obj.y + obj.height + scale;
                x3 = obj.x + obj.width + scale; y3 = obj.y - scale;
              }
              // Draw glow polygon lines
              drawMidpointLine(ctx, x1, y1, x2, y2, col, 1);
              drawMidpointLine(ctx, x2, y2, x3, y3, col, 1);
              drawMidpointLine(ctx, x3, y3, x1, y1, col, 1);
            }

            // Central original green triangle
            const p1x = obj.x;
            const p1y = obj.y;
            const p2x = obj.x + obj.width / 2;
            const p2y = flipped ? (obj.y - obj.height) : (obj.y + obj.height);
            const p3x = obj.x + obj.width;
            const p3y = obj.y;
            
            const triCol = 'rgb(50, 204, 102)';
            drawMidpointLine(ctx, p1x, p1y, p2x, p2y, triCol, 2);
            drawMidpointLine(ctx, p2x, p2y, p3x, p3y, triCol, 2);
            drawMidpointLine(ctx, p3x, p3y, p1x, p1y, triCol, 2);
          } else {
            // NEO MODERN HIGH TECH SHADOW SPINNING SPIKES
            ctx.shadowBlur = 18;
            ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';

            const goldGrad = ctx.createLinearGradient(obj.x, WINDOW_Y - obj.y, obj.x + obj.width, WINDOW_Y - obj.y);
            goldGrad.addColorStop(0, '#22c55e'); // Vibrant green
            goldGrad.addColorStop(1, '#15803d');

            ctx.fillStyle = goldGrad;
            ctx.beginPath();
            if (flipped) {
              ctx.moveTo(obj.x, WINDOW_Y - obj.y); // top-left
              ctx.lineTo(obj.x + obj.width / 2, WINDOW_Y - (obj.y - obj.height)); // pointing down
              ctx.lineTo(obj.x + obj.width, WINDOW_Y - obj.y); // top-right
            } else {
              ctx.moveTo(obj.x, WINDOW_Y - obj.y); // bottom-left
              ctx.lineTo(obj.x + obj.width / 2, WINDOW_Y - (obj.y + obj.height)); // pointing up
              ctx.lineTo(obj.x + obj.width, WINDOW_Y - obj.y); // bottom-right
            }
            ctx.closePath();
            ctx.fill();

            // Inner glowing details
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (flipped) {
              ctx.moveTo(obj.x + 10, WINDOW_Y - obj.y);
              ctx.lineTo(obj.x + obj.width / 2, WINDOW_Y - (obj.y - obj.height) + 12);
              ctx.lineTo(obj.x + obj.width - 10, WINDOW_Y - obj.y);
            } else {
              ctx.moveTo(obj.x + 10, WINDOW_Y - obj.y);
              ctx.lineTo(obj.x + obj.width / 2, WINDOW_Y - (obj.y + obj.height) + 12);
              ctx.lineTo(obj.x + obj.width - 10, WINDOW_Y - obj.y);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.shadowBlur = 0;
          }
        }
      });

      // 7. DRAW START SCREEN HUD
      if (s.phase === 'START') {
        const titleText = "Geo Dash-Mini";
        
        if (renderMode === 'RETRO') {
          // Yellow Centered heading at (400, 410)
          ctx.fillStyle = '#ffff00';
          ctx.font = '24px "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(titleText, 400, WINDOW_Y - 410);

          // Green PLAY button box at 350..450, 280..320
          const bColor = 'rgb(0, 255, 0)';
          for (let px = 350; px <= 450; px++) {
            drawMidpointLine(ctx, px, 280, px, 320, bColor, 1);
          }

          // Centered black text "Play"
          ctx.fillStyle = '#000000';
          ctx.font = '18px "Courier New", monospace';
          ctx.textAlign = 'center';
          // (button_x1 + button_x2) // 2, (button_y1 + button_y2) // 2 - 5
          ctx.fillText("Play", 400, WINDOW_Y - (300 - 5));

          // Draw top play symbol (x=400, y=340)
          const pCol = 'rgb(0, 255, 0)';
          drawMidpointLine(ctx, 400 - 10, 340, 400 - 10, 340 + 50, pCol, 2);
          drawMidpointLine(ctx, 400 + 30, 340 + 25, 400 - 10, 340 + 50, pCol, 2);
          drawMidpointLine(ctx, 400 + 30, 340 + 25, 400 - 10, 340, pCol, 2);
        } else {
          // NEO MODERN CYBER TRON DESIGN
          // Glowing geometric pulse circle in center
          const coreGrad = ctx.createRadialGradient(400, 300, 10, 400, 300, 200);
          coreGrad.addColorStop(0, 'rgba(124, 58, 237, 0.1)');
          coreGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(400, 300, 200, 0, Math.PI * 2);
          ctx.fill();

          // Title text with premium typography & styling
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#facc15';
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 42px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(titleText, 400, WINDOW_Y - 425);
          ctx.shadowBlur = 0;

          // Decorative subtitles
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 13px "JetBrains Mono", monospace';
          ctx.fillText("TAP OR PRESS [SPACEBAR] TO JUMP & FLY", 400, WINDOW_Y - 375);

          // Giant Play Triangle pointing right
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#22c55e';
          ctx.fillStyle = '#22c55e';
          
          ctx.beginPath();
          ctx.moveTo(390, WINDOW_Y - 365); // top-left peak of triangle
          ctx.lineTo(390, WINDOW_Y - 315); // bottom-left peak
          ctx.lineTo(430, WINDOW_Y - 340); // right pointing nose
          ctx.closePath();
          ctx.fill();

          // Green Play Button box
          const btnGrad = ctx.createLinearGradient(350, 280, 450, 320);
          btnGrad.addColorStop(0, '#22c55e');
          btnGrad.addColorStop(1, '#16a34a');

          ctx.fillStyle = btnGrad;
          ctx.beginPath();
          ctx.roundRect(350, WINDOW_Y - 320, 100, 40, 6);
          ctx.fill();

          // Button glowing border
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText("PLAY", 400, WINDOW_Y - 295);

          ctx.shadowBlur = 0;
        }
      }

      // 8. DRAW GAME OVER SCREEN HUD
      if (s.phase === 'GAMEOVER') {
        if (renderMode === 'RETRO') {
          // Display random flashing background inside frame (as in display() on gameover)
          // It's already drawn at outer clears, inside retro it stays clean, flashing titles or blocks.
          ctx.fillStyle = '#ff0000';
          ctx.font = 'bold 36px "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.fillText("GAME OVER", 400, 320);

          // Restart instruction
          ctx.fillStyle = '#ffffff';
          ctx.font = '18px "Courier New", monospace';
          ctx.fillText("Click [R] or Space to Replay", 400, 260);
          
          // Replay button rectangular spot
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(300, 230, 200, 50);
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(300, 230, 200, 50);
          ctx.fillStyle = '#ffffff';
          ctx.fillText("RESTART", 400, 200);
        } else {
          // NEO MODERN DETAILED GAMEOVER MENU
          // Semi transparent overlay backdrop
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(0, 0, WINDOW_X, WINDOW_Y);

          // Flashing glowing alerts
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#ef4444';
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 44px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText("GAME OVER", 400, 340);
          ctx.shadowBlur = 0;

          // Display Score stats centered beautifully
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px "JetBrains Mono", monospace';
          ctx.fillText(`YOUR FINAL SCORE: ${Math.floor(s.score)}`, 400, 290);
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(`PERSONAL HIGH SCORE: ${s.highScore}`, 400, 265);

          // Styled REPLAY clickable trigger box
          const repGrad = ctx.createLinearGradient(300, 180, 500, 230);
          repGrad.addColorStop(0, '#3b82f6'); // Cyber Blue
          repGrad.addColorStop(1, '#1d4ed8');
          ctx.fillStyle = repGrad;
          ctx.beginPath();
          ctx.roundRect(300, WINDOW_Y - 230, 200, 50, 10);
          ctx.fill();

          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px "Inter", sans-serif';
          ctx.fillText("TAP TO REPLAY", 400, WINDOW_Y - 200);
          ctx.fillStyle = '#64748b';
          ctx.font = '11px "Inter", sans-serif';
          ctx.fillText("PRESS [SPACEBAR] OR [R] KEY FOR INSTANT QUICK START", 400, WINDOW_Y - 150);
        }
      }

      // 9. DRAW STANDARD FIXED GAME HUD INSIDE CANVAS (OpenGL styles)
      if (s.phase === 'PLAYING') {
        // A. Left indicator button (Left arrow): 10..35 x, 580 y (convert_to_original_zone values)
        // MidpointLine(10, 580, 35, 580, color)
        const arrowCol = renderMode === 'NEO' ? 'rgb(234, 179, 8)' : 'rgb(204, 178, 0)';
        drawMidpointLine(ctx, 10, 580, 35, 580, arrowCol, 2);
        drawMidpointLine(ctx, 10, 580, 20, 590, arrowCol, 2);
        drawMidpointLine(ctx, 10, 580, 20, 570, arrowCol, 2);

        // B. Pause symbol/play symbol at x=[10, 35], y=[520, 550]
        const pauseCol = renderMode === 'NEO' ? 'rgb(34, 197, 94)' : 'rgb(0, 255, 0)';
        const playCol = renderMode === 'NEO' ? 'rgb(249, 115, 22)' : 'rgb(255, 165, 0)';
        
        if (!s.isPaused) {
          // Pause parallel indicators
          drawMidpointLine(ctx, 10, 520, 10, 550, pauseCol, 2.5);
          drawMidpointLine(ctx, 30, 520, 30, 550, pauseCol, 2.5);
        } else {
          // Orange Play triangle
          drawMidpointLine(ctx, 10, 520, 10, 550, playCol, 2.5);
          drawMidpointLine(ctx, 35, 535, 10, 550, playCol, 2.5);
          drawMidpointLine(ctx, 35, 535, 10, 520, playCol, 2.5);
        }

        // C. Quit Cross mark at x=[10, 35], y=[475, 500]
        const crossCol = renderMode === 'NEO' ? 'rgb(239, 68, 68)' : 'rgb(255, 127, 127)';
        drawMidpointLine(ctx, 10, 500, 35, 475, crossCol, 2);
        drawMidpointLine(ctx, 35, 500, 10, 475, crossCol, 2);

        // D. Blue Scoreboard layout (580..780, 550..580)
        const boxCol = renderMode === 'NEO' ? 'rgb(59, 130, 246)' : 'rgb(0, 0, 255)';
        drawMidpointLine(ctx, 580, 580, 780, 580, boxCol, 2);
        drawMidpointLine(ctx, 580, 580, 580, 550, boxCol, 2);
        drawMidpointLine(ctx, 780, 580, 780, 550, boxCol, 2);
        drawMidpointLine(ctx, 580, 550, 780, 550, boxCol, 2);

        // Text scores inside blue box
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${Math.floor(s.score)}`, 595, WINDOW_Y - 562);

        // E. Standard hearts below scoreboard at x=600, y=510, offset spacing 40
        const activeHearts = Math.max(0, 3 - s.collisionsCount);
        const base_y = 510;
        const spacing = 40;

        const drawClassicHeart = (x: number, y: number) => {
          const hrColor = 'rgb(239, 68, 68)';
          // Bresenham heart lines matching exact OpenGL code equations:
          drawMidpointLine(ctx, x, y + 25, x + 12, y + 10, hrColor, 1.5);
          drawMidpointLine(ctx, x, y + 25, x + 6, y + 32, hrColor, 1.5);
          drawMidpointLine(ctx, x + 6, y + 32, x + 12, y + 25, hrColor, 1.5);
          drawMidpointLine(ctx, x + 24, y + 25, x + 18, y + 32, hrColor, 1.5);
          drawMidpointLine(ctx, x + 18, y + 32, x + 12, y + 25, hrColor, 1.5);
          drawMidpointLine(ctx, x + 12, y + 10, x + 24, y + 25, hrColor, 1.5);
        };

        if (activeHearts >= 1) drawClassicHeart(600, base_y);
        if (activeHearts >= 2) drawClassicHeart(600 + spacing, base_y);
        if (activeHearts >= 3) drawClassicHeart(600 + 2 * spacing, base_y);

        // Paused visual overlay on play state
        if (s.isPaused) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(0, 0, WINDOW_X, WINDOW_Y);

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 32px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText("GAME PAUSED", 400, WINDOW_Y - 320);

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '14px "Inter", sans-serif';
          ctx.fillText("PRESS [P] OR TAP BLUE RESUME TO RETURN", 400, WINDOW_Y - 280);
        }
      }

      ctx.restore();
      s.frameId = requestAnimationFrame(loop);
    };

    s.frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.frameId);
  }, [renderMode]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-1">
      {/* HUD Bar above Canvas (Game Toggles & Mode Selection) */}
      <div className="w-full flex flex-wrap gap-2 items-center justify-between mb-4 bg-black border-2 border-zinc-800 p-3 rounded-lg shadow-lg">
        {/* Render Engine mode switch */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded border border-zinc-900">
          <button
            onClick={() => setRenderMode('NEO')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded text-[10px] uppercase font-bold tracking-[0.15em] font-mono transition duration-200 cursor-pointer ${
              renderMode === 'NEO'
                ? 'bg-[#00FF00] text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Sleek glowing modern neon layout"
          >
            <Flame size={12} className={renderMode === 'NEO' ? 'animate-pulse' : ''} />
            NEON SYNTH
          </button>
          <button
            onClick={() => setRenderMode('RETRO')}
            className={`flex items-center gap-1.5 py-1 px-3 rounded text-[10px] uppercase font-bold tracking-[0.15em] font-mono transition duration-200 cursor-pointer ${
              renderMode === 'RETRO'
                ? 'bg-orange-500 text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Authentic Bresenham OpenGL pixel alignments"
          >
            <Eye size={12} />
            RETRO OPENGL
          </button>
        </div>

        {/* Live game parameters indicator */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">SPEED:</span>
            <span className="font-bold text-[#00FF00]">{currentSpeed.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-zinc-950 rounded border border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">HI SCORE:</span>
            <span className="font-bold text-white">{highScore}</span>
          </div>
        </div>

        {/* Audio settings */}
        <button
          onClick={handleToggleSound}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded text-[10px] uppercase font-bold tracking-[0.15em] font-mono border-2 transition duration-200 cursor-pointer ${
            soundEnabled
              ? 'bg-[#00FF00]/10 border-[#00FF00]/30 text-[#00FF00] hover:bg-[#00FF00]/25'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400'
          }`}
        >
          {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          {soundEnabled ? 'AUDIO ON' : 'MUTED'}
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full overflow-hidden bg-black border-4 border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.9)] flex justify-center rounded-lg">
        <canvas
          id="retro_game_screen"
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleCanvasMouseDown}
          className="w-full h-auto aspect-[4/3] cursor-pointer block select-none bg-black focus:outline-none"
        />

        {/* Quick mobile touch trigger actions */}
        {gamePhase === 'PLAYING' && (
          <div className="absolute inset-x-0 bottom-6 px-6 flex justify-between pointer-events-none md:hidden">
            <div className="flex gap-2">
              <button
                onMouseDown={() => {
                  const s = stateRef.current;
                  s.player.x = Math.max(0, s.player.x - 30);
                }}
                className="w-14 h-14 rounded-full bg-black/80 border-2 border-zinc-700 backdrop-blur-md active:bg-[#00FF00] active:text-black text-white flex items-center justify-center font-bold text-xl pointer-events-auto transition"
              >
                ←
              </button>
              <button
                onMouseDown={() => {
                  const s = stateRef.current;
                  s.player.x = Math.min(WINDOW_X - 50, s.player.x + 30);
                }}
                className="w-14 h-14 rounded-full bg-black/80 border-2 border-zinc-700 backdrop-blur-md active:bg-[#00FF00] active:text-black text-white flex items-center justify-center font-bold text-xl pointer-events-auto transition"
              >
                →
              </button>
            </div>
            <button
              onMouseDown={() => {
                const s = stateRef.current;
                if (!s.player.isJumping) {
                  if (s.player.onFloor) {
                    s.player.vy = JUMP_VELOCITY;
                    s.player.isJumping = true;
                    s.player.onFloor = false;
                    s.player.onCeiling = true;
                  } else {
                    s.player.vy = -JUMP_VELOCITY;
                    s.player.isJumping = true;
                    s.player.onFloor = true;
                    s.player.onCeiling = false;
                  }
                  audio.playJump();
                }
              }}
              className="px-6 h-14 rounded-full bg-[#00FF00] border-2 border-white/20 active:bg-[#00CC00] text-black flex items-center justify-center font-display font-black text-xs tracking-widest shadow-xl pointer-events-auto transition"
            >
              SPACEBAR JUMP
            </button>
          </div>
        )}
      </div>

      {/* Column Footer */}
      <footer className="w-full mt-4 grid grid-cols-2 sm:grid-cols-4 border-2 border-zinc-800 bg-black divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 rounded-lg">
        <div className="flex flex-col p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] mb-1.5 font-mono">High Score</span>
          <span className="text-xl font-mono font-bold text-white">
            {String(highScore).padStart(6, '0')}
          </span>
        </div>
        <div className="flex flex-col p-4 bg-zinc-950/20">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] mb-1.5 font-mono">Difficulty</span>
          {currentSpeed <= 4.5 ? (
            <span className="text-xl font-display font-black tracking-tight italic text-emerald-400">EASY</span>
          ) : currentSpeed <= 7.0 ? (
            <span className="text-xl font-display font-black tracking-tight italic text-[#00FF00]">MEDIUM</span>
          ) : currentSpeed <= 9.0 ? (
            <span className="text-xl font-display font-black tracking-tight italic text-orange-500 font-bold">HARD</span>
          ) : (
            <span className="text-xl font-display font-black tracking-tight italic text-red-500 animate-pulse">EXPERT</span>
          )}
        </div>
        <div className="flex flex-col p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] mb-1.5 font-mono">Session Time</span>
          <span className="text-xl font-mono text-zinc-100 font-semibold">{formatTime(elapsedSeconds)}</span>
        </div>
        <button
          onClick={() => {
            if (gamePhase === 'PLAYING') {
              togglePause();
            } else {
              handleStartPlay();
            }
          }}
          className={`flex items-center justify-center p-4 font-mono font-bold tracking-widest text-xs transition duration-200 uppercase cursor-pointer select-none ${
            gamePhase === 'PLAYING'
              ? isPaused
                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : 'bg-[#00FF00]/10 text-[#00FF00] hover:bg-[#00FF00]/25'
          }`}
        >
          {gamePhase === 'PLAYING'
            ? isPaused
              ? 'RESUME ENGINE'
              : 'PAUSE ENGINE'
            : 'LAUNCH ENGINE'}
        </button>
      </footer>
    </div>
  );
}
