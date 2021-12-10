import { customInfoEnvironmentInteraction, ENVIRONMENT_TYPE, Flags } from './environment-interaction-models';
import { i18n, log } from '../environment-interaction-main.js';
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
import { executeEIMacro } from './environment-interaction-utils';

export class EnvironmentInteraction {
  // Handlebars Helpers
  // static registerHandlebarsHelpers() {
  //   // generic system
  //   Handlebars.registerHelper('ei-type', (item: Item) => {
  //     const { type } = item;
  //     const noteDetail = item.getFlag(moduleName, Flags.notesdetail);
  //     let consumableLabel = 'Unknown';
  //     // TODO to make this more... sense ???
  //     if (noteDetail === ACTION_TYPE.abil || noteDetail === ACTION_TYPE.util) {
  //       consumableLabel = i18n(`${moduleName}.ActionAbil`);
  //     } else if (noteDetail === ACTION_TYPE.save) {
  //       consumableLabel = i18n(`${moduleName}.ActionSave`);
  //     } else {
  //       consumableLabel = i18n(`${moduleName}.ActionSkill`);
  //     }
  //     const typeDict = {
  //       weapon: i18n(`${moduleName}.ItemTypeWeapon`),
  //       consumable: consumableLabel,
  //       loot: i18n(`${moduleName}.handlebarsHelper.Macro`),
  //     };

  //     return typeDict[type];
  //   });
  //   // }
  // }

  // Wrappers
  static registerWrappers() {
    // Alter mouse interaction for tokens flagged as environment
    //@ts-ignore
    libWrapper.register(moduleName, 'CONFIG.Token.objectClass.prototype._canView', getGame().EnvironmentInteraction._canView, 'MIXED');
    //@ts-ignore
    libWrapper.register(moduleName, 'CONFIG.Token.objectClass.prototype._onClickLeft', getGame().EnvironmentInteraction._onClickLeft, 'MIXED');
    //@ts-ignore
    libWrapper.register(moduleName, 'CONFIG.Token.objectClass.prototype._onClickLeft2', getGame().EnvironmentInteraction._onClickLeft2, 'MIXED');
  }

  static _canView(wrapped, ...args) {
    const token = <Token>(<unknown>this);
    // If token is an environment token, then any use can "view" (allow _clickLeft2 callback)
    if (token.document.getFlag(moduleName, Flags.environmentToken)) {
      return true;
    } else {
      return wrapped(...args);
    }
  }

  static _onClickLeft(wrapped, event) {
    const token = <Token>(<unknown>this);
    // Prevent deselection of currently controlled token when clicking environment token
    if (!token.document.getFlag(moduleName, Flags.environmentToken)) {
      return wrapped(event);
    }
  }

  static _onClickLeft2(wrapped, event) {
    const token = <Token>(<unknown>this);
    if (!token.document.getFlag(moduleName, Flags.environmentToken)) {
      return wrapped(event);
    } else {
      EnvironmentInteraction.interactWithEnvironment(token, event);
    }
  }

  // Environment Interaction
  static async interactWithEnvironment(environmentToken:Token, event) {
    if(!environmentToken.actor || !environmentToken.actor?.id){
      ui.notifications?.warn(moduleName + ' | The environment interaction need the token is been liked to a actor');
      return;
    }

    // TODO: dnd5e specific; create a helper function to handle different systems
    // Sort to mimic order of items on character sheet
    const items: Item[] = [];
    // const actionsType: string[] = [ITEM_TYPE.TOOL, ITEM_TYPE.WEAPON, ACTION_TYPE.abil, ACTION_TYPE.save, ITEM_TYPE.LOOT, ITEM_TYPE.CONSUMABLE];
    // for (const type of actionsType) {
    environmentToken.actor?.items
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
        callback: () => environmentToken.actor?.sheet?.render(true),
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
        const environmentItem = <Item>environmentToken.actor?.items.get(itemID);
        let content = <string>environmentItem.getFlag(moduleName, Flags.notesinfo);
        if (!content) {
          content = 'No info provided';
        }
        const d = new Dialog({
          title: environmentItem.data.name,
          content: content,
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
          if(<number>getCanvas().tokens?.controlled.length > 1){
            ui.notifications?.warn(moduleName + ' | The interaction support only one selected token at the time');
            return;
          }

          const interactorToken = <Token>getCanvas().tokens?.controlled[0];
          if (!interactorToken) {
            ui.notifications?.warn(moduleName + ' | ' + i18n(`${moduleName}.interactWithEnvironment.selectTokenWarn`));
            return;
          }

          if(interactorToken.id == environmentToken.id){
            ui.notifications?.warn(moduleName + ' | The interactor token can\'t be same of the enviroment');
            return;
          }

          const itemID = event.currentTarget.id;
          // const environment = <Actor>getCanvas().tokens?.get(environmentToken.id)?.actor;
          // const interactor = <Actor>getCanvas().tokens?.get(interactorToken.id)?.actor;
          // const environmentItem = <Item>environment.items.get(itemID);
          const environmentItem = <Item>environmentToken.actor?.items.get(itemID);

          // We need to create a temporary token for applying all the feature of the player
          const [ownedItemTmp] = <Document<any, Actor>[]>await interactorToken.actor?.createEmbeddedDocuments('Item', [environmentItem.toObject()]);
          const interactorItemTmp = <Item>ownedItemTmp;
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
                    ui.notifications?.warn(moduleName + ' | No macro found for the integration with \'item macro\' for launch a macro');
                    return;
                  }
                } else {
                  ui.notifications?.warn(moduleName + ' | Can\'t use the integration with \'item macro\' system not supported or hte module is not active');
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
                ui.notifications?.warn(moduleName + ' | The label event setted for the environment interaction is invalid \'' + REQUEST_LABEL + '\'');
                return;
              }

              const customInfo = customInfoEnvironmentInteraction;
              customInfo.environmentTokenID = <string>environmentToken.id;
              customInfo.environmentActorID = <string>environmentToken.actor?.id;
              customInfo.environmentItemID = <string>environmentItem.id;
              customInfo.requestLabel = <string>REQUEST_LABEL;
              customInfo.interactorTokenID = <string>interactorToken.id;
              customInfo.interactorActorID = <string>interactorToken.actor?.id;
              customInfo.interactorItemID = <string>interactorItemTmp.id;

              // <ENVIRONMENT_TYPE>|<MACRO_NAME>|<LABEL_REQUEST>|
              // const environmentTypeReq = Object.values(MACRO_TYPE).includes(myRequestArray[0])
              //   ? //@ts-ignore
              //     myRequestArray[0]
              //   : noteDetail
              //   ? noteDetail
              //   : MACRO_TYPE.ITEM;
              const environmentTypeReq = myRequestArray[0] ?? ENVIRONMENT_TYPE.ITEM;
              // If MACRO is referenced to the name of a macro
              // If ATTACK is referenced to the macro type used form "Token Action HUD" e.g. "item"
              const macroNameOrTypeReq = myRequestArray[1];
              //@ts-ignore
              const labelOrDcReq = myRequestArray[2] ?? interactorItemTmp.data.data.source;
              // if ([ENVIRONMENT_TYPE.ATTACK].includes(noteDetail)) {
              log(environmentTypeReq + '|' + macroNameOrTypeReq + '|' + labelOrDcReq);
              // Hooks.once('renderDialog', (dialog, html, dialogData) => {
              //   dialog.setPosition({ top: event.clientY - 50 ?? null, left: window.innerWidth - 710 });
              // });
              // if ([ENVIRONMENT_TYPE.ATTACK].includes(environmentTypeReq)) {
              //   [interactorItem] = <Item[]>await interactorToken.actor?.createEmbeddedDocuments('Item', [interactorItemTmp.toObject()]);
              // }
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
                    ui.notifications?.warn(moduleName + ' | Can\'t interact with item for launch a macro');
                    throw new Error(moduleName + ' | Can\'t interact with item for launch a macro');
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
                // case ENVIRONMENT_TYPE.DAMAGE: {
                //   await interactorItem.rollDamage({ critical: event.altKey, event });
                //   break;
                // }
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
                    if (labelOrDcReq) {
                      options.dc = Number.parseInt(labelOrDcReq);
                    }
                    options.requestoptions.push({ id: macroNameOrTypeReq.split(':')[0], text: macroNameOrTypeReq.split(':')[1], groups: [] });
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
                    if (labelOrDcReq) {
                      options.dc = Number.parseInt(labelOrDcReq);
                    }
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
                        options.requestoptions.push({ id: req0.split(':')[0], text: req0.split(':')[1], groups: [] });
                        options.requestoptions.push({ id: req1.split(':')[0], text: req1.split(':')[1], groups: [] });
                        const some = await getMonkTokenBarAPI().requestContestedRoll(request1, request0, options);
                        log(some);
                      } else {
                        options.requestoptions.push({ id: macroNameOrTypeReq.split(':')[0], text: macroNameOrTypeReq.split(':')[1], groups: [] });
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
              }
            } finally {
              if (interactorItemTmp && interactorItemTmp?.id) {
                const found = interactorToken.actor?.items.find((itemCheck:Item) => {
                  return itemCheck && itemCheck.id == interactorItemTmp?.id;
                });
                if(found){
                  interactorToken.actor?.deleteEmbeddedDocuments('Item', [<string>interactorItemTmp.id]);
                }
              }
            }
          } finally {
            if (interactorItemTmp && interactorItemTmp?.id) {
              const found = interactorToken.actor?.items.find((itemCheck:Item) => {
                return itemCheck && itemCheck.id == interactorItemTmp?.id;
              });
              if(found){
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

  // Hooks
  static registerHooks() {
    // Add checkbox to token config to flag token as environment token
    Hooks.on('renderTokenConfig', (app, html, appData) => {
      if (!getGame().user?.isGM) {
        return;
      }
      const checked = app.object.getFlag(moduleName, Flags.environmentToken) ? 'checked' : '';
      const snippet = `
                <div class="form-group">
                    <label>${i18n(`${moduleName}.tokenConfig.label`)}</label>
                    <input type="checkbox" name="flags.${moduleName}.${Flags.environmentToken}" data-dtype="Boolean" ${checked} />
                </div>
            `;
      html.find(`div[data-tab="character"]`).append(snippet);
      html.css('height', 'auto');
    });
  }
}
