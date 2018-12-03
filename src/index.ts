import * as phaser from 'phaser';
import { World } from './game/world/world';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './game/constants';
import { Keyboard } from './game/keyboard';

// Test Scene
class HelloScene extends phaser.Scene {
  private keyobard!: Keyboard;
  private tilemap!: phaser.Tilemaps.Tilemap;
  private world!: World;
  private groundLayer!: phaser.Tilemaps.DynamicTilemapLayer;
  private mouseDown: boolean = false;

  constructor() {
    super({ key: 'HelloScene' });
  }

  public preload(): void {
    this.load.tilemapTiledJSON('map', 'src/assets/spaceship.json');
    this.load.image('colors', 'src/assets/colors.png');
    this.load.image('spaceship', 'src/assets/spaceship.png');
    this.load.image('pc-1', 'src/assets/pc1.png');
    this.load.image('pc-2', 'src/assets/pc2.png');
    this.load.image('pc-3', 'src/assets/pc3.png');
    this.load.image('npc', 'src/assets/npc.png');
    this.load.image('bad-1', 'src/assets/baddies1.png');
    this.load.image('bad-2', 'src/assets/baddies2.png');
    this.load.image('bad-3', 'src/assets/baddies3.png');
    this.load.image('blood', 'src/assets/blood.png');
    this.load.image('laser', 'src/assets/laser.png');

    // Initialize listening to the keyboard.
    this.keyobard = new Keyboard(this, k => this.onKeyInput(k));
  }

  public create(): void {
    // Load map.
    this.tilemap = this.make.tilemap({ key: 'map' });
    const tileset = this.tilemap.addTilesetImage('spaceship');
    this.groundLayer = this.tilemap.createDynamicLayer(0, tileset, 0, 0);
    this.groundLayer.setCollisionByProperty({ collides: true });
    this.world = new World(this, this.tilemap, this.groundLayer);

    // Set camera.
    this.cameras.main.setBounds(
      0,
      0,
      this.tilemap.widthInPixels,
      this.tilemap.heightInPixels
    );
    this.cameras.main.scrollX = 200;
  }

  public update(_: number, __: number): void {
    this.world.gameLoopUpdate();
    this.mouseInput();
    this.keyobard.update();
  }

  private mouseInput(): void {
    const pointer = this.input.activePointer;
    if (pointer.isDown && !this.mouseDown) {
      this.mouseDown = pointer.isDown;
      const worldPoint: Phaser.Math.Vector2 = pointer.positionToCamera(
        this.cameras.main
      ) as Phaser.Math.Vector2;
      const clickedTile = this.groundLayer.getTileAtWorldXY(
        worldPoint.x,
        worldPoint.y
      );
      if (clickedTile !== null) {
        this.world.handleClick(clickedTile.x, clickedTile.y);
      }
    }
    this.mouseDown = pointer.isDown;
  }

  private static readonly keyDeltas: {
    [key: string]: { x: number; y: number };
  } = {
    q: { x: -1, y: -1 },
    w: { x: 0, y: -1 },
    e: { x: 1, y: -1 },
    a: { x: -1, y: 0 },
    s: { x: 0, y: 1 },
    d: { x: 1, y: 0 },
    z: { x: -1, y: 1 },
    c: { x: 1, y: 1 },
  };

  private onKeyInput(key: string): void {
    switch (key) {
      case 'tab':
        let nextPlayer = this.world.getSelectedPlayerId() + 1;
        if (nextPlayer > 2) {
          nextPlayer = 0;
        }
        this.world.selectPlayer(nextPlayer);
        return;
      case 'space':
        this.world.endTurn();
        return;
      case '1':
      case '2':
      case '3':
        // tslint:disable-next-line:radix
        this.world.selectPlayer(parseInt(key) - 1);
        return;
    }
    const delta = HelloScene.keyDeltas[key];
    const { x, y } = this.world.getSelectedPlayer();
    const tile = this.groundLayer.getTileAt(x + delta.x, y + delta.y);
    if (tile !== null) {
      this.world.handleClick(tile.x, tile.y);
    }
  }
}

(() => {
  // Constructor has side-effects.
  // tslint:disable-next-line:no-unused-expression
  new phaser.Game({
    type: phaser.AUTO,
    parent: 'content',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resolution: 1,
    backgroundColor: '#EDEEC9',
    scene: [HelloScene],
  });
})();
