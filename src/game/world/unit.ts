import { TILE_SIZE } from './../constants';
import * as phaser from 'phaser';
import { Cell, Grid } from './grid';
import { MessageBox } from '../messageBox';

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
  constructor(protected readonly grid: Grid, protected cell: Cell) {
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
    public readonly sprite: phaser.GameObjects.Sprite
  ) {
    super(grid, cell);
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

export class Character extends DisplayUnit {
  public static create(
    grid: Grid,
    cell: Cell,
    scene: phaser.Scene,
    sprite: 'pc-1' | 'pc-2' | 'pc-3' | 'npc',
    name: string,
    hitPoints: number,
    actionPoints: number
  ): Character {
    return new Character(
      grid,
      cell,
      scene.make.sprite({
        key: sprite,
      }),
      name,
      hitPoints,
      actionPoints
    );
  }

  private constructor(
    grid: Grid,
    cell: Cell,
    sprite: phaser.GameObjects.Sprite,
    public readonly name: string,
    private readonly mHitPoints: number,
    private readonly mActionPoints: number
  ) {
    super(grid, cell, sprite);
    this.sprite.setSize(TILE_SIZE, TILE_SIZE);
    this.sprite.setInteractive({
      useHandCursor: true,
    }); // Makes hand cursor show up when pointer over Character
    this.sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
  }

  public get actionPoints() {
    return this.mActionPoints;
  }

  public get hitPoints() {
    return this.mHitPoints;
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
