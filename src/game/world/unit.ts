import { TILE_SIZE } from './../constants';
import * as phaser from 'phaser';
import { Cell, Grid } from './grid';
import { MessageBox } from '../messageBox';

/**
 * What controls a given @see PhysicalUnit.
 */
export enum Control {
  Friendly,
  Hostile,
  Neutral,
}

/**
 * Represents a 2D entity on the @see Grid.
 *
 * The unit may or may not be _phyiscally_ displayed (for example, a spawn
 * location, invisible gate, or other marker-like location or trigger). See also
 * @see DisplayUnit.
 */
export class PhysicalUnit {
  /**
   * @param grid Grid the unit is present on.
   * @param cell Cell the unit should be added to.
   */
  constructor(
    protected readonly grid: Grid,
    protected cell: Cell,
    public control = Control.Neutral
  ) {
    cell.addUnit(this);
  }

  /**
   * Update the object on the game loop.
   */
  public update(): void {
    // Not implemented for PhysicalUnit.
  }

  /**
   * X-coordinate within the grid.
   */
  public get x() {
    return this.cell.x;
  }

  /**
   * Y-coordinate within the grid.
   */
  public get y() {
    return this.cell.y;
  }

  /**
   * Moves the unit immediately to @param newCell.
   *
   * This function will not trigger any animation, and the sprite, if any, may
   * appear to "teleport". Where possible, use the @see {moveTo} function in
   * order to make the action appear graceful.
   *
   * **NOTE**: This function does not validate if the move is valid!
   */
  public moveImmediate(newCell: Cell): void {
    this.cell.removeUnit(this);
    this.cell = newCell;
    this.cell.addUnit(this);
  }

  /**
   * Moves the unit to @param newCell.
   *
   * The @see cell property immediately will change, but the physical location
   * of the sprite may take additional time (i.e. to give the appearance of
   * walking).
   *
   * The returned @see Promise completes when the animation is complete, if any.
   *
   * **NOTE**: This function does not validate if the move is valid!
   */
  public moveTo(newCell: Cell): Promise<void> {
    this.moveImmediate(newCell);
    return Promise.resolve();
  }

  /**
   * Whether this unit is physically visible to the user.
   */
  public get isVisible(): boolean {
    return false;
  }

  /**
   * Whether this unit physically prevents movement into its cell.
   */
  public get preventsMovement(): boolean {
    return this.isVisible;
  }
}

export class DisplayUnit extends PhysicalUnit {
  constructor(
    grid: Grid,
    cell: Cell,
    control: Control,
    public readonly sprite: phaser.GameObjects.Sprite
  ) {
    super(grid, cell, control);
  }

  public update(): void {
    this.sprite.setPosition(
      (this.x + 0.5) * this.sprite.width,
      (this.y + 0.5) * this.sprite.height
    );
  }

  public get isVisible(): boolean {
    return true;
  }
}

export class Statistics {
  private mHitPoints: number;
  private mActionPoints: number;

  constructor(
    private readonly maxHitPoints: number,
    private readonly maxActionPoints: number
  ) {
    this.mHitPoints = maxHitPoints;
    this.mActionPoints = maxActionPoints;
  }

  public get actionPoints() {
    return this.mActionPoints;
  }

  public useActionPoints(amount = 1): boolean {
    const newActionPoints = this.mActionPoints - amount;
    if (newActionPoints >= 0) {
      this.mActionPoints = newActionPoints;
      return true;
    }
    return false;
  }

  public get hitPoints() {
    return this.mHitPoints;
  }

  public useHitPoints(amount = 1): boolean {
    const newHitPoints = this.mHitPoints - amount;
    if (newHitPoints >= 0) {
      this.mHitPoints = newHitPoints;
      return true;
    }
    return false;
  }

  public healBy(amount = 1): void {
    const newHitPoints = this.mHitPoints + amount;
    this.mHitPoints = Math.min(this.maxHitPoints, newHitPoints);
  }

  public healFull(): void {
    this.mHitPoints = this.maxHitPoints;
  }

  public restoreBy(amount = 1): void {
    const newActionPoints = this.mActionPoints + amount;
    this.mActionPoints = Math.min(this.maxActionPoints, newActionPoints);
  }

  public restoreFull(): void {
    this.mActionPoints = this.maxActionPoints;
  }
}

export class Character extends DisplayUnit {
  public static create(
    grid: Grid,
    cell: Cell,
    scene: phaser.Scene,
    sprite: 'pc-1' | 'pc-2' | 'pc-3' | 'npc',
    control: Control,
    name: string,
    stats: Statistics
  ): Character {
    return new Character(
      grid,
      cell,
      scene.make.sprite({
        key: sprite,
      }),
      control,
      name,
      stats
    );
  }

  private constructor(
    grid: Grid,
    cell: Cell,
    sprite: phaser.GameObjects.Sprite,
    control: Control,
    public readonly name: string,
    public readonly stats: Statistics
  ) {
    super(grid, cell, control, sprite);
    this.sprite.setSize(TILE_SIZE, TILE_SIZE);
    this.sprite.setInteractive({
      useHandCursor: true,
    }); // Makes hand cursor show up when pointer over Character
    this.sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
  }

  // Rotates sprite according to new direction it is facing
  public moveImmediate(newCell: Cell): void {
    const rotAngle: number = Math.atan2(
      newCell.y - this.cell.y,
      newCell.x - this.cell.x
    );

    super.moveImmediate(newCell);

    this.sprite.rotation = rotAngle;
  }

  /**
   * Displays a MessageBox with text
   * @param scene
   * @param text
   */
  public speak(scene: phaser.Scene, text: string) {
    // Display message box
    const msgbox = new MessageBox(scene, this, text);
    scene.children.add(msgbox);
  }
}

export enum UnitActionType {
  Move,
  Attack,
}

export class UnitAction {
  constructor(
    public readonly type: UnitActionType,
    public readonly position: phaser.Math.Vector2,
    public readonly targetUnit: PhysicalUnit | null = null
  ) {
    this.type = type;
    this.position = new phaser.Math.Vector2(position);
  }
}
