export type GamePhase = 'START' | 'PLAYING' | 'GAMEOVER';

export interface GameObstacle {
  id: string;
  type: 'BLOCK' | 'TRIANGLE';
  x: number;
  y: number; // OpenGL coordinate (0 at ground_y, etc., but we use standard 0..600 coordinate where 0 is bottom)
  width: number;
  height: number;
  flipped?: boolean;
  passed: boolean;
  color?: string;
  glowColor?: string;
}

export interface PlayerState {
  x: number;
  y: number;
  vy: number;
  isJumping: boolean;
  onFloor: boolean;
  onCeiling: boolean;
  pulseColor: string;
}

export const WINDOW_X = 800;
export const WINDOW_Y = 600;

export const GROUND_Y = 200;
export const CEILING_Y = 400;

export const BLOCK_WIDTH = 80;
export const BLOCK_HEIGHT = 50;

export const TRIANGLE_BASE = 80;
export const TRIANGLE_HEIGHT = 60;

export const MIN_GAP = 120;
export const SPEED_INCREMENT = 0.00015;
export const MAX_SPEED = 10;
export const INITIAL_SPEED = 1.0;
export const JUMP_VELOCITY = 10;
