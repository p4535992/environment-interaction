import { MessageData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/foundry.js/roll';
import { AppTokenBar } from './AppTokenBar';
import { BaseRolls } from './BaseRolls';

export interface MonksTokenBar {
  tracker: boolean;
  tokenbar: AppTokenBar;
  system: BaseRolls;
  grabmessage: any;

  init(): void;

  hatCardAction(event): Promise<void>;

  get stats(): BaseRolls['defaultStats'];

  ready();

  onMessage(data): any;

  manageTokenControl(tokens: Token[], options: { shiftKey; force }): boolean;

  isMovement(movement: string): boolean;

  getDiceSound(hasMaestroSound: boolean): any;

  changeGlobalMovement(movement): Promise<void>;

  changeTokenMovement(movement: string, tokens: Token[]): Promise<void>;

  changeTokenPanning(tokens: Token[]): Promise<void>;

  displayNotification(movement: string, token: Token);

  allowMovement(token: Token, notify: boolean);

  onDeleteCombat(combat): Promise<void>;

  getRequestName(requestoptions, requesttype, request): string;

  setGrabMessage(message, event);

  selectActors(message, filter, event);

  onClickMessage(message, html);

  toggleMovement(combatant, event);
}
