import * as phaser from 'phaser';

import { Character, Control } from './unit';
import { Grid } from './grid';
import { World } from './world';

export class AIController {
  private static readonly rangeOfVisibility = 5;

  constructor(
    private readonly grid: Grid,
    private readonly world: World,
    private readonly zombies: Character[]
  ) {}

  /**
   * Runs a single turn of updates.
   *
   * This should *NOT* be run on the game loop, only when the playetr has ended
   * their turn and it is the AI's turn to make movements.
   */
  public doTurn(): void {
    this.zombies.forEach(z => {
      z.stats.restoreFull();
      const position = this.grid.get(z.x, z.y);
      const nearby: Character[] = [];
      for (const cell of position.adjacentCells(
        AIController.rangeOfVisibility
      )) {
        for (const unit of cell.units) {
          if (unit instanceof Character && unit.control === Control.Friendly) {
            nearby.push(unit);
          }
        }
      }
      this.doActions(z, nearby);
    });
  }

  /**
   * Orders @param zombie to perform actions until they run out of AP.
   *
   * May take @param nearby characters into account.
   */
  private doActions(zombie: Character, nearby: Iterable<Character>): void {
    while (zombie.stats.actionPoints) {
      this.doAction(zombie, nearby);
    }
  }

  private doAction(zombie: Character, nearby: Iterable<Character>): void {
    // Primary: Attack.
    const closest = AIController.closest(
      new phaser.Math.Vector2(zombie.x, zombie.y),
      nearby
    );
    if (closest !== null) {
      if (AIController.inMeleeRange(zombie, closest)) {
        this.doAttack(zombie, closest);
        return;
      }

      // Seconary: Move.
      this.doMoveTowards(zombie, closest);
      return;
    }

    // Tertiary: Wander.
    // TODO. For now just exhaust AP.
    zombie.stats.useActionPoints();
  }

  private doAttack(zombie: Character, human: Character): void {
    this.world.performAttack(zombie, human);
  }

  private doMoveTowards(zombie: Character, human: Character): void {
    zombie.stats.useActionPoints();
    let x = 0;
    let y = 0;
    if (human.x > zombie.x) {
      x = 1;
    } else if (human.x < zombie.x) {
      x = -1;
    }
    if (human.y > zombie.y) {
      y = 1;
    } else if (human.y < zombie.y) {
      y = -1;
    }
    zombie.moveTo(this.grid.get(zombie.x + x, zombie.y + y));
  }

  private static closest(
    to: phaser.Math.Vector2,
    humans: Iterable<Character>
  ): Character | null {
    let minDistance = Number.MAX_SAFE_INTEGER;
    let result: Character | null = null;
    for (const human of humans) {
      const position = new phaser.Math.Vector2(human.x, human.y);
      const distance = position.distance(to);
      if (distance < minDistance) {
        minDistance = distance;
        result = human;
      }
    }
    return result;
  }

  private static inMeleeRange(zombie: Character, human: Character): boolean {
    return (
      Math.abs(zombie.x - human.x) <= 1 && Math.abs(zombie.y - human.y) <= 1
    );
  }
}
