import * as phaser from 'phaser';
import { Character } from './world/unit';

const borderSize = 5;
const buttonPadding = 8;
const messageBoxTextSize = 14;
const dismissButtonSize = 16;
const choiceButtonHeight = 2 * messageBoxTextSize;

const menuWidth = 300;
const menuHeight = 100;

export class MessageBox extends phaser.GameObjects.Container {
  private messageBox!: phaser.GameObjects.Graphics;
  private messageText!: phaser.GameObjects.Text;
  private dismissButton!: phaser.GameObjects.Container;
  private readonly choiceButtons: phaser.GameObjects.Container[] = [];

  private messageBoxBottom: number = 0;

  constructor(
    scene: phaser.Scene,
    private readonly character: Character,
    private readonly text: string,
    private readonly choices: string[] = []
  ) {
    super(scene, borderSize, borderSize);

    this.createMessageBox();
    this.createDismissButton();
    this.createChoices();
    this.update();

    // Ignore Camera.
    this.setScrollFactor(0, 0);
  }

  private createMessageBox(): void {
    this.width = menuWidth;
    this.height = menuHeight + this.choices.length > 0 ? choiceButtonHeight : 0;

    // Create Title Text.
    this.messageText = this.scene.add.text(
      buttonPadding,
      buttonPadding,
      `${this.character.name}:\n\n${this.text}`,
      {
        wordWrap: {
          width: menuWidth - buttonPadding * 2,
          useAdvancedWrap: true,
        },
      }
    );
    this.messageText.setFontSize(messageBoxTextSize);
    this.messageText.setColor('#00FF00');

    // Draw Message Box
    this.messageBox = this.scene.add.graphics();
    this.messageBox.lineStyle(borderSize, 0x008800);
    this.messageBox.fillStyle(0x000000);

    this.messageBoxBottom =
      this.messageText.height +
      buttonPadding * 2 +
      (this.choices.length > 0 ? choiceButtonHeight : 0);

    this.messageBox.strokeRect(0, 0, this.width, this.messageBoxBottom);
    this.messageBox.fillRect(0, 0, this.width, this.messageBoxBottom);

    // Add message box and text to scene
    this.add(this.messageBox);
    this.add(this.messageText);
  }

  private createDismissButton(): void {
    this.dismissButton = this.scene.add.container(
      this.width - dismissButtonSize - buttonPadding,
      buttonPadding
    );
    this.dismissButton.setScrollFactor(0);
    this.dismissButton.setSize(dismissButtonSize, dismissButtonSize);
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
      'X'
    );
    text.setFontSize(8);
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

  private createChoices(): void {
    if (this.choices.length > 0) {
      // tslint:disable-next-line:no-console
      console.log(`Choices : ${this.choices}`);

      this.height += choiceButtonHeight + buttonPadding;

      const choiceButtonWidth: number =
        this.width / this.choices.length - buttonPadding;

      this.choices.forEach((cstr, cind) => {
        const choiceButton: phaser.GameObjects.Container = this.scene.add.container(
          this.width -
            (choiceButtonWidth + buttonPadding) * (cind + 1) +
            buttonPadding,
          this.messageBoxBottom - choiceButtonHeight + buttonPadding / 2
        );
        choiceButton.setScrollFactor(0);
        choiceButton.setSize(
          choiceButtonWidth - buttonPadding,
          choiceButtonHeight - buttonPadding
        );

        this.add(choiceButton);

        const graphics = this.scene.add.graphics();
        choiceButton.add(graphics);
        graphics.lineStyle(borderSize, 0x00ff00);
        graphics.fillStyle(0x000000);
        graphics.strokeRect(0, 0, choiceButton.width, choiceButton.height);
        graphics.fillRect(0, 0, choiceButton.width, choiceButton.height);

        const text = this.scene.add.text(
          choiceButton.width / 2,
          choiceButton.height / 2,
          cstr
        );
        text.setFontSize(messageBoxTextSize);
        text.setColor('#00FF00');
        text.setPosition(text.x - text.width / 2, text.y - text.height / 2);
        choiceButton.add(text);

        const rect = new phaser.Geom.Rectangle(
          choiceButton.width / 2,
          choiceButton.height / 2,
          choiceButton.width,
          choiceButton.height
        );

        choiceButton
          .setInteractive({
            hitArea: rect,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true,
          })
          .on('pointerdown', () => {
            this.destroy();
          });

        this.choiceButtons.push(choiceButton);
      });
    }
  }

  public destory(): void {
    super.destroy();
  }
}
