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
      name: string | phaser.Input.Keyboard.KeyCodes,
      humanized = `${name}`
    ): {
      name: string;
      key: phaser.Input.Keyboard.Key;
    } {
      return {
        name: humanized,
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
      createKey('tab'),
      createKey(phaser.Input.Keyboard.KeyCodes.ONE, '1'),
      createKey(phaser.Input.Keyboard.KeyCodes.TWO, '2'),
      createKey(phaser.Input.Keyboard.KeyCodes.THREE, '3'),
      createKey(phaser.Input.Keyboard.KeyCodes.SPACE, 'space'),
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
