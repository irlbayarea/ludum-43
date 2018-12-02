import * as phaser from 'phaser';

const menuOutline = 0x00ff00;
const menuForeground = 0xffffff;
const paddingSize = 0;
const textSize = 14;

export class Speech extends phaser.GameObjects.Container {
  private readonly graphics: phaser.GameObjects.Graphics;
  private readonly textGraphics: phaser.GameObjects.Text;

  constructor(
    public readonly scene: phaser.Scene,
    private readonly text: string,
    x: number,
    y: number
  ) {
    super(scene, 0, 0);

    const lines = this.text.split('\n');

    // tslint:disable-next-line:no-console
    console.log(`${lines.length}`);
    // tslint:disable-next-line:no-console
    console.log(`${x},${y}`);

    const lineLens: number[] = [];
    lines.forEach((l, i) => {
      lineLens[i] = l.length;
    });

    this.width = Math.max(...lineLens) * textSize * 0.6;
    this.height = lines.length * textSize;

    // Create Title Text.
    this.textGraphics = this.scene.add.text(
      paddingSize,
      paddingSize,
      this.text,
      { wordWrap: { width: 300, useAdvancedWrap: true } }
    );
    this.textGraphics.setFontSize(textSize);
    this.textGraphics.setColor('black');

    this.width = 300;
    this.height = this.textGraphics.height;

    // Draw Speech Bubble
    this.graphics = this.scene.add.graphics();
    this.add(this.graphics);
    this.add(this.textGraphics);
    this.update();

    // Ignore Camera.
    this.setScrollFactor(0, 0);

    // tslint:disable-next-line:no-console
    console.log(`Displaying speech buble: ${this.text}`);
  }

  public update(): void {
    this.graphics.clear();
    this.graphics.lineStyle(1, menuOutline);
    this.graphics.fillStyle(menuForeground);
    this.graphics.strokeRect(0, 0, this.width, this.height);
    this.graphics.fillRect(0, 0, this.width, this.height);
  }
}
