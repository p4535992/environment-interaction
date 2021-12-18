import { customInfoEnvironmentInteraction, ENVIRONMENT_TYPE, Flags } from './environment-interaction-m-models';
import { i18n, log } from '../environment-interaction-m-main.js';
// import { libWrapper } from '../lib/shim.js';
import {
  getCanvas,
  getGame,
  getMonkTokenBarAPI,
  getTokenActionHUDRollHandler,
  isItemMacroModuleActive,
  isMonkTokensBarModuleActive,
  isSystemItemMacroSupported,
  isSystemMonkTokenBarSupported,
  isSystemTokenActionHUDSupported,
  isTokenActionHudActive,
  moduleName,
} from './settings.js';
import Document from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { MonkTokenBarRollOptions } from '../lib/tokenbarapi/MonksTokenBarAPI';
import { executeEIMacro } from './environment-interaction-m-utils';
import { EnvironmentInteractionPlaceableConfig } from './environment-interaction-m-paceable-config';
// import { PrototypeTokenData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';

export class EnvironmentInteraction {
  // ====================
  // TOKEN
  // ====================

  static _canViewToken(wrapped, ...args) {
    const token = <Token>(<unknown>this);
    // const isEi =
    //   token.actor && token.actor.data.token
    //     ? getProperty(token.actor.data.token, `flags.${moduleName}.${Flags.environmentToken}`)
    //     : // ? token.document.getFlag(moduleName,Flags.environmentToken)
    //       false;
    const isEi = token.document.getFlag(moduleName, Flags.environmentToken) ?? false;
    // If token is an environment token, then any use can "view" (allow _clickLeft2 callback)
    // if (token.document.actor && token.document.actor.getFlag(moduleName, Flags.environmentToken)) {
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
    //     ? getProperty(token.actor.data.token, `flags.${moduleName}.${Flags.environmentToken}`)
    //     : // ? token.document.getFlag(moduleName,Flags.environmentToken)
    //       false;
    const isEi = token.document.getFlag(moduleName, Flags.environmentToken) ?? false;
    // const actor = <Actor>token.actor;
    // Prevent deselection of currently controlled token when clicking environment token
    // if (token.document.actor && !token.document.getFlag(moduleName, Flags.environmentToken)) {
    if (!isEi) {
      return wrapped(...args);
    }
  }

  static _onClickLeft2Token(wrapped, ...args) {
    const token = <Token>(<unknown>this);
    // const isEi =
    //   token.actor && token.actor.data.token
    //     ? getProperty(token.actor.data.token, `flags.${moduleName}.${Flags.environmentToken}`)
    //     : // ? token.document.getFlag(moduleName,Flags.environmentToken)
    //       false;
    const isEi = token.document.getFlag(moduleName, Flags.environmentToken) ?? false;
    // if (token.document.actor && !token.document.getFlag(moduleName, Flags.environmentToken)) {
    if (!isEi) {
      return wrapped(...args);
    } else {
      EnvironmentInteraction.interactWithEnvironmentFromPlaceableObject(token, ...args);
    }
  }

  // Environment Interaction
  // static async interactWithEnvironmentFromActor(environmentActor: Actor, ...args) {
  //   if (!environmentActor?.id) {
  //     ui.notifications?.warn(moduleName + ' | The environment interaction need the token is been liked to a actor');
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

    const flagRefActorId = environmentPlaceableObject.document.getFlag(moduleName, Flags.environmentTokenRef);
    if (!flagRefActorId) {
      ui.notifications?.warn(moduleName + ' | The environment interaction need a valid actor to reference the actions');
      return;
    }

    const environmentActorExternal = <Actor>getGame().actors?.get(flagRefActorId);
    if (!environmentActorExternal?.id) {
      ui.notifications?.warn(moduleName + ' | The environment interaction need a existing actor to reference the actions');
      return;
    }

    // TODO: dnd5e specific; create a helper function to handle different systems
    // Sort to mimic order of items on character sheet
    const items: Item[] = [];
    // const actionsType: string[] = [ITEM_TYPE.TOOL, ITEM_TYPE.WEAPON, ACTION_TYPE.abil, ACTION_TYPE.save, ITEM_TYPE.LOOT, ITEM_TYPE.CONSUMABLE];
    // for (const type of actionsType) {
    environmentActorExternal?.items
      .filter((environmentItemToCheck) => {
        if (environmentItemToCheck.getFlag(moduleName, Flags.notesuseei)) {
          if (environmentItemToCheck.getFlag(moduleName, Flags.notescondition)) {
            const result = executeEIMacro(environmentItemToCheck, Flags.notescondition);
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

    const content = await renderTemplate(`/modules/${moduleName}/templates/interaction-dialog.hbs`, { items });
    const buttons = <any>{};
    if (getGame().user?.isGM) {
      buttons.openSheet = {
        label: i18n(`${moduleName}.interactWithEnvironment.openCharacterSheet`),
        callback: () => {
          environmentActorExternal?.sheet?.render(true);
        },
      };
    }
    if (getGame().user?.isGM) {
      buttons.openPlaceableObject = {
        label: i18n(`${moduleName}.interactWithEnvironment.openPlaceableObject`),
        callback: () => {
          if (environmentPlaceableObject instanceof Token) {
            environmentPlaceableObject.actor?.sheet?.render(true);
          } else {
            environmentPlaceableObject.sheet?.render(true);
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
        const itemID = <string>event.currentTarget.id;
        //const environment = <Actor>getCanvas().tokens?.get(environmentToken.id)?.actor;
        //const environmentItem = <Item>environment.items.get(itemID);
        const environmentItem = <Item>environmentActorExternal?.items.get(itemID);
        let contentInfo = <string>environmentItem.getFlag(moduleName, Flags.notesinfo);
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
            console.log('Conferma finestra chiusa');
          },
        });
        d.render(true);
      }),
        html.on('click', `button.ei-flex-container`, async (event) => {
          // TODO integration mutlitoken ????
          if (<number>getCanvas().tokens?.controlled.length > 1) {
            ui.notifications?.warn(moduleName + ' | The interaction support only one selected token at the time');
            return;
          }

          const interactorToken = <Token>getCanvas().tokens?.controlled[0];
          if (!interactorToken) {
            ui.notifications?.warn(moduleName + ' | ' + i18n(`${moduleName}.interactWithEnvironment.selectTokenWarn`));
            return;
          }

          if (interactorToken.id == environmentPlaceableObject.id) {
            ui.notifications?.warn(moduleName + " | The interactor can't be the environment");
            return;
          }
          //Get current system config
          //@ts-ignore
          // const config = (getGame().system.id == "tormenta20" ? CONFIG.T20 : CONFIG[getGame().system.id.toUpperCase()]);

          const itemID = event.currentTarget.id;
          // const environment = <Actor>getCanvas().tokens?.get(environmentToken.id)?.actor;
          // const interactor = <Actor>getCanvas().tokens?.get(interactorToken.id)?.actor;
          // const environmentItem = <Item>environment.items.get(itemID);
          const environmentItem = <Item>environmentActorExternal?.items.get(itemID);
          let environmentToken: TokenDocument = <TokenDocument>environmentActorExternal.token;
          if (environmentPlaceableObject instanceof Token) {
            environmentToken = environmentPlaceableObject.document;
          }

          const customInfo = new customInfoEnvironmentInteraction();

          customInfo.environmentPlaceableObjectID = <string>environmentPlaceableObject.id;
          customInfo.environmentPlaceableObjectTYPE = <string>environmentPlaceableObject.document.documentName;

          customInfo.environmentTokenID = <string>environmentToken.id;
          //customInfo.environmentActorID = <string>environmentToken.actor?.id;
          customInfo.environmentActorID = <string>environmentActorExternal.id;
          customInfo.environmentItemID = <string>environmentItem.id;

          let interactorItemTmp;
          if (environmentItem.getFlag(moduleName, Flags.notesuseitemenvironment)) {
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

          try {
            //@ts-ignore
            // const action = <string>ownedItem.getFlag(moduleName,Flags.notesdetail); //ownedItem.data.data.actionType; //$(button).data('action');
            // const noteDetail = converToEnvironmentType(action);
            // const noteDetail = <string>ownedItem.getFlag(moduleName, Flags.notesdetail);
            // let interactorItem = environmentItem;
            try {
              // Integration with item macro
              const useItemMacro = <boolean>environmentItem.getFlag(moduleName, Flags.notesuseitemmacro);
              if (useItemMacro) {
                //@ts-ignore
                if (interactorItemTmp.data.flags.itemacro?.macro && isItemMacroModuleActive()) {
                  //if (ownedItem.type === ITEM_TYPE.LOOT) {
                  //@ts-ignore
                  if (isSystemItemMacroSupported() && interactorItemTmp.hasMacro()) {
                    //@ts-ignore
                    interactorItemTmp.executeMacro();
                    return;
                  } else {
                    ui.notifications?.warn(moduleName + " | No macro found for the integration with 'item macro' for launch a macro");
                    return;
                  }
                } else {
                  ui.notifications?.warn(moduleName + " | Can't use the integration with 'item macro' system not supported or hte module is not active");
                  return;
                }
              }

              const REQUEST_LABEL = <string>environmentItem.getFlag(moduleName, Flags.notes);
              if (!REQUEST_LABEL) {
                ui.notifications?.warn(moduleName + ' | No label event is setted for the environment interaction with the item');
                return;
              }
              const myRequestArray = REQUEST_LABEL.split('|') ?? [];
              if (myRequestArray.length == 0) {
                ui.notifications?.warn(moduleName + " | The label event setted for the environment interaction is invalid '" + REQUEST_LABEL + "'");
                return;
              }

              // <ENVIRONMENT_TYPE>|<MACRO_NAME_OR_TYPE_REQUEST>|<REQUEST_LABEL>|<DC_OR_NUMBER_TO_PASS>
              const environmentTypeReq = <string>myRequestArray[0]?.trim() ?? ENVIRONMENT_TYPE.ITEM;
              // If MACRO is referenced to the name of a macro
              // If ATTACK is referenced to the macro type used form "Token Action HUD" e.g. "item"
              const macroNameOrTypeReq = <string>myRequestArray[1]?.trim();
              //@ts-ignore
              const labelOrDcReq = <string>myRequestArray[2]?.trim() ?? interactorItemTmp.data.data.source;

              const dcReq = myRequestArray[3]?.trim() ? <number>Number.parseInt(myRequestArray[3]?.trim()) : 0;

              const groupsReq = myRequestArray[4]?.trim() ? Array.from(myRequestArray[4]?.trim().split(',')) : [];

              // if ([ENVIRONMENT_TYPE.ATTACK].includes(noteDetail)) {
              log(environmentTypeReq + '|' + macroNameOrTypeReq + '|' + labelOrDcReq + '|' + dcReq + '|' + groupsReq);
              // Hooks.once('renderDialog', (dialog, html, dialogData) => {
              //   dialog.setPosition({ top: event.clientY - 50 ?? null, left: window.innerWidth - 710 });
              // });
              customInfo.requestLabel = <string>REQUEST_LABEL;
              customInfo.environmentDC = dcReq;

              switch (environmentTypeReq) {
                case ENVIRONMENT_TYPE.MACRO: {
                  if (macroNameOrTypeReq) {
                    const macroName = macroNameOrTypeReq;
                    const macro = <Macro>(getGame().macros?.getName(macroName) || getGame().macros?.get(macroName));
                    if (!macro) {
                      ui.notifications?.warn(moduleName + ' | No macro found with name/id : ' + macroName);
                    }
                    macro.execute({ actor: <Actor>interactorToken.actor, token: interactorToken });
                  } else {
                    ui.notifications?.warn(moduleName + " | Can't interact with item for launch a macro");
                    throw new Error(moduleName + " | Can't interact with item for launch a macro");
                  }
                  break;
                }
                // may need to update certain item properties like proficiency/equipped
                case ENVIRONMENT_TYPE.ATTACK: {
                  // Is managed from the system with manual intervetion
                  // Macro type depends for now on the system used
                  if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                    let payload;
                    // manage generic case with key 'item'
                    if (macroNameOrTypeReq == 'item') {
                      const tokenId = interactorToken.id;
                      const actionId = interactorItemTmp.id;
                      payload = macroNameOrTypeReq + '|' + tokenId + '|' + actionId;
                    } else {
                      const [refActionId, refId] = macroNameOrTypeReq.split(',');
                      const tokenId = interactorToken.id;
                      payload = refActionId + '|' + tokenId + '|' + refId;
                    }
                    const some = await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                    log(some);
                    // Hooks.on('forceUpdateTokenActionHUD', (args) => {
                    //   const checkout = args;
                    // });
                  } else {
                    ui.notifications?.warn(moduleName + ' | System not supported : ' + getGame().system?.id);
                    throw new Error(moduleName + ' | System not supported : ' + getGame().system?.id);
                  }
                  break;
                }
                case ENVIRONMENT_TYPE.ABILITY: {
                  // (
                  //  [{token:"Thoramir", altKey: true},"John Locke", {token:"Toadvine", fastForward:true}],
                  //  {request:'perception',dc:15, silent:true, fastForward:false, flavor:'Testing flavor'}
                  // )
                  if (isSystemMonkTokenBarSupported() && isMonkTokensBarModuleActive()) {
                    const options = new MonkTokenBarRollOptions();
                    options.ei = customInfo;

                    options.silent = true;
                    options.fastForward = true;
                    // TODO i use this for pass the itemId
                    options.flavor = environmentItem.data.name;
                    options.request = macroNameOrTypeReq;
                    options.dc = dcReq;

                    options.requestoptions.push({ id: macroNameOrTypeReq.split(':')[0], text: macroNameOrTypeReq.split(':')[1], groups: groupsReq });
                    if (options.request.includes(':')) {
                      const some = await getMonkTokenBarAPI().requestRoll([interactorToken], options);
                      log(some);
                      // Hooks.on('tokenBarUpdateRoll', (tokenBarApp: Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
                      //   // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
                      //   const checkout = msgtokenRoll.total;
                      // });
                    } else {
                      ui.notifications?.warn(i18n(`${moduleName}.interactWithEnvironment.noValidRequestWarn`));
                    }
                  } else if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                    let payload;
                    if (macroNameOrTypeReq == 'item') {
                      const tokenId = interactorToken.id;
                      const actionId = interactorItemTmp.id;
                      payload = macroNameOrTypeReq + '|' + tokenId + '|' + actionId;
                    } else {
                      const [refActionId, refId] = macroNameOrTypeReq.split(',');
                      const tokenId = interactorToken.id;
                      payload = refActionId + '|' + tokenId + '|' + refId;
                    }
                    const some = await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                    log(some);
                    // Hooks.on('forceUpdateTokenActionHUD', (args) => {
                    //   const checkout = args;
                    // });
                  } else {
                    ui.notifications?.warn(moduleName + ' | System not supported : ' + getGame().system?.id);
                    throw new Error(moduleName + ' | System not supported : ' + getGame().system?.id);
                  }
                  break;
                }
                case ENVIRONMENT_TYPE.SAVE: {
                  // (
                  //  [{token:"Thoramir", altKey: true},"John Locke", {token:"Toadvine", fastForward:true}],
                  //  {request:'perception',dc:15, silent:true, fastForward:false, flavor:'Testing flavor'}
                  // )
                  if (isSystemMonkTokenBarSupported() && isMonkTokensBarModuleActive()) {
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

                        // eslint-disable-next-line @typescript-eslint/no-array-constructor
                        // options.requestoptions.push({ id: 'save', text: req0.split(':')[1], groups: [] });
                        // options.requestoptions.push({ id: 'save', text: req1.split(':')[1], groups: [] });
                        options.requestoptions.push({ id: req0.split(':')[0], text: req0.split(':')[1], groups: groupsReq });
                        options.requestoptions.push({ id: req1.split(':')[0], text: req1.split(':')[1], groups: groupsReq });
                        const some = await getMonkTokenBarAPI().requestContestedRoll(request1, request0, options);
                        log(some);
                      } else {
                        options.requestoptions.push({ id: macroNameOrTypeReq.split(':')[0], text: macroNameOrTypeReq.split(':')[1], groups: groupsReq });
                        const some = await getMonkTokenBarAPI().requestRoll([interactorToken], options);
                        log(some);
                      }
                      // Hooks.on('tokenBarUpdateRoll', (tokenBarApp: ContestedRoll|Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
                      //   // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
                      //   const checkout = msgtokenRoll.total;
                      // });
                    } else {
                      ui.notifications?.warn(i18n(`${moduleName}.interactWithEnvironment.noValidRequestWarn`));
                    }
                  } else if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                    let payload;
                    if (macroNameOrTypeReq == 'item') {
                      const tokenId = interactorToken.id;
                      const actionId = interactorItemTmp.id;
                      payload = macroNameOrTypeReq + '|' + tokenId + '|' + actionId;
                    } else {
                      const [refActionId, refId] = macroNameOrTypeReq.split(',');
                      const tokenId = interactorToken.id;
                      payload = refActionId + '|' + tokenId + '|' + refId;
                    }
                    const some = await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                    log(some);
                    // Hooks.on('forceUpdateTokenActionHUD', (args) => {
                    //   const checkout = args;
                    // });
                  } else {
                    ui.notifications?.warn(moduleName + ' | System not supported : ' + getGame().system?.id);
                    throw new Error(moduleName + ' | System not supported : ' + getGame().system?.id);
                  }
                  break;
                }
                default: {
                  if (isSystemMonkTokenBarSupported() && isMonkTokensBarModuleActive()) {
                    const options = new MonkTokenBarRollOptions();
                    options.ei = customInfo;

                    options.silent = true;
                    options.fastForward = true;
                    // TODO i use this for pass the itemId
                    options.flavor = environmentItem.data.name;
                    options.request = macroNameOrTypeReq;
                    options.dc = dcReq;

                    options.requestoptions.push({ id: macroNameOrTypeReq.split(':')[0], text: macroNameOrTypeReq.split(':')[1], groups: groupsReq });
                    if (options.request.includes(':')) {
                      const some = await getMonkTokenBarAPI().requestRoll([interactorToken], options);
                      log(some);
                      // Hooks.on('tokenBarUpdateRoll', (tokenBarApp: Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
                      //   // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
                      //   const checkout = msgtokenRoll.total;
                      // });
                    } else {
                      ui.notifications?.warn(i18n(`${moduleName}.interactWithEnvironment.noValidRequestWarn`));
                    }
                  } else if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                    let payload;
                    if (macroNameOrTypeReq == 'item') {
                      const tokenId = interactorToken.id;
                      const actionId = interactorItemTmp.id;
                      payload = macroNameOrTypeReq + '|' + tokenId + '|' + actionId;
                    } else {
                      const [refActionId, refId] = macroNameOrTypeReq.split(',');
                      const tokenId = interactorToken.id;
                      payload = refActionId + '|' + tokenId + '|' + refId;
                    }
                    const some = await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                    log(some);
                    // Hooks.on('forceUpdateTokenActionHUD', (args) => {
                    //   const checkout = args;
                    // });
                  } else {
                    ui.notifications?.warn(moduleName + ' | System not supported : ' + getGame().system?.id);
                    throw new Error(moduleName + ' | System not supported : ' + getGame().system?.id);
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
                  interactorToken.actor?.deleteEmbeddedDocuments('Item', [<string>interactorItemTmp.id]);
                }
              }
            }
          } finally {
            if (interactorItemTmp && interactorItemTmp?.id) {
              const found = interactorToken.actor?.items.find((itemCheck: Item) => {
                return itemCheck && itemCheck.id == interactorItemTmp?.id;
              });
              if (found) {
                interactorToken.actor?.deleteEmbeddedDocuments('Item', [<string>interactorItemTmp.id]);
              }
            }
          }

          if (getGame().settings.get(moduleName, 'closeDialog')) {
            const appID = html.closest(`div.app`).data('appid');
            ui.windows[appID].close();
          }
        });
    };

    new Dialog(
      {
        title: i18n(`${moduleName}.interactWithEnvironment.title`),
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
