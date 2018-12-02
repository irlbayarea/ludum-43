import * as phaser from 'phaser';
import { Character } from './world/unit';

const borderSize = 5;
const paddingSize = 8;
const messageBoxTextSize = 14;

const menuWidth = 300;
const menuHeight = 100;

export class MessageBox extends phaser.GameObjects.Container {
  private messageBox!: phaser.GameObjects.Graphics;
  private messageText!: phaser.GameObjects.Text;
  private dismissButton!: phaser.GameObjects.Container;

  constructor(
    public readonly scene: phaser.Scene,
    private readonly character: Character,
    private readonly text: string
  ) {
    super(scene, borderSize, borderSize);

    this.createMessageBox();
    this.createDismissButton();
    this.update();

    // Ignore Camera.
    this.setScrollFactor(0, 0);
  }

  private createMessageBox(): void {
    this.width = menuWidth;
    this.height = menuHeight;

    // Create Title Text.
    this.messageText = this.scene.add.text(
      paddingSize,
      paddingSize,
      `${this.character.name}:\n\n${this.text}`,
      {
        wordWrap: { width: menuWidth - paddingSize * 2, useAdvancedWrap: true },
      }
    );
    this.messageText.setFontSize(messageBoxTextSize);
    this.messageText.setColor('#00FF00');

    // Draw Message Box
    this.messageBox = this.scene.add.graphics();
    this.messageBox.lineStyle(borderSize, 0x008800);
    this.messageBox.fillStyle(0x000000);
    this.messageBox.strokeRect(0, 0, this.width, this.height);
    this.messageBox.fillRect(0, 0, this.width, this.height);

    // Add message box and text to scene
    this.add(this.messageBox);
    this.add(this.messageText);
  }

  private createDismissButton(): void {
    this.dismissButton = this.scene.add.container(
      this.width * 0.75 - borderSize * 2,
      this.height * 0.75 - borderSize * 2
    );
    this.dismissButton.setScrollFactor(0);
    this.dismissButton.setSize(75, 25);
    this.add(this.dismissButton);

    const graphics = this.scene.add.graphics();
    this.dismissButton.add(graphics);
    graphics.lineStyle(borderSize, 0x00ff00);
    graphics.fillStyle(0x000000);
    graphics.strokeRect(
      0,
      0,
      this.dismissButton.width,
      this.dismissButton.height
    );
    graphics.fillRect(
      0,
      0,
      this.dismissButton.width,
      this.dismissButton.height
    );

    const text = this.scene.add.text(
      this.dismissButton.width / 2,
      this.dismissButton.height / 2,
      'DISMISS'
    );
    text.setFontSize(10);
    text.setColor('#00FF00');
    text.setPosition(text.x - text.width / 2, text.y - text.height / 2);
    this.dismissButton.add(text);

    const rect = new phaser.Geom.Rectangle(
      this.dismissButton.width / 2,
      this.dismissButton.height / 2,
      this.dismissButton.width,
      this.dismissButton.height
    );
    this.dismissButton
      .setInteractive({
        hitArea: rect,
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      })
      .on('pointerdown', () => {
        this.destroy();
      });
  }
}
