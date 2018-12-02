import * as phaser from 'phaser';
import { Grid } from './grid';
import { Character, PhysicalUnit } from './unit';
import { UILayer, UILayerTile } from './ui-layer';
import { AIController } from './ai-controller';
import { IGridEvent, ObjectDataParser } from './parser';

/**
 * The World class defines the game world.
 */
export class World {
  private readonly grid!: Grid;
  private readonly uiLayer!: UILayer;
  private readonly aiController: AIController;
  private readonly gridEvents: IGridEvent[] = [];

  private selectedPlayerId: number = 0;

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
    new ObjectDataParser({
      spawnPlayer: c => {
        this.players.push(c);
      },
      spawnHostile: c => {
        this.zombies.push(c);
      },
      addGridEvent: e => {
        this.gridEvents.push(e);
      },
    }).parse(this.grid, tilemap);
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
