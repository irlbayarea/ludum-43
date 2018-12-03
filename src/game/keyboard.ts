import * as phaser from 'phaser';

export class Keyboard {
  private readonly keys: Array<{
    name: string;
    key: phaser.Input.Keyboard.Key;
  }>;
  private lastKeyDown?: phaser.Input.Keyboard.Key;

  constructor(
    scene: phaser.Scene,
    private readonly onPress: (key: string) => void
  ) {
    function createKey(
      name: string
    ): {
      name: string;
      key: phaser.Input.Keyboard.Key;
    } {
      return {
        name,
        key: scene.input.keyboard.addKey(name),
      };
    }
    this.keys = [
      createKey('q'),
      createKey('w'),
      createKey('e'),
      createKey('a'),
      createKey('s'),
      createKey('d'),
      createKey('z'),
      createKey('c'),
    ];
  }

  public update(): void {
    if (this.lastKeyDown && this.lastKeyDown.isUp) {
      this.lastKeyDown = undefined;
    }
    for (const key of this.keys) {
      if (key.key.isDown && this.lastKeyDown !== key.key) {
        this.lastKeyDown = key.key;
        this.onPress(key.name);
        return;
      }
    }
  }
}
