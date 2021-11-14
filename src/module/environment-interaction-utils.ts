import { Document } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/module.mjs';
import { ACTION_TYPE, ENVIROMENT_TYPE } from './environment-interaction-models';
import { getCanvas, getGame } from './settings';

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

export const converToEnviromentType = function(action:string):string{
  let actionType;
  switch (action) {
    case ACTION_TYPE.mwak:
    case ACTION_TYPE.msak:
    case ACTION_TYPE.rwak:
    case ACTION_TYPE.rsak: {
      actionType = ENVIROMENT_TYPE.ATTACK;
      break;
    }
    case ACTION_TYPE.abil: {
      actionType = ENVIROMENT_TYPE.ABILITY;
      break;
    }
    case ACTION_TYPE.save: {
      actionType = ENVIROMENT_TYPE.SAVE;
      break;
    }
    case ACTION_TYPE.heal: {
      actionType = ENVIROMENT_TYPE.ATTACK;
      break;
    }
    case ACTION_TYPE.util: {
      actionType = ENVIROMENT_TYPE.OTHER;
      break;
    }
    case ACTION_TYPE.other: {
      actionType = ENVIROMENT_TYPE.OTHER;
      break;
    }
    default: {
      actionType = ENVIROMENT_TYPE.OTHER;
      break;
    }
  }
  return actionType;
}