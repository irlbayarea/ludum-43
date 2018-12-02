import * as phaser from 'phaser';
import { PhysicalUnit } from './unit';

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
    return this.units;
  }

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
    return !this.mUnits.some(u => u.preventsMovement);
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
