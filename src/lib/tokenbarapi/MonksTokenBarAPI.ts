import { AppTokenBar } from './AppTokenBar';

/**
 * game.MonksTokenBar
 */
export interface MonksTokenBarAPI {
  TokenBar(): AppTokenBar;

  changeMovement(movement, tokens): void;

  requestRoll(tokens, options?: MonkTokenBarRollOptions): Promise<void>;

  requestContestedRoll(request0, request1, options?: MonkTokenBarRollOptions): Promise<void>;

  /*
   * Used to open a dialog to assign xp to tokens
   * pass in a token or an array of tokens,
   *
   * */
  assignXP(tokens, options?: MonkTokenBarRollOptions): void;

  /*
   * Used to open a dialog to convert tokens to lootable
   * pass in a token or an array of tokens
   *
   * */
  convertToLootable(tokens, options?: MonkTokenBarRollOptions): void;
}

export class MonkTokenBarRollOptions {
  rollmode = 'roll';
  silent = true;
  fastForward = true;
}
