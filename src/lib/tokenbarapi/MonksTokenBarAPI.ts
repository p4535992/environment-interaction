import { AppTokenBar } from './AppTokenBar';

/**
 * game.MonksTokenBar
 */
export interface MonksTokenBarAPI {
  TokenBar(): AppTokenBar;

  changeMovement(movement, tokens: Token[]): void;

  requestRoll(tokens: Token[], options?: MonkTokenBarRollOptions): Promise<void>;

  requestContestedRoll(request0, request1, options?: MonkTokenBarRollOptions): Promise<void>;

  /*
   * Used to open a dialog to assign xp to tokens
   * pass in a token or an array of tokens,
   *
   * */
  assignXP(tokens: Token[], options?: MonkTokenBarRollOptions): void;

  /*
   * Used to open a dialog to convert tokens to lootable
   * pass in a token or an array of tokens
   *
   * */
  convertToLootable(tokens: Token[], options?: MonkTokenBarRollOptions): void;
}

export class MonkTokenBarRollOptions {
  rollmode = 'roll';
  silent = true;
  fastForward = false;
  dc = NaN;
  request:string;
}

// export class MonkTokenBarRequest{
//   dclabel:string;
// }

// export class MonkTokenBarRequestParts{
//   requesttype:string;
//   request:string;
// }

