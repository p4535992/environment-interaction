import { customInfoEnvironmentInteraction, ENVIRONMENT_TYPE, EnvironmentInteractionFlags } from './eim-models';
import { debug, i18n, isStringEquals, is_real_number, log, rollDependingOnSystem, warn } from './lib/lib';
import {
  getMonkTokenBarAPI,
  getTokenActionHUDRollHandler,
  isItemMacroModuleActive,
  isMonkTokensBarModuleActive,
  isSystemItemMacroSupported,
  isSystemMonkTokenBarSupported,
  isSystemTokenActionHUDSupported,
  isTokenActionHudActive,
} from './settings';
import type Document from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { MonkTokenBarRollOptions } from './lib/tokenbarapi/MonksTokenBarAPI';
import { executeEIMacro, executeEIMacroContent } from './eim-utils';
import CONSTANTS from './constants';

export class EnvironmentInteraction {
  // ====================
  // TOKEN
  // ====================

  static _canViewToken(wrapped, ...args) {
    const token = <Token>(<unknown>this);
    // const isEi =
    //   token.actor && token.actor.data.token
    //     ? getProperty(token.actor.data.token, `flags.${CONSTANTS.MODULE_NAME}.${Flags.environmentToken}`)
    //     : // ? token.document.getFlag(CONSTANTS.MODULE_NAME,Flags.environmentToken)
    //       false;
    const isEi = token.document.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.environmentToken) ?? false;
    // If token is an environment token, then any use can "view" (allow _clickLeft2 callback)
    if (!isEi) {
      return wrapped(...args);
    } else {
      return true;
    }
  }

  static _onClickLeftToken(wrapped, ...args) {
    const token = <Token>(<unknown>this);
    // const isEi =
    //   token.actor && token.actor.data.token
    //     ? getProperty(token.actor.data.token, `flags.${CONSTANTS.MODULE_NAME}.${Flags.environmentToken}`)
    //     : // ? token.document.getFlag(CONSTANTS.MODULE_NAME,Flags.environmentToken)
    //       false;
    const isEi = token.document.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.environmentToken) ?? false;
    // Prevent deselection of currently controlled token when clicking environment token
    if (!isEi) {
      return wrapped(...args);
    }
  }

  static _onClickLeft2Token(wrapped, ...args) {
    const token = <Token>(<unknown>this);
    // const isEi =
    //   token.actor && token.actor.data.token
    //     ? getProperty(token.actor.data.token, `flags.${CONSTANTS.MODULE_NAME}.${Flags.environmentToken}`)
    //     : // ? token.document.getFlag(CONSTANTS.MODULE_NAME,Flags.environmentToken)
    //       false;
    const isEi = token.document.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.environmentToken) ?? false;
    if (!isEi) {
      return wrapped(...args);
    } else {
      EnvironmentInteraction.interactWithEnvironmentFromPlaceableObject(token, ...args);
    }
  }

  // =======================
  // WALL/DOOR
  // =======================

  static _DoorControlPrototypeOnMouseDownHandler(wrapped, ...args) {
    const doorControl = <DoorControl>(<unknown>this);
    // const isDoor = wall.data.door > 0;
    const wall = <Wall>canvas.walls?.placeables.find((x) => {
      return x.id == doorControl.wall.id;
    });
    const isEi = wall.document.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.environmentToken) ?? false;
    if (!isEi) {
      return wrapped(...args);
    } else {
      EnvironmentInteraction.interactWithEnvironmentFromPlaceableObject(wall, ...args);
    }
  }

  // ========================
  // NOTE/JOURNAL
  // ========================

  static _NotePrototypeOnClickLeftHandler = async function (wrapped, ...args) {
    const note = this as Note;
    const isEi = note.document.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.environmentToken) ?? false;
    if (!isEi) {
      return wrapped(...args);
    } else {
      EnvironmentInteraction.interactWithEnvironmentFromPlaceableObject(note, ...args);
    }
  };

  // ========================
  // MODULE
  // ========================

  // Environment Interaction
  // static async interactWithEnvironmentFromActor(environmentActor: Actor, ...args) {
  //   if (!environmentActor?.id) {
  //     warn(`The environment interaction need the token is been liked to a actor`, true);
  //     return;
  //   }
  //   EnvironmentInteraction.interactWithEnvironmentFromTokenDocument(<TokenDocument>environmentActor.token, ...args);
  // }

  // static async interactWithEnvironmentFromPlaceableObject(environmentPlaceableObject: PlaceableObject, ...args) {
  //   const actors = EnvironmentInteractionPlaceableConfig.getEnviroments(environmentPlaceableObject, Flags.environmentTokenRef);
  //   // TODO MANAGE MORE THAN A ACTOR ?????
  //   const actor = actors[0];
  //   EnvironmentInteraction.interactWithEnvironmentFromActor(actor, ...args);
  // }

  // static async interactWithEnvironmentFromToken(environmentToken: Token, ...args) {
  //   EnvironmentInteraction.interactWithEnvironmentFromTokenDocument(environmentToken.document, ...args);
  // }

  // Environment Interaction
  static async interactWithEnvironmentFromPlaceableObject(environmentPlaceableObject: PlaceableObject, ...args) {
    const event = args[0];

    const flagRefActorId = environmentPlaceableObject.document.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.environmentTokenRef);
    if (!flagRefActorId) {
      warn(`The environment interaction need a valid actor to reference the actions`,true);
      return;
    }

    const environmentActorExternal = <Actor>game.actors?.get(flagRefActorId);
    if (!environmentActorExternal?.id) {
      warn(`The environment interaction need a existing actor to reference the actions`,true);
      return;
    }

    // TODO: dnd5e specific; create a helper function to handle different systems
    // Sort to mimic order of items on character sheet
    const items: Item[] = [];
    // const actionsType: string[] = [ITEM_TYPE.TOOL, ITEM_TYPE.WEAPON, ACTION_TYPE.abil, ACTION_TYPE.save, ITEM_TYPE.LOOT, ITEM_TYPE.CONSUMABLE];
    // for (const type of actionsType) {
    environmentActorExternal?.items
      .filter((environmentItemToCheck) => {
        if (environmentItemToCheck.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesuseei)) {
          if (environmentItemToCheck.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notescondition)) {
            const result = executeEIMacro(environmentItemToCheck, EnvironmentInteractionFlags.notescondition);
            if (result) {
              return result;
            } else {
              return false;
            }
          }
          // return i.type === type;
          return true;
        } else {
          return false;
        }
      })
      .sort((a, b) => (a.data.sort || 0) - (b.data.sort || 0))
      .forEach((i) => {
        if (items.some((e) => e.id === i.id)) {
          // contains the element we're looking for
        } else {
          items.push(i); // not sure why i need this
        }
      });
    // }

    const content = await renderTemplate(`/modules/${CONSTANTS.MODULE_NAME}/templates/interaction-dialog.hbs`, { items });
    const buttons = <any>{};
    if (game.user?.isGM) {
      buttons.openSheet = {
        label: i18n(`${CONSTANTS.MODULE_NAME}.interactWithEnvironment.openCharacterSheet`),
        callback: () => {
          environmentActorExternal?.sheet?.render(true);
        },
      };
    }
    if (game.user?.isGM) {
      if (environmentPlaceableObject instanceof Token) {
        buttons.openSheetToken = {
          label: i18n(`${CONSTANTS.MODULE_NAME}.interactWithEnvironment.openCharacterSheetToken`),
          callback: () => {
            // const actor = <Actor>environmentPlaceableObject.actor;
            // let sourceToken:Token;
            // if (actor.getActiveTokens()?.length > 0) {
            //   sourceToken = <Token>actor.getActiveTokens()[0];
            // }else{
            //   sourceToken = <Token>canvas.tokens?.placeables.find((t) => {
            //     return isStringEquals(t.name,environmentPlaceableObject.name);
            //   });
            // }
            //@ts-ignore
            // sourceToken?.sheet?.render(true, {sourceToken});
            environmentPlaceableObject?.sheet?.render(true, {environmentPlaceableObject});
            //@ts-ignore
            // sourceToken?.sheet?.render(true, {environmentPlaceableObject});
          },
        };
      }
      buttons.openPlaceableObject = {
        label: i18n(`${CONSTANTS.MODULE_NAME}.interactWithEnvironment.openPlaceableObject`),
        callback: () => {
          if (environmentPlaceableObject instanceof Token) {
            //@ts-ignore
            environmentPlaceableObject.actor?.sheet?.render(true, {environmentPlaceableObject});
          } else {
            //@ts-ignore
            environmentPlaceableObject.sheet?.render(true, {environmentPlaceableObject});
          }
        },
      };
    }
    const dialogOptions = {
      id: 'ei-interaction-dialog',
      width: 270,
      top: event.data.originalEvent.clientY - 10,
      left: event.data.originalEvent.clientX + 50,
    };
    const render = (html) => {
      html.on('click', `button.ei-info`, async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const itemID = <string>event.currentTarget.id;
        //const environment = <Actor>canvas.tokens?.get(environmentToken.id)?.actor;
        //const environmentItem = <Item>environment.items.get(itemID);
        const environmentItem = <Item>environmentActorExternal?.items.get(itemID);
        let contentInfo = <string>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesinfo);
        if (!contentInfo) {
          contentInfo = 'No info provided';
        }
        const d = new Dialog({
          title: environmentItem.data.name,
          content: contentInfo,
          buttons: {},
          default: '',
          render: (html) => {
            //$(".ei.info").parent().next().addClass(".customcss");
          },
          close: (html) => {
            log('Confirmed closed window');
          },
        });
        d.render(true);
      }),
        html.on('click', `button.ei-flex-container`, async (event) => {
          event.preventDefault();
          event.stopPropagation();
          // TODO integration mutlitoken ????
          if (<number>canvas.tokens?.controlled.length > 1) {
            warn(`The interaction support only one selected token at the time`, true);
            return;
          }

          const interactorToken = <Token>canvas.tokens?.controlled[0];
          if (!interactorToken) {
            warn(i18n(`${CONSTANTS.MODULE_NAME}.interactWithEnvironment.selectTokenWarn`), true);
            return;
          }

          if (interactorToken.id == environmentPlaceableObject.id) {
            warn(`The interactor can't be the environment`, true);
            return;
          }
          //Get current system config
          //@ts-ignore
          // const config = (game.system.id == "tormenta20" ? CONFIG.T20 : CONFIG[game.system.id.toUpperCase()]);

          const itemID = event.currentTarget.id;
          // const environment = <Actor>canvas.tokens?.get(environmentToken.id)?.actor;
          // const interactor = <Actor>canvas.tokens?.get(interactorToken.id)?.actor;
          // const environmentItem = <Item>environment.items.get(itemID);
          const environmentItem = <Item>environmentActorExternal?.items.get(itemID);
          let environmentToken: TokenDocument = <TokenDocument>environmentActorExternal.token;
          if (environmentPlaceableObject instanceof Token) {
            environmentToken = environmentPlaceableObject.document;
          } else {
            environmentToken = interactorToken.document;
          }

          const customInfo = new customInfoEnvironmentInteraction();

          customInfo.environmentPlaceableObjectID = <string>environmentPlaceableObject.id;
          customInfo.environmentPlaceableObjectTYPE = <string>environmentPlaceableObject.document.documentName;

          customInfo.environmentTokenID = <string>environmentToken.id;
          //customInfo.environmentActorID = <string>environmentToken.actor?.id;
          customInfo.environmentActorID = <string>environmentActorExternal.id;
          customInfo.environmentItemID = <string>environmentItem.id;

          let interactorItemTmp: Item;
          if (environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesuseitemenvironment)) {
            interactorItemTmp = environmentItem;
            customInfo.interactorTokenID = <string>environmentToken.id;
            customInfo.interactorActorID = <string>environmentToken.actor?.id;
            customInfo.interactorItemID = <string>environmentItem.id;
          } else {
            // We need to create a temporary token for applying all the feature of the player
            const [ownedItemTmp] = <Document<any, Actor>[]>await interactorToken.actor?.createEmbeddedDocuments('Item', [environmentItem.toObject()]);
            interactorItemTmp = <Item>ownedItemTmp;
            customInfo.interactorTokenID = <string>interactorToken.id;
            customInfo.interactorActorID = <string>interactorToken.actor?.id;
            customInfo.interactorItemID = <string>interactorItemTmp.id;
          }

          // try {
          //@ts-ignore
          // const action = <string>ownedItem.getFlag(CONSTANTS.MODULE_NAME,Flags.notesdetail); //ownedItem.data.data.actionType; //$(button).data('action');
          // const noteDetail = converToEnvironmentType(action);
          // const noteDetail = <string>ownedItem.getFlag(CONSTANTS.MODULE_NAME, Flags.notesdetail);
          // let interactorItem = environmentItem;
          try {
            // Integration with 'item macro'
            const useItemMacro = <boolean>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesuseitemmacro);
            // Integration with 'use as macro'
            const useAsMacro = <boolean>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesuseasmacro);
            const explicitDC = <number>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesexplicitdc);
            const REQUEST_LABEL = 
              <string>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notes) ?? '';

            if (useItemMacro) {
              log(`Try to use the integration with 'item macro'`);
              //@ts-ignore
              if (interactorItemTmp.data.flags.itemacro?.macro && isItemMacroModuleActive()) {
                //if (ownedItem.type === ITEM_TYPE.LOOT) {
                //@ts-ignore
                if (isSystemItemMacroSupported() && interactorItemTmp.hasMacro()) {
                  //@ts-ignore
                  interactorItemTmp.executeMacro();
                  return;
                } else {
                  warn(`No macro found for the integration with 'item macro' for launch a macro`, true);
                  return;
                }
              } else {
                warn(`Can't use the integration with 'item macro' system not supported or hte module is not active`, true);
                return;
              }
            }

            if (useAsMacro) {
              const macroContent = <string>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notes);
              const macroArgs = environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesargs);
              const result = executeEIMacroContent(environmentItem, macroContent, macroArgs);
              if (result >= explicitDC) {
                const macroContentSuccess = <string>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notessuccess);
                const macroArgsSuccess = environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notessuccessargs);
                executeEIMacroContent(environmentItem, macroContentSuccess, macroArgsSuccess);
              } else {
                const macroContentFailure = <string>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesfailure);
                const macroArgsFailure = environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesfailureargs);
                executeEIMacroContent(environmentItem, macroContentFailure, macroArgsFailure);
              }
              return;
            }

            if (!REQUEST_LABEL) {
              debug(`No label event is setted for the environment interaction with the item`);
              rollDependingOnSystem(interactorItemTmp);
              // warn(`No label event is setted for the environment interaction with the item`, true);
              return;
            }
            const myRequestArray = REQUEST_LABEL.split('|') ?? [];
            if (myRequestArray.length == 0) {
              warn(`The label event setted for the environment interaction is invalid '${REQUEST_LABEL}'`, true);
              return;
            }

            // <ENVIRONMENT_TYPE>|<MACRO_NAME_OR_TYPE_REQUEST>|<groupsReq>|<DC_OR_NUMBER_TO_PASS>
            const environmentTypeReq = <string>myRequestArray[0]?.trim() ?? ENVIRONMENT_TYPE.ITEM;
            // If MACRO is referenced to the name of a macro
            // If ATTACK is referenced to the macro type used form "Token Action HUD" e.g. "item"
            const macroNameOrTypeReq = <string>myRequestArray[1]?.trim();
            //@ts-ignore
            const labelOrDcReq = <string>myRequestArray[2]?.trim() ?? interactorItemTmp.data.data.source;

            // const groupsReq = myRequestArray[2]?.trim() ? Array.from(myRequestArray[2]?.trim().split(',')) : [];

            const dcReq = <number>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesexplicitdc);
            //myRequestArray[4]?.trim() ? <number>Number.parseInt(myRequestArray[4]?.trim()) : null;

            // if ([ENVIRONMENT_TYPE.ATTACK].includes(noteDetail)) {
            log(environmentTypeReq + '|' + macroNameOrTypeReq + '|' + labelOrDcReq + '|' + dcReq);

            if (!environmentTypeReq) {
              warn(`The label setted for the environment interaction has invalid environmentTypeReq= '${environmentTypeReq}'`, true);
              return;
            }

            if (!macroNameOrTypeReq) {
              warn(`The label setted for the environment interaction has invalid macroNameOrTypeReq = '${macroNameOrTypeReq}'`, true);
              return;
            }

            // Hooks.once('renderDialog', (dialog, html, dialogData) => {
            //   dialog.setPosition({ top: event.clientY - 50 ?? null, left: window.innerWidth - 710 });
            // });
            customInfo.requestLabel = <string>REQUEST_LABEL;
            customInfo.environmentDC = dcReq;

            switch (environmentTypeReq) {
              case ENVIRONMENT_TYPE.ITEM: {
                debug(`Enviroment type is ITEM`);
                //@ts-ignore
                environmentItem.roll();
                break;
              }
              case ENVIRONMENT_TYPE.DICE: {
                debug(`Enviroment type is DICE`);
                // const roll = new Roll(macroNameOrTypeReq).roll();
                // const result = <number>await roll.data.total ?? 0;
                let result = 0;
                const formula = macroNameOrTypeReq.includes('data') ? macroNameOrTypeReq.replace(/data\./g, '@') : macroNameOrTypeReq;
                const data = interactorToken.document.actor ? interactorToken.document.actor.getRollData() : {};
                const roll = new Roll(formula, data);
                let myresult = 0;
                //roll.roll();
                try {
                  await roll.evaluate();
                  myresult = roll.total ? <number>roll.total : parseInt(roll.result);
                } catch (e) {
                  myresult = parseInt(eval(roll.result));
                }
                //myvalue = roll.total || 0;
                if (!is_real_number(myresult)) {
                  warn(`The formula '${formula}' doesn't return a number we set the default 1`, true);
                  result = 1;
                } else {
                  result = myresult;
                }

                if (result >= explicitDC) {
                  const macroContentSuccess = <string>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notessuccess);
                  const macroArgsSuccess = environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notessuccessargs);
                  executeEIMacroContent(environmentItem, macroContentSuccess, macroArgsSuccess);
                } else {
                  const macroContentFailure = <string>environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesfailure);
                  const macroArgsFailure = environmentItem.getFlag(CONSTANTS.MODULE_NAME, EnvironmentInteractionFlags.notesfailureargs);
                  executeEIMacroContent(environmentItem, macroContentFailure, macroArgsFailure);
                }
                break;
              }
              case ENVIRONMENT_TYPE.MACRO: {
                debug(`Enviroment type is MACRO`);
                if (macroNameOrTypeReq) {
                  const macroName = macroNameOrTypeReq;
                  const macro = <Macro>(game.macros?.getName(macroName) || game.macros?.get(macroName));
                  if (!macro) {
                    warn(`No macro found with name/id : ${macroName}`, true);
                  }
                  macro.execute({ actor: <Actor>interactorToken.actor, token: interactorToken });
                } else {
                  warn(`Can't interact with item for launch a macro`, true);
                  //throw new Error(`Can't interact with item for launch a macro`);
                }
                break;
              }
              // may need to update certain item properties like proficiency/equipped
              case ENVIRONMENT_TYPE.ATTACK: {
                debug(`Enviroment type is ATTACK`);
                // Is managed from the system with manual intervetion
                // Macro type depends for now on the system used
                if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                  log(`Try the Token Action HUD integration`);
                  let payload;
                  // manage generic case with key 'item'
                  if (macroNameOrTypeReq == 'item') {
                    const tokenId = interactorToken.id;
                    const actionId = interactorItemTmp.id;
                    payload = macroNameOrTypeReq + '|' + tokenId + '|' + actionId;
                  } else {
                    let refActionId, refId;
                    if (macroNameOrTypeReq.includes(':')) {
                      if (macroNameOrTypeReq.includes(',')) {
                        const [req0, req1] = <string[]>macroNameOrTypeReq.split(',');
                        const req0p = (<string>req0).split(':');
                        refActionId = req0p[0];
                        refId = req0p[1];
                      }
                    } else {
                      const [req0, req1] = macroNameOrTypeReq.split(':');
                      const req0p = (<string>req0).split(':');
                      refActionId = req0p[0];
                      refId = req0p[1];
                    }
                    const tokenId = interactorToken.id;
                    payload = refActionId + '|' + tokenId + '|' + refId;
                  }
                  const some = await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                  log(some);
                  // Hooks.on('forceUpdateTokenActionHUD', (args) => {
                  //   const checkout = args;
                  // });
                } else {
                  warn(`System not supported : ${game.system?.id}`, true);
                  //throw new Error(`System not supported : ${game.system?.id}`);
                }
                break;
              }
              case ENVIRONMENT_TYPE.ABILITY: {
                debug(`Enviroment type is ABILITY`);
                // (
                //  [{token:"Thoramir", altKey: true},"John Locke", {token:"Toadvine", fastForward:true}],
                //  {request:'perception',dc:15, silent:true, fastForward:false, flavor:'Testing flavor'}
                // )
                if (isSystemMonkTokenBarSupported() && isMonkTokensBarModuleActive()) {
                  log(`Try the Monk Tokens Bar integration`);
                  const options = new MonkTokenBarRollOptions();
                  options.ei = customInfo;

                  options.silent = true;
                  options.fastForward = true;
                  // TODO i use this for pass the itemId
                  options.flavor = environmentItem.data.name;
                  options.request = macroNameOrTypeReq;
                  options.dc = dcReq;

                  const groupsReq = labelOrDcReq?.trim() ? Array.from(labelOrDcReq?.trim().split(',')) : [];

                  options.requestoptions.push({
                    id: <string>macroNameOrTypeReq.split(':')[0],
                    text: <string>macroNameOrTypeReq.split(':')[1],
                    groups: groupsReq,
                  });
                  if (options.request.includes(':')) {
                    const some = await getMonkTokenBarAPI().requestRoll([interactorToken], options);
                    log(some);
                    // Hooks.on('tokenBarUpdateRoll', (tokenBarApp: Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
                    //   // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
                    //   const checkout = msgtokenRoll.total;
                    // });
                  } else {
                    warn(i18n(`${CONSTANTS.MODULE_NAME}.interactWithEnvironment.noValidRequestWarn`) + ` for monk token bar integration ${options.request}`, true);
                  }
                } else if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                  log(`Try the Token Action HUD integration`);
                  let payload;
                  if (macroNameOrTypeReq == 'item') {
                    const tokenId = interactorToken.id;
                    const actionId = interactorItemTmp.id;
                    payload = macroNameOrTypeReq + '|' + tokenId + '|' + actionId;
                  } else {
                    let refActionId, refId;
                    if (macroNameOrTypeReq.includes(':')) {
                      if (macroNameOrTypeReq.includes(',')) {
                        const [req0, req1] = macroNameOrTypeReq.split(',');
                        const req0p = (<string>req0).split(':');
                        refActionId = req0p[0];
                        refId = req0p[1];
                      }
                    } else {
                      const [req0, req1] = macroNameOrTypeReq.split(':');
                      const req0p = (<string>req0).split(':');
                      refActionId = req0p[0];
                      refId = req0p[1];
                    }
                    const tokenId = interactorToken.id;
                    payload = refActionId + '|' + tokenId + '|' + refId;
                  }
                  const some = await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                  log(some);
                  // Hooks.on('forceUpdateTokenActionHUD', (args) => {
                  //   const checkout = args;
                  // });
                } else {
                  warn(`System not supported : ${game.system?.id}`, true);
                  //throw new Error(`System not supported : ${game.system?.id}`);
                }
                break;
              }
              case ENVIRONMENT_TYPE.SAVE:
              case ENVIRONMENT_TYPE.SKILL: {
                debug(`Enviroment type is SAVE OR SKILL`);
                // (
                //  [{token:"Thoramir", altKey: true},"John Locke", {token:"Toadvine", fastForward:true}],
                //  {request:'perception',dc:15, silent:true, fastForward:false, flavor:'Testing flavor'}
                // )
                if (isSystemMonkTokenBarSupported() && isMonkTokensBarModuleActive()) {
                  log(`Try the Monk Tokens Bar integration`);
                  //const save = environmentItem.data.data.save.ability;
                  //interactor.rollAbilitySave(save);
                  const options = new MonkTokenBarRollOptions();
                  options.ei = customInfo;

                  options.silent = true;
                  options.fastForward = true;
                  // TODO i use this for pass the itemId
                  options.flavor = environmentItem.data.name;
                  options.request = macroNameOrTypeReq;
                  options.dc = dcReq;

                  if (options.request.includes(':')) {
                    if (options.request.includes(',')) {
                      const [req0, req1] = options.request.split(',');

                      // Is a contested roll
                      const request1: any = new Object();
                      request1.token = environmentToken.id;
                      request1.request = req1; //'save:'+ environmentItem.data.data.save.ability;

                      const request0: any = new Object();
                      request0.token = interactorToken.id;
                      request0.request = req0; //'save:'+ interactorItem.data.data.save.ability;

                      //@ts-ignore
                      options.request = undefined;

                      const groupsReq = labelOrDcReq?.trim() ? Array.from(labelOrDcReq?.trim().split(',')) : [];

                      // eslint-disable-next-line @typescript-eslint/no-array-constructor
                      // options.requestoptions.push({ id: 'save', text: req0.split(':')[1], groups: [] });
                      // options.requestoptions.push({ id: 'save', text: req1.split(':')[1], groups: [] });
                      options.requestoptions.push({
                        id: <string>(<string>req0).split(':')[0],
                        text: <string>(<string>req0).split(':')[1],
                        groups: groupsReq,
                      });
                      options.requestoptions.push({
                        id: <string>(<string>req1).split(':')[0],
                        text: <string>(<string>req1).split(':')[1],
                        groups: groupsReq,
                      });
                      const some = await getMonkTokenBarAPI().requestContestedRoll(request1, request0, options);
                      log(some);
                    } else {
                      const groupsReq = labelOrDcReq?.trim() ? Array.from(labelOrDcReq?.trim().split(',')) : [];
                      options.requestoptions.push({
                        id: <string>macroNameOrTypeReq.split(':')[0],
                        text: <string>macroNameOrTypeReq.split(':')[1],
                        groups: groupsReq,
                      });
                      const some = await getMonkTokenBarAPI().requestRoll([interactorToken], options);
                      log(some);
                    }
                    // Hooks.on('tokenBarUpdateRoll', (tokenBarApp: ContestedRoll|Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
                    //   // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
                    //   const checkout = msgtokenRoll.total;
                    // });
                  } else {
                    warn(i18n(`${CONSTANTS.MODULE_NAME}.interactWithEnvironment.noValidRequestWarn`) + ` for monk token bar integration ${options.request}`, true);
                  }
                } else if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                  log(`Try the Token Action HUD integration`);
                  let payload;
                  if (macroNameOrTypeReq == 'item') {
                    const tokenId = interactorToken.id;
                    const actionId = interactorItemTmp.id;
                    payload = macroNameOrTypeReq + '|' + tokenId + '|' + actionId;
                  } else {
                    let refActionId, refId;
                    if (macroNameOrTypeReq.includes(':')) {
                      if (macroNameOrTypeReq.includes(',')) {
                        const [req0, req1] = macroNameOrTypeReq.split(',');
                        const req0p = (<string>req0).split(':');
                        refActionId = req0p[0];
                        refId = req0p[1];
                      }
                    } else {
                      const [req0, req1] = macroNameOrTypeReq.split(':');
                      const req0p = (<string>req0).split(':');
                      refActionId = req0p[0];
                      refId = req0p[1];
                    }
                    const tokenId = interactorToken.id;
                    payload = refActionId + '|' + tokenId + '|' + refId;
                  }
                  const some = await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                  log(some);
                  // Hooks.on('forceUpdateTokenActionHUD', (args) => {
                  //   const checkout = args;
                  // });
                } else {
                  warn(`System not supported : ${game.system?.id}`, true);
                  //throw new Error(`System not supported : ${game.system?.id}`);
                }
                break;
              }
              default: {
                debug(`Enviroment type is DEFAULT`);
                if (isSystemMonkTokenBarSupported() && isMonkTokensBarModuleActive()) {
                  log(`Try the Monk Tokens Bar integration`);
                  const options = new MonkTokenBarRollOptions();
                  options.ei = customInfo;

                  options.silent = true;
                  options.fastForward = true;
                  // TODO i use this for pass the itemId
                  options.flavor = environmentItem.data.name;
                  options.request = macroNameOrTypeReq;
                  options.dc = dcReq;

                  const groupsReq = labelOrDcReq?.trim() ? Array.from(labelOrDcReq?.trim().split(',')) : [];

                  options.requestoptions.push({
                    id: <string>macroNameOrTypeReq.split(':')[0],
                    text: <string>macroNameOrTypeReq.split(':')[1],
                    groups: groupsReq,
                  });
                  if (options.request.includes(':')) {
                    const some = await getMonkTokenBarAPI().requestRoll([interactorToken], options);
                    log(some);
                    // Hooks.on('tokenBarUpdateRoll', (tokenBarApp: Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
                    //   // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
                    //   const checkout = msgtokenRoll.total;
                    // });
                  } else {
                    warn(i18n(`${CONSTANTS.MODULE_NAME}.interactWithEnvironment.noValidRequestWarn`) + ` for monk token bar integration ${options.request}`, true);
                  }
                } else if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                  log(`Try the Token Action HUD integration`);
                  let payload;
                  if (macroNameOrTypeReq == 'item') {
                    const tokenId = interactorToken.id;
                    const actionId = interactorItemTmp.id;
                    payload = macroNameOrTypeReq + '|' + tokenId + '|' + actionId;
                  } else {
                    let refActionId, refId;
                    if (macroNameOrTypeReq.includes(':')) {
                      if (macroNameOrTypeReq.includes(',')) {
                        const [req0, req1] = macroNameOrTypeReq.split(',');
                        const req0p = (<string>req0).split(':');
                        refActionId = req0p[0];
                        refId = req0p[1];
                      }
                    } else {
                      const [req0, req1] = macroNameOrTypeReq.split(':');
                      const req0p = (<string>req0).split(':');
                      refActionId = req0p[0];
                      refId = req0p[1];
                    }
                    const tokenId = interactorToken.id;
                    payload = refActionId + '|' + tokenId + '|' + refId;
                  }
                  const some = await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                  log(some);
                  // Hooks.on('forceUpdateTokenActionHUD', (args) => {
                  //   const checkout = args;
                  // });
                } else {
                  warn(`System not supported : ${game.system?.id}`, true);
                  //throw new Error(`System not supported : ${game.system?.id}`);
                }
                break;
              }
            }
          } finally {
            if (interactorItemTmp && interactorItemTmp?.id) {
              const found = interactorToken.actor?.items.find((itemCheck: Item) => {
                return itemCheck && itemCheck.id == interactorItemTmp?.id;
              });
              if (found) {
                if (interactorItemTmp.actor?.id == interactorToken.actor?.id) {
                  await interactorItemTmp.delete();
                  //interactorToken.actor?.deleteEmbeddedDocuments('Item', [<string>interactorItemTmp.id]);
                }
              }
            }
          }
          // } finally {
          //   if (interactorItemTmp && interactorItemTmp?.id) {
          //     const found = interactorToken.actor?.items.find((itemCheck: Item) => {
          //       return itemCheck && itemCheck.id == interactorItemTmp?.id;
          //     });
          //     if (found) {
          //       await interactorToken.actor?.deleteEmbeddedDocuments('Item', [<string>interactorItemTmp.id]);
          //     }
          //   }
          // }

          if (game.settings.get(CONSTANTS.MODULE_NAME, 'closeDialog')) {
            const appID = html.closest(`div.app`).data('appid');
            ui.windows[appID]?.close();
          }
        });
    };

    new Dialog(
      {
        title: i18n(`${CONSTANTS.MODULE_NAME}.interactWithEnvironment.title`),
        content: content,
        buttons: buttons,
        default: '',
        render: render,
        close: (html) => {
          // DO SOMETHING
        },
      },
      dialogOptions,
    ).render(true);
  }
}
