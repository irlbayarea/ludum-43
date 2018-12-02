import { World } from './world/world';
import * as phaser from 'phaser';
import { Character } from './world/unit';

const menuOutline = 0xffffff;
const menuForeground = 0x031f4c;
const charForeground = 0xddd;
const charForegroundSelected = 0x00ff00;
const charHeight = 60;
const charTextSize = 14;
const paddingSize = 10;
const titleTextSize = 20;
const hpTextSize = 12;

export class UIMenu extends phaser.GameObjects.Container {
  private static readonly uiWidth = 200;

  private readonly graphics: phaser.GameObjects.Graphics;
  private readonly titleText: phaser.GameObjects.Text;
  private readonly characters: UIMenuCharacter[] = [];

  constructor(scene: phaser.Scene, public readonly world: World) {
    super(scene, 0, 0);

    // Create Title Text.
    this.titleText = this.scene.add.text(
      paddingSize,
      paddingSize,
      'Ship Captain'
    );
    this.titleText.setFontSize(titleTextSize);

    // Draw Initial Menu.
    this.graphics = this.scene.add.graphics();
    this.add(this.graphics);
    this.add(this.titleText);
    this.update();
    this.createEndTurnButton();

    // Ignore Camera.
    this.setScrollFactor(0, 0);
  }

  public addCharacter(character: Character): UIMenuCharacter {
    const item = new UIMenuCharacter(
      this.scene,
      this,
      character.sprite,
      this.graphics,
      character,
      this.characters.length
    );
    this.add(item);
    this.characters.push(item);
    return item;
  }

  public update(): void {
    this.alignBounds();
    this.graphics.clear();
    this.graphics.lineStyle(1, menuOutline);
    this.graphics.fillStyle(menuForeground);
    this.graphics.strokeRect(0, this.y, this.width, this.height);
    this.graphics.fillRect(0, this.y, this.width, this.height);
    this.characters.forEach((c, i) => {
      // tslint:disable-next-line:no-magic-numbers
      c.update(i * charHeight + 40, this.width - paddingSize, charHeight);
    });
  }
  private alignBounds(): void {
    const { width, height } = this.scene.game.canvas;
    this.x = width - UIMenu.uiWidth;
    this.y = 0;
    this.width = UIMenu.uiWidth;
    this.height = height;
  }

  private createEndTurnButton(): void {
    const button = this.scene.add.container(
      paddingSize,
      this.height - charHeight - paddingSize
    );
    button.setScrollFactor(0);
    button.setSize(this.width - paddingSize * 2, charHeight);
    this.add(button);

    const graphics = this.scene.add.graphics();
    button.add(graphics);
    graphics.lineStyle(1, 0xccc);
    graphics.fillStyle(0xaaa);
    graphics.strokeRect(0, 0, button.width, button.height);
    graphics.fillRect(0, 0, button.width, button.height);

    const text = this.scene.add.text(
      button.width / 2,
      button.height / 2,
      'End Turn'
    );
    text.setPosition(text.x - text.width / 2, text.y - text.height / 2);
    button.add(text);

    const rect = new phaser.Geom.Rectangle(
      button.width / 2,
      button.height / 2,
      button.width,
      button.height
    );
    button
      .setInteractive({
        hitArea: rect,
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      })
      .on('pointerdown', () => {
        this.world.endTurn();
      });
  }
}

export class UIMenuCharacter extends phaser.GameObjects.Container {
  private previewSprite!: phaser.GameObjects.Sprite;

  constructor(
    scene: phaser.Scene,
    private readonly uimenu: UIMenu,
    private readonly target: phaser.GameObjects.Sprite,
    private readonly graphics: phaser.GameObjects.Graphics,
    private readonly character: Character,
    private readonly id: number
  ) {
    super(scene);

    this.createCharacterName();
    this.createHPandAPMeter();
    this.createPreviewOfChar(this.target);
    this.setScrollFactor(0);
  }

  public update(y: number, width: number, height: number): void {
    this.alignContent(y, width, height);
    this.drawBox();
  }

  private onClick(): void {
    this.uimenu.world.selectPlayer(this.id);
  }

  public isSelected(): boolean {
    return this.uimenu.world.getSelectedPlayer() === this.id;
  }

  private alignContent(y: number, width: number, height: number): void {
    this.setPosition(paddingSize, y);
    this.setSize(width - paddingSize, height - paddingSize);
    this.previewSprite.setPosition(paddingSize * 2, this.height / 2);
    this.setInteractive();
  }

  private drawBox(): void {
    this.graphics.lineStyle(
      1,
      this.isSelected() ? charForegroundSelected : charForeground
    );
    this.graphics.fillStyle(1, charForeground);
    this.graphics.strokeRect(this.x, this.y, this.width, this.height);
    this.graphics.fillRect(this.x, this.y, this.width, this.height);
  }

  private createCharacterName(): void {
    const text = this.scene.add.text(
      paddingSize * 4,
      paddingSize,
      this.character.name
    );
    text.setFontSize(charTextSize);
    this.add(text);
  }

  private createHPandAPMeter(): void {
    const hpText = this.scene.add.text(
      paddingSize * 4,
      // tslint:disable-next-line:no-magic-numbers
      paddingSize * 2.5,
      `${this.character.hitPoints} HP, ${this.character.actionPoints} AP`
    );
    hpText.setFontSize(hpTextSize);
    this.add(hpText);
  }

  private createPreviewOfChar(from: phaser.GameObjects.Sprite): void {
    this.previewSprite = this.scene.add.sprite(0, 0, from.texture.key);
    this.previewSprite.setScale(0.5);
    this.add(this.previewSprite);
    this.previewSprite
      .setInteractive({
        useHandCursor: true,
      })
      .on('pointerdown', () => {
        this.onClick();
      });
    this.previewSprite.setScrollFactor(0);
  }
}
