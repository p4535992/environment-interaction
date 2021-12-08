import { AppTokenBar } from './AppTokenBar';

/**
 * game.MonksTokenBar
 */
export interface MonksTokenBarAPI {
  TokenBar(): AppTokenBar;

  changeMovement(movement, tokens: Token[]): void;

  requestRoll(tokens: Token[], options?: MonkTokenBarRollOptions): Promise<void>;

  requestContestedRoll(request0: MonkTokenBarContestedRollRequest, request1: MonkTokenBarContestedRollRequest, options?: MonkTokenBarRollOptions): Promise<void>;

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
  request: string;
  dc = NaN;
  silent = false;
  fastForward = false;
  flavor: string;
  rollmode = 'roll';
  requestoptions: MonkTokenBarRequestOptions[] = []; // { id: "skill", text: "MonksTokenBar.Skill", groups: this.config.skills }
  hidenpcname = false;
}

export class MonkTokenBarRequestOptions {
  id: string;
  text: string;
  groups: [];
}

// export class MonkTokenBarRequest{
//   dclabel:string;
// }

// export class MonkTokenBarRequestParts{
//   requesttype:string;
//   request:string;
// }

export class MonkTokenBarContestedRollRequest {
  token: Token | string;
  request: string;
}



export interface MonkTokenBarMessageOptions {
  dc?: any;
  silent: boolean;
  fastForward: boolean;
  rollmode: string;
  requestoptions: MonkTokenBarMessageRequestoption[];
  hidenpcname: boolean;
  flavor: string;
}

export interface MonkTokenBarMessageRequestoption {
  id: string;
  text: string;
  groups: any[];
}

export interface MonkTokenBarMessageToken {
  id: string;
  uuid: string;
  actorid: string;
  requesttype: string;
  request: string;
  requestname: string;
  icon: string;
  name: string;
  showname: boolean;
  showtoken: boolean;
  npc: boolean;
  passed: string;
  keys: any;
}

export interface MonkTokenBarMessageRootObject {
  rollmode: string;
  modename: string;
  options: MonkTokenBarMessageOptions;
  what: string;
  // token7GHIr1jkeR8FGgf8: Token7GHIr1jkeR8FGgf8;
  // tokenocAADXgfeqOK5nvO: TokenocAADXgfeqOK5nvO;
}
