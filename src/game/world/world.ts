import * as phaser from 'phaser';
import { Grid } from './grid';
import { Character, PhysicalUnit, UnitAction, UnitActionType } from './unit';
import { UILayer, UILayerTile } from './ui-layer';
import { AIController } from './ai-controller';
import { IGridEvent, ObjectDataParser } from './parser';
import { UIMenu } from '../ui';

/**
 * The World class defines the game world.
 */
export class World {
  private readonly grid!: Grid;
  private readonly uiLayer: UILayer;
  private readonly uiMenu: UIMenu;
  private readonly aiController: AIController;
  private readonly gridEvents: IGridEvent[] = [];
  private readonly players: Character[] = [];
  private readonly zombies: Character[] = [];

  private selectedPlayerId: number = 0;

  private playerActions: UnitAction[] = [];

  constructor(
    public readonly scene: phaser.Scene,
    private readonly tilemap: phaser.Tilemaps.Tilemap,
    groundLayer: phaser.Tilemaps.DynamicTilemapLayer
  ) {
    // Create UI.
    this.uiLayer = new UILayer(this.tilemap);
    this.uiMenu = new UIMenu(scene, this);
    this.scene.children.add(this.uiMenu);
    this.scene.input.topOnly = true;

    // Create grid, AI controller.
    this.grid = new Grid(tilemap, groundLayer);
    this.aiController = new AIController(this.grid, this.zombies);

    // Load JSON.
    this.loadFromTilemapObjectLayer(tilemap);

    // Select starting player.
    this.selectPlayer(0);

    // Introductory message box
    this.getSelectedPlayer().speak(
      this.scene,
      `I have to get as many people outta here as I can! Alien zombies are attacking our spaceship!`
    );
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
        if (action.type === UnitActionType.Move) {
          const cell = this.grid.get(gridX, gridY);
          const pc = this.getSelectedPlayer();
          pc.moveTo(cell);
          // Handle GridEvent 'speak' type
          this.gridEvents.forEach(ge => {
            if (ge.x === pc.x && ge.y === pc.y) {
              switch (ge.type) {
                case 'speak':
                  pc.speak(this.scene, ge.text);
                  break;
                case 'win':
                  let numAlive: number = 0;
                  this.players.forEach(p => {
                    if (p.stats.hitPoints > 0) {
                      numAlive += 1;
                    }
                  });

                  const successString: string = `I did it! I made it!\n${
                    numAlive > 1
                      ? `And even ${numAlive - 1} of my crewmates made it!`
                      : `Unforunately none of my crewmates survived...`
                  }`;

                  pc.speak(this.scene, successString);
                  break;
                default:
                  break;
              }
            }
          });
          // Reselect player to refresh actions etc.
          this.selectPlayer(this.getSelectedPlayerId());
          this.touchedFriendly();
        } else if (action.type === UnitActionType.Attack) {
          const pc = this.getSelectedPlayer();
          const target = action.targetUnit as Character;
          pc.attack(target);
          // Reselect player to refresh actions etc.
          this.selectPlayer(this.getSelectedPlayerId());
          this.touchedFriendly();
        }
      });
  }

  /**
   * Should be called on each game loop update.
   */
  public gameLoopUpdate(): void {
    this.uiMenu.update();
    this.players.forEach(p => p.update());
    this.zombies.forEach(p => p.update());
  }

  /**
   * Should be called when @param character enters the game.
   */
  public spawnFriendly(character: Character): void {
    this.players.push(character);
    this.uiMenu.addCharacter(character);
  }

  /**
   * Should be called when @param character is defeated.
   */
  public killFriendly(character: Character): void {
    this.players.splice(this.players.indexOf(character), 1);
    this.uiMenu.removeCharacter(character);
    // TODO: Remove from the screen.
    // TODO: Message or notification.
    // TODO: Ensure a dead unit is not selected.
  }

  /**
   * Should be called when @param character is mutated.
   */
  public touchedFriendly(): void {
    this.uiMenu.update();
  }

  /**
   * Should be called when @param character enters the game.
   */
  public spawnHostile(character: Character): void {
    this.zombies.push(character);
  }

  /**
   * Should be called when @param character is defeated.
   */
  public killHostile(character: Character): void {
    this.zombies.splice(this.players.indexOf(character), 1);
    // TODO: Remove from the screen.
    // TODO: Message or notification.
  }

  public selectPlayer(id: number): void {
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
        action.type === UnitActionType.Move ? UILayerTile.BLUE : UILayerTile.RED
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

    if (unit instanceof Character) {
      if (unit.stats.actionPoints <= 0) {
        return [];
      }
    }

    // Return a list of positions within a box
    // of height and width 2*d of current position
    const d: integer = 1;
    for (let i: integer = -d; i <= d; i += 1) {
      for (let j: integer = -d; j <= d; j += 1) {
        if (this.xyInBounds(x + i, y + j)) {
          const position = new phaser.Math.Vector2(x + i, y + j);
          // Can't move onto self.
          if (x === position.x && y === position.y) {
            continue;
          }
          // Check for attack action.
          const attackableUnit = this.grid.getAttackbleUnit(
            unit,
            position.x,
            position.y
          );
          if (attackableUnit !== null) {
            actions.push(
              new UnitAction(UnitActionType.Attack, position, attackableUnit)
            );
            continue;
          }
          // Check for move action.
          if (this.grid.isPathable(position.x, position.y)) {
            actions.push(new UnitAction(UnitActionType.Move, position));
            continue;
          }
        }
      }
    }

    return actions;
  }

  public endTurn(): void {
    this.aiController.doTurn();
    // Perform end-of-turn mechanics for PCs and enemies.
    [...this.players, ...this.zombies].forEach(unit => unit.newTurn());
    // Reselect player to refresh actions etc.
    this.selectPlayer(this.getSelectedPlayerId());
  }

  /**
   * Loads the data from the object layer of the given tilemap.
   */
  private loadFromTilemapObjectLayer(tilemap: phaser.Tilemaps.Tilemap): void {
    new ObjectDataParser({
      spawnPlayer: p => this.spawnFriendly(p),
      spawnHostile: z => this.spawnHostile(z),
      addGridEvent: e => this.gridEvents.push(e),
    }).parse(this.grid, tilemap);
  }
}
