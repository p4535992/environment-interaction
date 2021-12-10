import { Document } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/module.mjs';
import { debug, error, i18n } from '../environment-interaction-main';
import { getCanvas, getGame, moduleName } from './settings';

export function getTokenByTokenID(id) {
  // return await getGame().scenes.active.data.tokens.find( x => {return x.id === id});
  return getCanvas().tokens?.placeables.find((x) => {
    return x.id === id;
  });
}

export function getTokenByTokenName(name) {
  // return await getGame().scenes.active.data.tokens.find( x => {return x._name === name});
  return getCanvas().tokens?.placeables.find((x) => {
    return x.name == name;
  });
  // return getCanvas().tokens.placeables.find( x => { return x.id == getGame().user.id});
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
  const selectedTokens = <Token[]>getCanvas().tokens?.controlled;
  if (selectedTokens.length > 1) {
    //iteractionFailNotification(i18n("foundryvtt-arms-reach.warningNoSelectMoreThanOneToken"));
    return null;
  }
  if (!selectedTokens || selectedTokens.length == 0) {
    //if(getGame().user.character.data.token){
    //  //@ts-ignore
    //  return getGame().user.character.data.token;
    //}else{
    return null;
    //}
  }
  return selectedTokens[0];
};

/**
 * Returns a list of selected (or owned, if no token is selected)
 * note: ex getSelectedOrOwnedToken
 */
export const getFirstPlayerToken = function (): Token | null {
  // Get controlled token
  let token: Token;
  const controlled: Token[] = <Token[]>getCanvas().tokens?.controlled;
  // Do nothing if multiple tokens are selected
  if (controlled.length && controlled.length > 1) {
    //iteractionFailNotification(i18n("foundryvtt-arms-reach.warningNoSelectMoreThanOneToken"));
    return null;
  }
  // If exactly one token is selected, take that
  token = controlled[0];
  if (!token) {
    if (!controlled.length || controlled.length == 0) {
      // If no token is selected use the token of the users character
      token = <Token>getCanvas().tokens?.placeables.find((token) => token.data._id === getGame().user?.character?.data?._id);
    }
    // If no token is selected use the first owned token of the users character you found
    if (!token) {
      token = <Token>getCanvas().tokens?.ownedTokens[0];
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
  if (getCanvas().tokens?.controlled.length == 0 && getGame().user?.targets.size == 0) {
    return [];
  }

  if (getGame().user?.targets.size !== 0) {
    return Array.from(<UserTargets>getGame().user?.targets).map((token) => token.actor?.uuid);
  } else {
    return getCanvas().tokens?.controlled.map((token) => token.actor?.uuid);
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

export const executeEIMacro = function (item: Item, macroFlag: string, ...args): any {
  if (!item.getFlag(moduleName, macroFlag)) {
    return false;
  }
  // switch(this.getMacro().data.type){
  //   case "chat" :
  //     //left open if chat macros ever become a thing you would want to do inside an item?
  //     break;
  // case "script" :
  // return _executeEIScript(item, macroFlag, ...args);
  // }

  //add variable to the evaluation of the script
  // const item = <Item>this;
  let macroContent = <string>item.getFlag(moduleName, macroFlag);
  const entityMatchRgxTagger = `@(Macro)\\[([^\\]]+)\\]`;
  const rgxTagger = new RegExp(entityMatchRgxTagger, 'ig');
  const matchAllTags = macroContent.matchAll(rgxTagger) || [];
  for (const matchTag of matchAllTags) {
    if (matchTag) {
      const [textMatched, entity, id, label] = matchTag;
      // Remove prefix '@Macro[' and suffix ']'
      macroContent = textMatched.substring(7, textMatched.length - 1);
    }
  }
  const macro = new Macro({
    name: item.data.name,
    type: 'script',
    scope: 'global',
    command: macroContent,
    author: getGame().user?.id,
  });
  const speaker = ChatMessage.getSpeaker({ actor: <Actor>item.actor });
  const token = item.actor?.token ?? getCanvas().tokens?.get(<string>speaker.token);
  const actor = item.actor ?? getGame().actors?.get(<string>speaker.actor);

  const character = getGame().user?.character;
  const event = getEvent();

  const interactorToken = <Token>getCanvas().tokens?.controlled[0];
  const interactorActor = <Actor>interactorToken.actor;

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
  const fn3 = new Function('item', 'speaker', 'actor', 'token', 'character', 'interactorToken', 'event', 'args', macro.data.command);
  //attempt script execution
  try {
    // return fn.call(macro, item, speaker, actor, token, character, event, args);
    // return fn2.apply(item, [item, speaker, actor, token, character, event, ...args]);
    return fn3.call(macro, item, speaker, actor, token, character, interactorToken, event, args);
  } catch (err) {
    ui.notifications?.error(moduleName + ' | ' + i18n(`${moduleName}.macroExecution`));
    error(err);
  }

  function getEvent() {
    const a = args[0];
    if (a instanceof Event) return args[0].shift();
    if (a?.originalEvent instanceof Event) return args.shift().originalEvent;
    return undefined;
  }
};
