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

  /**
   * Updates this unit's state based on end-of-turn mechanics.
   */
  // tslint:disable-next-line:no-empty
  public newTurn(): void {}
}

/**
 * Represents a renderable unit.
 */
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

  /**
   * Updates this unit's state based on end-of-turn mechanics.
   */
  // tslint:disable-next-line:no-empty
  public newTurn(): void {
    super.newTurn();
  }
}

export class Statistics {
  private mHitPoints: number;
  private mActionPoints: number;

  constructor(
    private readonly mMaxHitPoints: number,
    private readonly maxActionPoints: number
  ) {
    this.mHitPoints = mMaxHitPoints;
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

  /**
   * Decreases hit points. Returns whether character is dead after HP loss.
   */
  public useHitPoints(amount = 1): boolean {
    const newHitPoints = this.mHitPoints - amount;
    this.mHitPoints = Math.max(newHitPoints, 0);
    return newHitPoints === 0;
  }

  public healBy(amount = 1): void {
    const newHitPoints = this.mHitPoints + amount;
    this.mHitPoints = Math.min(this.mMaxHitPoints, newHitPoints);
  }

  public healFull(): void {
    this.mHitPoints = this.mMaxHitPoints;
  }

  public restoreBy(amount = 1): void {
    const newActionPoints = this.mActionPoints + amount;
    this.mActionPoints = Math.min(this.maxActionPoints, newActionPoints);
  }

  public restoreFull(): void {
    this.mActionPoints = this.maxActionPoints;
  }

  public get maxHitPoints(): number {
    return this.mMaxHitPoints;
  }
}

const hpBarH: number = 15;
const hpBarX: number = 0;
const hpBarY: number = TILE_SIZE;
const greenBarColor: number = 0xffffff;
const redBarColor: number = 0xffffff;
const textColor: string = '#FFFFFF';

export class HealthBar extends phaser.GameObjects.Container {
  public readonly greenBar!: phaser.GameObjects.Graphics;
  public readonly redBar!: phaser.GameObjects.Graphics;
  public readonly textBar!: phaser.GameObjects.Text;

  constructor(scene: phaser.Scene) {
    super(scene, hpBarX, hpBarY);

    this.setSize(TILE_SIZE, hpBarH);

    this.greenBar = this.scene.add
      .graphics()
      .fillRect(this.x, this.y, TILE_SIZE, hpBarH)
      .fillStyle(greenBarColor);
    this.redBar = this.scene.add
      .graphics()
      .fillRect(this.x, this.y, 0, hpBarH)
      .fillStyle(redBarColor);
    this.textBar = this.scene.add.text(hpBarX, hpBarY, `UNINITIALIZED`);

    this.textBar.setColor(textColor);
    this.textBar.setFontSize(10);

    this.add(this.greenBar);
    this.add(this.redBar);
    this.add(this.textBar);

    this.setVisible(false);
  }

  public refresh(c: Character): void {
    this.setPosition(c.x * TILE_SIZE, c.y * TILE_SIZE);

    const gw = (c.stats.hitPoints / c.stats.maxHitPoints) * TILE_SIZE;

    this.greenBar.fillRect(this.x, this.y, gw, hpBarH);

    this.redBar.fillRect(this.x + gw, this.y, TILE_SIZE - gw, hpBarH);

    this.textBar.text = `${c.stats.hitPoints}/${c.stats.maxHitPoints}`;
    this.textBar.setPosition(
      hpBarX + this.textBar.width / 2,
      hpBarY + (hpBarH - this.textBar.height) / 2
    );
  }
}

export class Character extends DisplayUnit {
  public static create(
    grid: Grid,
    cell: Cell,
    scene: phaser.Scene,
    sprite: 'pc-1' | 'pc-2' | 'pc-3' | 'bad-1' | 'bad-2' | 'bad-3',
    control: Control,
    name: string,
    stats: Statistics
  ): Character {
    const healthbar = new HealthBar(scene);
    scene.children.add(healthbar);
    return new Character(
      grid,
      cell,
      scene.make.sprite({
        key: sprite,
      }),
      control,
      name,
      stats,
      healthbar
    );
  }

  private constructor(
    grid: Grid,
    cell: Cell,
    sprite: phaser.GameObjects.Sprite,
    control: Control,
    public readonly name: string,
    public readonly stats: Statistics,
    private readonly healthbar: HealthBar
  ) {
    super(grid, cell, control, sprite);
    this.sprite.setSize(TILE_SIZE, TILE_SIZE);
    this.sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.sprite
      .setInteractive({
        useHandCursor: true,
      })
      .on('pointerover', () => {
        this.healthbar.refresh(this);
        this.healthbar.setVisible(true);
      })
      .on('pointerout', () => {
        this.healthbar.setVisible(false);
      });
  }

  /**
   * Moves the character without animation.
   */
  public moveImmediate(newCell: Cell): void {
    // Rotate sprite according to new direction it is facing.
    const rotAngle: number = Math.atan2(
      newCell.y - this.cell.y,
      newCell.x - this.cell.x
    );
    this.sprite.rotation = rotAngle;
    // Update AP.
    this.stats.useActionPoints(1);
    // Perform move.
    super.moveImmediate(newCell);
  }

  /**
   * Displays a MessageBox with text
   * @param scene
   * @param text
   */
  public speak(scene: phaser.Scene, text: string, choices: string[] = []) {
    // Display message box
    const msgbox = new MessageBox(scene, this, text, choices);
    scene.children.add(msgbox);
  }

  /**
   * Updates this character's state based on end-of-turn mechanics.
   */
  public newTurn(): void {
    this.stats.restoreFull();
    super.newTurn();
  }

  /**
   * This character performs an attack on the target character.
   */
  public attack(target: Character) {
    this.stats.useActionPoints(1);
    target.stats.useHitPoints(1);
  }

  /**
   * Returns whether this character is dead.
   */
  public get isDead(): boolean {
    return this.stats.hitPoints === 0;
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
