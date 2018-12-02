import * as phaser from 'phaser';
import { Grid } from './grid';
import { Character, PhysicalUnit } from './unit';
import { UNIT_LAYER_NAME } from '../constants';
import { UILayer, UILayerTile } from './ui-layer';

/**
 * The World class defines the game world.
 */
export class World {
  private readonly grid!: Grid;
  private selectedPlayerId: number = 0;
  private readonly uiLayer!: UILayer;
  private playerActions: UnitAction[] = [];

  constructor(
    public readonly scene: phaser.Scene,
    private readonly tilemap: phaser.Tilemaps.Tilemap,
    groundLayer: phaser.Tilemaps.DynamicTilemapLayer,
    private readonly players: Character[],
    private readonly zombies: Character[]
  ) {
    this.uiLayer = new UILayer(this.tilemap);
    this.grid = new Grid(tilemap, groundLayer);
    this.loadFromTilemapObjectLayer(tilemap);
    this.selectPlayer(0);
  }

  public handleClick(gridX: number, gridY: number) {
    let didSelectPlayer = false;
    this.players.forEach((p, id) => {
      if (gridX === p.x && gridY === p.y) {
        this.selectPlayer(id);
        didSelectPlayer = true;
      }
    });
    if (didSelectPlayer) {
      return;
    }
    this.playerActions
      .filter(
        action => gridX === action.position.x && gridY === action.position.y
      )
      .forEach((_) /* action */ => {
        const cell = this.grid.get(gridX, gridY);
        this.getSelectedPlayer().moveImmediate(cell);
        this.selectPlayer(this.getSelectedPlayerId());
      });
  }

  public selectPlayer(id: number) {
    this.selectedPlayerId = id;
    this.uiLayer.clearActive();
    this.uiLayer.setActive(this.players[id].x, this.players[id].y);
    this.scene.cameras.main.startFollow(this.players[id].sprite);
    this.updatePlayerActions();

    this.players[id].speak(this.scene, 'Oh gawd get us outta here!');
  }

  private updatePlayerActions() {
    this.playerActions = this.getUnitActions(this.getSelectedPlayer());
    for (const action of this.playerActions) {
      this.uiLayer.setActive(
        action.position.x,
        action.position.y,
        UILayerTile.BLUE
      );
    }
  }

  public getSelectedPlayerId() {
    return this.selectedPlayerId;
  }

  public getSelectedPlayer() {
    return this.players[this.selectedPlayerId];
  }

  public xyInBounds(x: number, y: number) {
    return x >= 0 && x <= this.grid.width && y >= 0 && y <= this.grid.height;
  }

  /**
   * Returns an array of available unit actions for the given unit.
   */
  public getUnitActions(unit: PhysicalUnit): UnitAction[] {
    const actions: UnitAction[] = [];
    const x = unit.x;
    const y = unit.y;

    // Return a list of positions within a box
    // of height and width 2*d of current position
    const d: integer = 1;
    for (let i: integer = -d; i <= d; i += 1) {
      for (let j: integer = -d; j <= d; j += 1) {
        if (this.xyInBounds(x + i, y + j)) {
          const position = new phaser.Math.Vector2(x + i, y + j);
          const cell = this.grid.get(position.x, position.y);
          if (cell !== null && !cell.collides()) {
            actions.push(new UnitAction('move', position));
          }
        }
      }
    }

    return actions;
  }

  public endTurn(): void {
    // tslint:disable-next-line:no-console
    console.log('--- END TURN ---');
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
