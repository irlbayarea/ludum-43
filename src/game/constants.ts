// Global Flags.
declare const FLAGS_DIMENSIONS: {
  width: number;
  height: number;
};

export const GROUND_LAYER_NAME = 'Ground';
export const UNIT_LAYER_NAME = 'Objects';
export const TILE_SIZE = 32;
export const SCREEN_WIDTH = Math.min(
  FLAGS_DIMENSIONS.width,
  window.document.documentElement!.clientWidth
);
export const SCREEN_HEIGHT = Math.min(
  FLAGS_DIMENSIONS.height,
  window.document.documentElement!.clientHeight
);
