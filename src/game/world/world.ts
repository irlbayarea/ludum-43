import * as phaser from 'phaser';
import { Grid } from './grid';
import { Character, PhysicalUnit, Statistics, Control } from './unit';
import { UNIT_LAYER_NAME } from '../constants';
import { UILayer, UILayerTile } from './ui-layer';
import { AIController } from './ai-controller';

/**
 * The World class defines the game world.
 */
export class World {
  private readonly grid!: Grid;
  private readonly uiLayer!: UILayer;
  private readonly aiController: AIController;

  private selectedPlayerId: number = 0;

  private playerActions: UnitAction[] = [];
  private readonly gridEvents: GridEvent[] = [];

  constructor(
    public readonly scene: phaser.Scene,
    private readonly tilemap: phaser.Tilemaps.Tilemap,
    groundLayer: phaser.Tilemaps.DynamicTilemapLayer,
    private readonly players: Character[],
    private readonly zombies: Character[]
  ) {
    this.uiLayer = new UILayer(this.tilemap);
    this.grid = new Grid(tilemap, groundLayer);
    this.aiController = new AIController(this.grid, this.zombies);
    this.loadFromTilemapObjectLayer(tilemap);
    this.selectPlayer(0);
  }

  public handleClick(gridX: number, gridY: number) {
    // Handle player character selection.
    let didSelectPlayer = false;
    this.players.forEach((p, id) => {
      if (gridX === p.x && gridY === p.y) {
        this.selectPlayer(id);
        didSelectPlayer = true;
      }
    });
    // Don't allow selection and movement in the same click.
    if (didSelectPlayer) {
      return;
    }
    // Handle player character actions.
    this.playerActions
      .filter(
        action => gridX === action.position.x && gridY === action.position.y
      )
      .forEach(action => {
        if (action.type === 'move') {
          const cell = this.grid.get(gridX, gridY);
          this.getSelectedPlayer().moveTo(cell);

          // Handle GridEvent 'speak' type
          this.gridEvents.forEach(ge => {
            if (
              ge.x === this.getSelectedPlayer().x &&
              ge.y === this.getSelectedPlayer().y
            ) {
              this.getSelectedPlayer().speak(this.scene, ge.text);
            }
          });

          this.selectPlayer(this.getSelectedPlayerId());
        } else if (action.type === 'attack') {
          // tslint:disable-next-line:no-console
          console.log(`Attacking ${(action.targetUnit as Character).name}.`);
        }
      });
  }

  public selectPlayer(id: number) {
    this.selectedPlayerId = id;
    this.uiLayer.clearActive();
    this.uiLayer.setActive(this.players[id].x, this.players[id].y);
    this.scene.cameras.main.startFollow(this.players[id].sprite);
    this.updatePlayerActions();
  }

  /**
   * Updates the available actions that the currently selected PC may make.
   */
  private updatePlayerActions() {
    this.playerActions = this.getUnitActions(this.getSelectedPlayer());
    for (const action of this.playerActions) {
      this.uiLayer.setActive(
        action.position.x,
        action.position.y,
        action.type === 'move' ? UILayerTile.BLUE : UILayerTile.RED
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
          // Can't move onto self.
          if (x === x + i && y === y + j) {
            continue;
          }
          const position = new phaser.Math.Vector2(x + i, y + j);
          if (this.grid.isPathable(position.x, position.y)) {
            actions.push(new UnitAction('move', position));
          }
          const attackableUnit = this.grid.getAttackbleUnit(unit, x + i, y + j);
          if (attackableUnit !== null) {
            actions.push(new UnitAction('attack', position, attackableUnit));
          }
        }
      }
    }

    return actions;
  }

  public endTurn(): void {
    this.aiController.doTurn();
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
          case 'grid-event':
            this.addGridEvent(rawAssetObject);
            break;
        }
      }
    });
  }

  private addGridEvent(asset: RawAssetObject): void {
    this.gridEvents.push(
      new GridEvent(
        asset.tileX,
        asset.tileY,
        asset.rawProperties.get('grid-event-type'),
        asset.rawProperties.get('text')
      )
    );
  }

  private spawnPlayer(asset: RawAssetObject): void {
    const player = Character.create(
      this.grid,
      this.grid.get(asset.tileX, asset.tileY),
      this.tilemap.scene,
      // tslint:disable-next-line:no-any
      asset.name as any,
      Control.Friendly,
      asset.rawProperties.get('name'),
      new Statistics(
        asset.rawProperties.get('hp'),
        asset.rawProperties.get('ap')
      )
    );
    this.players.push(player);
  }

  private spawnHostile(asset: RawAssetObject): void {
    const player = Character.create(
      this.grid,
      this.grid.get(asset.tileX, asset.tileY),
      this.tilemap.scene,
      'npc',
      Control.Hostile,
      'Zombie',
      new Statistics(2, 4)
    );
    this.zombies.push(player);
  }
}

export class UnitAction {
  constructor(
    public readonly type: 'move' | 'attack',
    public readonly position: phaser.Math.Vector2,
    public readonly targetUnit: PhysicalUnit | null = null
  ) {
    this.type = type;
    this.position = new phaser.Math.Vector2(position);
  }
}

/**
 * Class encapsulating an event associated with a specific space in the world grid
 */
export class GridEvent {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly type: 'speak',
    public readonly text: string
  ) {}
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
