import * as phaser from 'phaser';

export class UILayer {
  private readonly mLayer: phaser.Tilemaps.DynamicTilemapLayer;
  private selectedTiles: phaser.Tilemaps.Tile[] = [];

  constructor(parent: phaser.Tilemaps.Tilemap) {
    const tilemap = parent.scene.make.tilemap();
    const tileset = tilemap.addTilesetImage('colors', 'colors');
    this.mLayer = parent.createBlankDynamicLayer('UILayer', tileset);
    this.mLayer.alpha = 0.5;
    this.mLayer.depth = 10;
  }

  public setActive(
    x: number,
    y: number,
    uiLayerTile: UILayerTile = UILayerTile.GREEN
  ): void {
    // Make the selected tile yellow.
    this.insert(x, y, uiLayerTile);
  }

  public clearActive(): void {
    this.selectedTiles.forEach(t => this.mLayer.removeTileAt(t.x, t.y));
    this.selectedTiles = [];
  }

  private insert(x: number, y: number, tile: UILayerTile): void {
    this.selectedTiles.push(this.mLayer.putTileAt(tile, x, y));
  }
}

export enum UILayerTile {
  BLACK = 0,
  RED = 3,
  YELLOW = 5,
  GREEN = 6,
  BLUE = 7,
}
