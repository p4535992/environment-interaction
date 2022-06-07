import type { Document } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/module.mjs';
import { debug, error, i18n } from './lib/lib';
import { EnvironmentInteractionFlags } from './eim-models';
import CONSTANTS from './constants';

export function getTokenByTokenID(id) {
  // return await game.scenes.active.data.tokens.find( x => {return x.id === id});
  return canvas.tokens?.placeables.find((x) => {
    return x.id === id;
  });
}

export function getTokenByTokenName(name) {
  // return await game.scenes.active.data.tokens.find( x => {return x._name === name});
  return canvas.tokens?.placeables.find((x) => {
    return x.name == name;
  });
  // return canvas.tokens.placeables.find( x => { return x.id == game.user.id});
}

/**
 * Get chracter name from token
 */
export const getCharacterName = function (token: Token) {
  let tokenName = '';
  if (token.name) {
    tokenName = token.name;
  } else if (token.actor && token.actor.data && token.actor.data.name) {
    tokenName = token.actor.data.name;
  }
  return tokenName;
};

/**
 * Returns the first selected token
 */
export const getFirstPlayerTokenSelected = function (): Token | null {
  // Get first token ownted by the player
  const selectedTokens = <Token[]>canvas.tokens?.controlled;
  if (selectedTokens.length > 1) {
    //iteractionFailNotification(i18n("foundryvtt-arms-reach.warningNoSelectMoreThanOneToken"));
    return null;
  }
  if (!selectedTokens || selectedTokens.length == 0) {
    //if(game.user.character.data.token){
    //  //@ts-ignore
    //  return game.user.character.data.token;
    //}else{
    return null;
    //}
  }
  return <Token>selectedTokens[0];
};

/**
 * Returns a list of selected (or owned, if no token is selected)
 * note: ex getSelectedOrOwnedToken
 */
export const getFirstPlayerToken = function (): Token | null {
  // Get controlled token
  let token: Token;
  const controlled: Token[] = <Token[]>canvas.tokens?.controlled;
  // Do nothing if multiple tokens are selected
  if (controlled.length && controlled.length > 1) {
    //iteractionFailNotification(i18n("foundryvtt-arms-reach.warningNoSelectMoreThanOneToken"));
    return null;
  }
  // If exactly one token is selected, take that
  token = <Token>controlled[0];
  if (!token) {
    if (!controlled.length || controlled.length == 0) {
      // If no token is selected use the token of the users character
      token = <Token>canvas.tokens?.placeables.find((token) => token.data._id === game.user?.character?.data?._id);
    }
    // If no token is selected use the first owned token of the users character you found
    if (!token) {
      token = <Token>canvas.tokens?.ownedTokens[0];
    }
  }
  return token;
};

/**
 * Gets all UUIDs for selected or targeted tokens, depending on if priortize
 * targets is enabled
 *
 * @returns {string[]} actor uuids for selected or targeted tokens
 */
export const getActorUuidsFromCanvas = function () {
  if (canvas.tokens?.controlled.length == 0 && game.user?.targets.size == 0) {
    return [];
  }

  if (game.user?.targets.size !== 0) {
    return Array.from(<UserTargets>game.user?.targets).map((token) => token.actor?.uuid);
  } else {
    return canvas.tokens?.controlled.map((token) => token.actor?.uuid);
  }
};

/**
 * Gets the actor object by the actor UUID
 *
 * @param {string} uuid - the actor UUID
 * @returns {Actor5e} the actor that was found via the UUID
 */
export const getActorByUuid = async function (uuid) {
  const actorToken = <Document<any, any>>await fromUuid(uuid);
  //@ts-ignore
  const actor = actorToken?.actor ? actorToken?.actor : actorToken;
  return actor;
};

export const executeEIMacro = function (item: Item, macroFlag: string, ...args: any[]): any {
  if (!item.getFlag(CONSTANTS.MODULE_NAME, macroFlag)) {
    return false;
  }
  // switch(this.getMacro().data.type){
  //   case "chat" :
  //     //left open if chat macros ever become a thing you would want to do inside an item?
  //     break;
  // case "script" :
  // return _executeEIScript(item, macroFlag, ...args);
  // }

  const myargs: string[] = [];
  const flagArgs = `flags.${CONSTANTS.MODULE_NAME}.${macroFlag}-args`;
  if (item.getFlag(CONSTANTS.MODULE_NAME, flagArgs)) {
    const currentargs: string[] = (<string>item.getFlag(CONSTANTS.MODULE_NAME, flagArgs)).split(',') ?? [];
    myargs.push(...currentargs);
  }
  myargs.push(...args);

  //add variable to the evaluation of the script
  // const item = <Item>this;
  let macroContent = <string>item.getFlag(CONSTANTS.MODULE_NAME, macroFlag);
  const entityMatchRgxTagger = `@(Macro)\\[([^\\]]+)\\]`;
  const rgxTagger = new RegExp(entityMatchRgxTagger, 'ig');
  const matchAllTags = macroContent.matchAll(rgxTagger);
  if (matchAllTags) {
    for (const matchTag of matchAllTags) {
      if (matchTag) {
        const [textMatched, entity, id, label] = matchTag;
        // Remove prefix '@Macro[' and suffix ']'
        const macroName = (<string>textMatched).substring(7, (<string>textMatched).length - 1);
        macroContent = (<Macro>game.macros?.getName(macroName)).data.command;
      }
    }
  }

  // if (macroFlag == Flags.notescondition) {
  //   if (macroContent && !macroContent?.startsWith('return')) {
  //     macroContent = 'return ' + macroContent;
  //   }
  // }

  const macro = new Macro({
    name: item.data.name,
    type: 'script',
    scope: 'global',
    command: macroContent,
    author: game.user?.id,
  });
  const speaker = ChatMessage.getSpeaker({ actor: <Actor>item.actor });
  const token = item.actor?.token ?? canvas.tokens?.get(<string>speaker.token);
  const actor = item.actor ?? game.actors?.get(<string>speaker.actor);

  const character = game.user?.character;
  const event = getEvent();

  const interactorToken = <Token>canvas.tokens?.controlled[0];
  const interactorActor = <Actor>interactorToken?.actor;

  // debug(macro);
  // debug(speaker);
  // debug(actor);
  // debug(token);
  // debug(character);
  // debug(item);
  // debug(event);
  // debug(args);

  // new Function(reloadfunction).apply(t,[]) //immediate execute
  // new Function(reloadfunction).bind(t,[]) //future execute (notice ie=>9)

  //build script execution
  // const body = `(async ()=>{
  //   ${macro.data.command}
  // })();`;
  // const fn = new Function('item', 'speaker', 'actor', 'token', 'character', 'event', 'args', body);
  // const fn2 = new Function('item', 'speaker', 'actor', 'token', 'character', 'event', 'args', macro.data.command);
  const fn3 = new Function(
    'item',
    'speaker',
    'actor',
    'token',
    'character',
    'event',
    'args',
    'interactorToken',
    'interactorActor',
    macro.data.command,
  );
  //attempt script execution
  try {
    // return fn.call(macro, item, speaker, actor, token, character, event, args);
    // return fn2.apply(item, [item, speaker, actor, token, character, event, ...args]);
    return fn3.call(macro, item, speaker, actor, token, character, event, myargs, interactorToken, interactorActor);
  } catch (err) {
    ui.notifications?.error(CONSTANTS.MODULE_NAME + ' | ' + i18n(`${CONSTANTS.MODULE_NAME}.macroExecution`));
    error(err);
  }

  function getEvent() {
    const a = args[0];
    if (a instanceof Event) return args[0].shift();
    if (a?.originalEvent instanceof Event) return args.shift().originalEvent;
    return undefined;
  }
};

export const executeEIMacroContent = function (item: Item, macroContent: string, ...args: any[]): any {
  if (!macroContent) {
    return false;
  }
  // switch(this.getMacro().data.type){
  //   case "chat" :
  //     //left open if chat macros ever become a thing you would want to do inside an item?
  //     break;
  // case "script" :
  // return _executeEIScript(item, macroFlag, ...args);
  // }

  const myargs: string[] = [];
  myargs.push(...args);

  // if(macroContent){
  //   if (!macroContent?.startsWith('return')) {
  //     macroContent = 'return ' + macroContent;
  //   }
  // }

  const macro = new Macro({
    name: item.data.name,
    type: 'script',
    scope: 'global',
    command: macroContent,
    author: game.user?.id,
  });
  const speaker = ChatMessage.getSpeaker({ actor: <Actor>item.actor });
  const token = item.actor?.token ?? canvas.tokens?.get(<string>speaker.token);
  const actor = item.actor ?? game.actors?.get(<string>speaker.actor);

  const character = game.user?.character;
  const event = getEvent();

  const interactorToken = <Token>canvas.tokens?.controlled[0];
  const interactorActor = <Actor>interactorToken?.actor;

  const fn3 = new Function(
    'item',
    'speaker',
    'actor',
    'token',
    'character',
    'event',
    'args',
    'interactorToken',
    'interactorActor',
    macro.data.command,
  );
  //attempt script execution
  try {
    return fn3.call(macro, item, speaker, actor, token, character, event, myargs, interactorToken, interactorActor);
  } catch (err) {
    ui.notifications?.error(CONSTANTS.MODULE_NAME + ' | ' + i18n(`${CONSTANTS.MODULE_NAME}.macroExecution`));
    error(err);
  }

  function getEvent() {
    const a = args[0];
    if (a instanceof Event) return args[0].shift();
    if (a?.originalEvent instanceof Event) return args.shift().originalEvent;
    return undefined;
  }
};

export async function rollSimple(item, extraContents) {
  const img = item.img || item.data.img || 'icons/svg/d20-highlight.svg';
  const content = `<div class="${game.system.id} chat-card item-card">
            <header class="card-header flexrow">
            <img src="${img}" width="36" height="36" alt="${item.name || img}"/>
            <h3 class="item-name">${item.name}</h3>
            </header>
        </div>
        ${extraContents || ''}
        `;
  return await ChatMessage.create({ content });
}
