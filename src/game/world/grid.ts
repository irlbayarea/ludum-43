import * as phaser from 'phaser';
import { PhysicalUnit, Control } from './unit';

/**
 * The Cell class defines an immutable grid cell.
 */
export class Cell {
  private readonly mUnits: PhysicalUnit[] = [];

  /**
   * @param collides Returns whether this cell blocks movement.
   */
  constructor(
    private readonly grid: Grid,
    public readonly collides: () => boolean,
    public readonly x: number,
    public readonly y: number
  ) {}

  /**
   * Adds @param unit to the cell if it does not already exist.
   *
   * Returns whether it was added.
   */
  public addUnit(unit: PhysicalUnit): boolean {
    if (!this.hasUnit(unit)) {
      this.mUnits.push(unit);
      return true;
    }
    return false;
  }

  /**
   * Returns whether @param unit is within the cell.
   */
  public hasUnit(unit: PhysicalUnit): boolean {
    return this.mUnits.indexOf(unit) !== -1;
  }

  /**
   * Removes @param unit from the cell.
   *
   * Returns whether it was removed.
   */
  public removeUnit(unit: PhysicalUnit): boolean {
    const index = this.mUnits.indexOf(unit);
    if (index === -1) {
      return false;
    }
    this.mUnits.splice(index, 1);
    return true;
  }

  /**
   * Enumerable collection of all the units in the location.
   */
  public get units(): Iterable<PhysicalUnit> {
    return this.mUnits;
  }

  // TODO: Implement this function as "getCellsInWalkingDistance" and use it in
  // world.ts getUnitActions.
  /**
   * Enumerable collection of cells within a distance @param fill of current.
   */
  public adjacentCells(fill = 1): Iterable<Cell> {
    const results = [];
    for (let i = -fill; i <= fill; i += 1) {
      for (let j = -fill; j <= fill; j += 1) {
        results.push(this.grid.get(this.x + i, this.y + j));
      }
    }
    return results.filter(r => r !== null);
  }
  /**
   * Whether this cell can handle characters moving into it.
   */
  public get isPathable(): boolean {
    return !this.collides() && !this.mUnits.some(u => u.preventsMovement);
  }

  /**
   * Returns the units that are attackable by the given @param attackingUnit,
   * which may be none.
   */
  public getAttackableUnits(
    attackingUnit: PhysicalUnit
  ): Iterable<PhysicalUnit> {
    return this.mUnits.filter(attackedUnit => {
      // Neutral can't attack or be attacked.
      if (
        attackingUnit.control === Control.Neutral ||
        attackedUnit.control === Control.Neutral
      ) {
        return false;
      }
      return attackingUnit.control !== attackedUnit.control;
    });
  }

  /**
   * Enumerable collection of adjacent pathable cells.
   */
  public pathableCells(fill = 1): Iterable<Cell> {
    return Array.from(this.adjacentCells(fill)).filter(f => f.isPathable);
  }
}

/**
 * The Grid class defines a 2D grid of Cell objects.
 */
export class Grid {
  public readonly width: number;
  public readonly height: number;
  private readonly cells: Cell[];

  // Constructs a new Grid from the given tilemap.
  constructor(
    tilemap: phaser.Tilemaps.Tilemap,
    groundLayer: phaser.Tilemaps.DynamicTilemapLayer
  ) {
    this.width = tilemap.width;
    this.height = tilemap.height;
    this.cells = new Array<Cell>(this.width * this.height);
    for (let y: number = 0; y < this.height; y++) {
      for (let x: number = 0; x < this.width; x++) {
        const collidesFn = () => {
          const tile = groundLayer.getTileAt(x, y);
          // Consider blank tiles collidable.
          return tile === null || tile.collides;
        };
        this.set(x, y, new Cell(this, collidesFn, x, y));
      }
    }
  }

  /**
   * Returns whether the cell at the given coordinates can be moved into. Given
   * coordinates may be off the grid (in which case returns false).
   */
  public isPathable(x: number, y: number): boolean {
    // Can't walk off the edge.
    if (!this.isOnGrid(x, y)) {
      return false;
    }
    return this.get(x, y).isPathable;
  }

  /**
   * Returns a unit that is attackable by the @param unit at the given
   * coordinates, or null if no such unit exists at the given cell.
   */
  public getAttackbleUnit(
    attackingUnit: PhysicalUnit,
    x: number,
    y: number
  ): PhysicalUnit | null {
    if (!this.isOnGrid(x, y)) {
      return null;
    }
    const cell = this.get(x, y);
    const attackableUnits = Array.from(cell.getAttackableUnits(attackingUnit));
    if (attackableUnits.length !== 0) {
      return attackableUnits[0];
    } else {
      return null;
    }
  }

  /**
   * Returns whether the given coordinates are on the grid.
   */
  public isOnGrid(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x <= this.width - 1 && y <= this.height - 1;
  }

  /**
   * Returns the cell at @param x, @param y.
   */
  public get(x: number, y: number): Cell {
    return this.cells[x + y * this.width];
  }

  /**
   * Set the cell at the @param x, @param y to @param cell.
   */
  private set(x: number, y: number, cell: Cell): void {
    this.cells[x + y * this.width] = cell;
  }
}
