// This file parses JSON-like data.
//
// tslint:disable:no-any

import * as phaser from 'phaser';

import { Character, Control, Statistics } from './unit';
import { UNIT_LAYER_NAME } from '../constants';
import { Grid } from './grid';

export class ObjectDataParser {
  constructor(
    private readonly events: {
      readonly spawnPlayer: (character: Character) => void;
      readonly spawnHostile: (character: Character) => void;
      readonly addGridEvent: (event: IGridEvent) => void;
    }
  ) {}

  public parse(grid: Grid, tilemap: phaser.Tilemaps.Tilemap): void {
    tilemap.getObjectLayer(UNIT_LAYER_NAME).objects.forEach(o => {
      const data = (o as any) as IMapData;
      const props = ObjectDataParser.parseProperties(data.properties);
      const { x, y } = ObjectDataParser.convertWorldXY(tilemap, data);
      switch (props.get('object-type')) {
        case 'pc-spawn':
          this.events.spawnPlayer(
            Character.create(
              grid,
              grid.get(x, y),
              tilemap.scene,
              data.name as any,
              Control.Friendly,
              props.get('name'),
              new Statistics(props.get('hp'), props.get('ap'))
            )
          );
          break;
        case 'hostile-spawn':
          this.events.spawnHostile(
            Character.create(
              grid,
              grid.get(x, y),
              tilemap.scene,
              'npc',
              Control.Hostile,
              'Zombie',
              new Statistics(props.get('hp'), props.get('ap'))
            )
          );
          break;
        case 'grid-event':
          this.events.addGridEvent({
            x,
            y,
            type: props.get('grid-event-type'),
            text: props.get('text'),
          });
          break;
      }
    });
  }

  private static convertWorldXY(
    tilemap: phaser.Tilemaps.Tilemap,
    data: IMapData
  ): {
    readonly x: number;
    readonly y: number;
  } {
    return {
      x: tilemap.worldToTileX(data.x - data.width / 2),
      y: tilemap.worldToTileY(data.y - data.width / 2),
    };
  }

  private static parseProperties(
    properties: ReadonlyArray<{ name: string; type: string; value: any }>
  ): Map<string, any> {
    const result = new Map<string, any>();
    properties.forEach(p => result.set(p.name, p.value));
    return result;
  }
}

interface IMapData {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly properties: ReadonlyArray<{
    name: string;
    type: string;
    value: any;
  }>;
}

export interface IGridEvent {
  readonly x: number;
  readonly y: number;
  readonly type: string;
  readonly text: string;
}
