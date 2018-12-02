import * as phaser from 'phaser';
import { Grid } from './grid';
import { Character, PhysicalUnit } from './unit';
import { UNIT_LAYER_NAME } from '../constants';

/**
 * The World class defines the game world.
 */
export class World {
  private readonly grid: Grid;
  private selectedPlayerID: number = 0;
  private readonly uiLayer!: UILayer;

  constructor(
    public readonly scene: phaser.Scene,
    private readonly tilemap: phaser.Tilemaps.Tilemap,
    private readonly players: Character[],
    private readonly zombies: Character[]
  ) {
    this.grid = new Grid(this.tilemap);
    this.uiLayer = new UILayer(this.tilemap);
    // Instantiate the players.
    this.grid = new Grid(tilemap);
    this.loadFromTilemapObjectLayer(tilemap);
    this.selectPlayer(0);
  }

  public handleClick(gridX: number, gridY: number) {
    this.players.forEach((p, id) => {
      if (gridX === p.x && gridY === p.y) {
        this.selectPlayer(id);
      }
    });
  }

  public selectPlayer(id: number) {
    this.selectedPlayerID = id;
    this.uiLayer.setActive(this.players[id].x, this.players[id].y);
    this.scene.cameras.main.startFollow(this.players[id].sprite);
  }

  public getSelectedPlayer() {
    return this.selectedPlayerID;
  }

  /**
   * Returns an array of available unit actions for the given unit.
   */
  public getUnitActions(unit: PhysicalUnit): UnitAction[] {
    const actions: UnitAction[] = [];
    const x = unit.x;
    const y = unit.y;
    if (x > 0) {
      actions.push(new UnitAction('move', new phaser.Math.Vector2(x - 1, y)));
    }
    if (x < this.grid.width - 1) {
      actions.push(new UnitAction('move', new phaser.Math.Vector2(x + 1, y)));
    }
    if (y > 0) {
      actions.push(new UnitAction('move', new phaser.Math.Vector2(x, y - 1)));
    }
    if (y < this.grid.height - 1) {
      actions.push(new UnitAction('move', new phaser.Math.Vector2(x, y + 1)));
    }
    return actions;
  }

  /**
   * Loads the data from the object layer of the given tilemap.
   */
  private loadFromTilemapObjectLayer(tilemap: phaser.Tilemaps.Tilemap): void {
    const unitLayer = tilemap.getObjectLayer(UNIT_LAYER_NAME);
    unitLayer!.objects.forEach(gameObject => {
      const rawAssetObject = new RawAssetObject(gameObject, tilemap);
      if (rawAssetObject !== null) {
        switch (rawAssetObject.rawProperties.get('object-type')) {
          case 'pc-spawn':
            this.spawnPlayer(rawAssetObject);
            break;
          case 'hostile-spawn':
            this.spawnHostile(rawAssetObject);
            break;
        }
      }
    });
  }

  private spawnPlayer(asset: RawAssetObject): void {
    const player = Character.create(
      this.grid,
      this.grid.get(asset.tileX, asset.tileY),
      this.tilemap.scene,
      // tslint:disable-next-line:no-any
      asset.name as any,
      asset.rawProperties.get('name'),
      asset.rawProperties.get('hp'),
      asset.rawProperties.get('ap')
    );
    this.players.push(player);
  }

  private spawnHostile(asset: RawAssetObject): void {
    const player = Character.create(
      this.grid,
      this.grid.get(asset.tileX, asset.tileY),
      this.tilemap.scene,
      'npc',
      'Zombie',
      3,
      3
    );
    this.zombies.push(player);
  }
}

export class UnitAction {
  public readonly type: 'move' | 'attack';
  public readonly position: phaser.Math.Vector2;

  constructor(type: 'move' | 'attack', position: phaser.Math.Vector2) {
    this.type = type;
    this.position = new phaser.Math.Vector2(position);
  }
}

class UILayer {
  private readonly mLayer: phaser.Tilemaps.DynamicTilemapLayer;
  private selectedTiles: phaser.Tilemaps.Tile[] = [];

  constructor(parent: phaser.Tilemaps.Tilemap) {
    const tilemap = parent.scene.make.tilemap();
    const tileset = tilemap.addTilesetImage('colors', 'colors');
    this.mLayer = parent.createBlankDynamicLayer('UILayer', tileset);
    this.mLayer.alpha = 0.5;
    this.mLayer.depth = 10;
  }

  public setActive(x: number, y: number): void {
    // Clear anything on the UI layer.
    this.clearActive();

    // Make the selected tile yellow.
    this.insert(x, y, UILayerTile.GREEN);
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

/**
 * The RawAssetObject class represents a Tilemap object layer object.
 */
class RawAssetObject {
  public readonly name: string;
  public readonly x: number;
  public readonly y: number;
  public readonly tileX: number;
  public readonly tileY: number;
  // These are the "Custom properties" as set in Tiled editor.
  // tslint:disable-next-line:no-any
  public readonly rawProperties: Map<string, any>;

  /**
   * Constructs a RawAssetObject
   */
  constructor(
    gameObject: phaser.GameObjects.GameObject,
    tilemap: phaser.Tilemaps.Tilemap
  ) {
    // Need to access properties that are set by the asset loader but that don't
    // exist on GameObject for whatever reason.
    // tslint:disable-next-line:no-any
    const objData = (gameObject as any) as {
      name: string;
      x: number;
      y: number;
      width: number;
      properties: Array<{ name: string; type: string; value: string }>;
    };
    const rawProperties = new Map<string, string>();
    objData.properties.forEach(property => {
      rawProperties.set(property.name, property.value);
    });
    // We parsed them, now set this object's fields.
    this.name = objData.name;
    this.x = objData.x;
    this.y = objData.y;
    this.tileX = tilemap.worldToTileX(objData.x - objData.width / 2);
    this.tileY = tilemap.worldToTileY(objData.y - objData.width / 2);
    this.rawProperties = rawProperties;
  }
}
