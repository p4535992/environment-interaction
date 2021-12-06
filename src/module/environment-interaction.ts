import { ACTION_TYPE, ENVIROMENT_TYPE, Flags, ITEM_TYPE, MACRO_TYPE, useData } from './environment-interaction-models';
import { i18n } from '../environment-interaction-main.js';
// import { libWrapper } from '../lib/shim.js';
import {
  ENVIROMENT_INTERACTION_ITEM_MACRO_MODULE_NAME,
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
import { MonkTokenBarContestedRollRequest, MonkTokenBarRollOptions } from '../lib/tokenbarapi/MonksTokenBarAPI';
import { data } from 'jquery';
import { converToEnviromentType } from './environment-interaction-utils';
import { ContestedRoll } from '../lib/tokenbarapi/ContestedRoll';

export class EnvironmentInteraction {
  // Handlebars Helpers
  static registerHandlebarsHelpers() {
    // generic system
    Handlebars.registerHelper('ei-type', (item) => {
      const { type } = item;
      const actionType = <string>item.data.data.actionType;
      let consumableLabel = 'Unknown';
      // TODO to make this more... sense ???
      if (actionType === ACTION_TYPE.abil || actionType === ACTION_TYPE.util) {
        consumableLabel = i18n(`${moduleName}.ActionAbil`);
      } else if (actionType === ACTION_TYPE.save) {
        consumableLabel = i18n(`${moduleName}.ActionSave`);
      } else {
        consumableLabel = i18n(`${moduleName}.ActionSkill`);
      }
      const typeDict = {
        weapon: i18n(`${moduleName}.ItemTypeWeapon`),
        consumable: consumableLabel,
        loot: i18n(`${moduleName}.handlebarsHelper.Macro`),
      };

      return typeDict[type];
    });
    // }
  }

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
  static async interactWithEnvironment(environmentToken, event) {
    // TODO: dnd5e specific; create a helper function to handle different systems
    // Sort to mimic order of items on character sheet
    const items: Item[] = [];
    const actionsType: string[] = [ITEM_TYPE.TOOL, ITEM_TYPE.WEAPON, ACTION_TYPE.abil, ACTION_TYPE.save, ITEM_TYPE.LOOT, ITEM_TYPE.CONSUMABLE];
    for (const type of actionsType) {
      environmentToken.actor.items
        .filter((i) => {
          // if (i.type === ITEM_TYPE.CONSUMABLE) {
          //   return i.data.data.actionType === type;
          // } else {
          //   return i.type === type;
          // }
          return i.type === type;
        })
        .sort((a, b) => (a.data.sort || 0) - (b.data.sort || 0))
        .forEach((i) => items.push(i));
    }

    const content = await renderTemplate(`/modules/${moduleName}/templates/interaction-dialog.hbs`, { items });
    const buttons = <any>{};
    if (getGame().user?.isGM) {
      buttons.openSheet = {
        label: i18n(`${moduleName}.interactWithEnvironment.openCharacterSheet`),
        callback: () => environmentToken.actor.sheet.render(true),
      };
    }
    const dialogOptions = {
      id: 'ei-interaction-dialog',
      width: 270,
      top: event.data.originalEvent.clientY - 10,
      left: event.data.originalEvent.clientX + 50,
    };
    const render = (html) => {
      html.on('click', `button.ei-flex-container`, async (event) => {
        const interactorToken = <Token>getCanvas().tokens?.controlled[0];
        if (!interactorToken) {
          return ui.notifications?.warn(i18n(`${moduleName}.interactWithEnvironment.selectTokenWarn`));
        }
        const itemID = event.currentTarget.id;

        const environment = <Actor>getCanvas().tokens?.get(environmentToken.id)?.actor;
        // const interactor = <Actor>getCanvas().tokens?.get(interactorToken.id)?.actor;
        const environmentItem = <Item>environment.items.get(itemID);

        // We need to create a temporary token for applying all the feature of the player
        const item = environmentToken.actor.items.get(itemID);
        const [ownedItemTmp] = <Document<any, Actor>[]>await interactorToken.actor?.createEmbeddedDocuments('Item', [item.toObject()]);
        const ownedItem = <Item>ownedItemTmp;
        try {
          //@ts-ignore
          const action = ownedItem.data.data.actionType; //$(button).data('action');
          const actionType = converToEnviromentType(action);

          let interactorItem;
          try {
            // if ([ENVIROMENT_TYPE.ATTACK, ENVIROMENT_TYPE.DAMAGE].includes(actionType)) {
            if ([ENVIROMENT_TYPE.ATTACK].includes(actionType)) {
              [interactorItem] = <Item[]>await interactorToken.actor?.createEmbeddedDocuments('Item', [ownedItem.toObject()]);
            }
            // Hooks.once('renderDialog', (dialog, html, dialogData) => {
            //   dialog.setPosition({ top: event.clientY - 50 ?? null, left: window.innerWidth - 710 });
            // });
            // Integration with item macro
            //@ts-ignore
            if (ownedItem.data.flags.itemacro?.macro && isItemMacroModuleActive()) {
              //if (ownedItem.type === ITEM_TYPE.LOOT) {
              //@ts-ignore
              if (isSystemItemMacroSupported() && ownedItem.hasMacro()) {
                //@ts-ignore
                ownedItem.executeMacro();
              }
              //@ts-ignore
              else if (ownedItem.data.data.source) {
                //@ts-ignore
                const macroName = ownedItem.data.data.source;
                const macro = <Macro>(<Macros>getGame().macros).getName(macroName);
                if (!macro) {
                  ui.notifications?.error(moduleName + ' | No macro found with name/id : ' + macroName);
                }
                macro.execute({ actor: <Actor>interactorToken.actor, token: interactorToken });
              } else {
                ui.notifications?.error(moduleName + " | Can't interact with item for launch a macro");
                throw new Error(moduleName + " | Can't interact with item for launch a macro");
              }
            } else {
              switch (actionType) {
                // may need to update certain item properties like proficiency/equipped
                case ENVIROMENT_TYPE.ATTACK: {
                  // Is managed from the system with manual intervetion
                  // Macro type depends for now on the system used
                  if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                    //@ts-ignore
                    const macroType = Object.values(MACRO_TYPE).includes(ownedItem.data.data.source)
                      ? //@ts-ignore
                        ownedItem.data.data.source
                      : MACRO_TYPE.ITEM;
                    const tokenId = interactorToken.id;
                    const actionId = interactorItem.id;
                    const payload = macroType + '|' + tokenId + '|' + actionId;
                    //@ts-ignore
                    await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                    Hooks.on('forceUpdateTokenActionHUD', (args) => {
                      const checkout = args;
                    });
                  } else {
                    ui.notifications?.error(moduleName + ' | System not supported : ' + getGame().system?.id);
                    throw new Error(moduleName + ' | System not supported : ' + getGame().system?.id);
                  }
                  break;
                }
                // case ENVIROMENT_TYPE.DAMAGE: {
                //   await interactorItem.rollDamage({ critical: event.altKey, event });
                //   break;
                // }
                case ENVIROMENT_TYPE.ABILITY: {
                  // (
                  //  [{token:"Thoramir", altKey: true},"John Locke", {token:"Toadvine", fastForward:true}],
                  //  {request:'perception',dc:15, silent:true, fastForward:false, flavor:'Testing flavor'}
                  // )
                  if (isSystemMonkTokenBarSupported() && isMonkTokensBarModuleActive()) {
                    //@ts-ignore
                    const macroType = Object.values(MACRO_TYPE).includes(ownedItem.data.data.source)
                      ? //@ts-ignore
                        ownedItem.data.data.source
                      : MACRO_TYPE.ITEM;
                    const options = new MonkTokenBarRollOptions();
                    options.silent = true;
                    options.fastForward = true;
                    options.flavor = <string>ownedItem.name;
                    //@ts-ignore
                    options.request = macroType;
                    if (options.request.includes(':')) {
                      getMonkTokenBarAPI().requestRoll([interactorToken], options);
                      Hooks.on('tokenBarUpdateRoll', (tokenBarApp: Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
                        // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
                        const checkout = msgtokenRoll.total;
                      });
                    } else {
                      ui.notifications?.warn(i18n(`${moduleName}.interactWithEnvironment.noValidRequestWarn`));
                    }
                  } else if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                    //@ts-ignore
                    const macroType = Object.values(MACRO_TYPE).includes(ownedItem.data.data.source)
                      ? //@ts-ignore
                        ownedItem.data.data.source
                      : MACRO_TYPE.ITEM;
                    const tokenId = interactorToken.id;
                    const actionId = interactorItem.id;
                    const payload = macroType + '|' + tokenId + '|' + actionId;
                    //@ts-ignore
                    await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                    Hooks.on('forceUpdateTokenActionHUD', (args) => {
                      const checkout = args;
                    });
                  } else {
                    ui.notifications?.error(moduleName + ' | System not supported : ' + getGame().system?.id);
                    throw new Error(moduleName + ' | System not supported : ' + getGame().system?.id);
                  }
                  break;
                }
                case ENVIROMENT_TYPE.SAVE:
                case ENVIROMENT_TYPE.UTILITY: {
                  // (
                  //  [{token:"Thoramir", altKey: true},"John Locke", {token:"Toadvine", fastForward:true}],
                  //  {request:'perception',dc:15, silent:true, fastForward:false, flavor:'Testing flavor'}
                  // )
                  if (isSystemMonkTokenBarSupported() && isMonkTokensBarModuleActive()) {
                    //const save = environmentItem.data.data.save.ability;
                    //interactor.rollAbilitySave(save);
                    const options = new MonkTokenBarRollOptions();
                    options.silent = true;
                    options.fastForward = true;
                    options.flavor = <string>ownedItem.name;
                    //@ts-ignore
                    options.request = ownedItem.data.data.source;
                    if (options.request.includes(':')) {
                      if (options.request.includes('|')) {
                        const [req0, req1] = options.request.split('|');

                        // Is a contested roll
                        const request1:any = new Object();
                        request1.token = environmentToken.id;
                        //@ts-ignore
                        request1.request = req1; //'save:'+ environmentItem.data.data.save.ability;

                        const request0:any = new Object();
                        request0.token = interactorToken.id;
                        //@ts-ignore
                        request0.request = req0; //'save:'+ interactorItem.data.data.save.ability;
                        //@ts-igno
                        // options.dc = environmentItem.data.data.save.dc;
                        //@ts-ignore
                        options.request = undefined;
                        // eslint-disable-next-line @typescript-eslint/no-array-constructor
                        options.requestoptions.push({id:'save',text:req0.split(":")[1],groups:[]});
                        options.requestoptions.push({id:'save',text:req1.split(":")[1],groups:[]});
                        getMonkTokenBarAPI().requestContestedRoll(request1, request0, options);
                      } else {
                        getMonkTokenBarAPI().requestRoll([interactorToken], options);
                      }
                      Hooks.on('tokenBarUpdateRoll', (tokenBarApp: ContestedRoll|Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
                        // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
                        const checkout = msgtokenRoll.total;
                      });                    
                    } else {
                      ui.notifications?.warn(i18n(`${moduleName}.interactWithEnvironment.noValidRequestWarn`));
                    }
                  } else if (isSystemTokenActionHUDSupported() && isTokenActionHudActive()) {
                    //@ts-ignore
                    const macroType = Object.values(MACRO_TYPE).includes(ownedItem.data.data.source)
                      ? //@ts-ignore
                        ownedItem.data.data.source
                      : MACRO_TYPE.ITEM;
                    const tokenId = interactorToken.id;
                    const actionId = interactorItem.id;
                    const payload = macroType + '|' + tokenId + '|' + actionId;
                    //@ts-ignore
                    await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                    Hooks.on('forceUpdateTokenActionHUD', (args) => {
                      const checkout = args;
                    });                
                  } else {
                    ui.notifications?.error(moduleName + ' | System not supported : ' + getGame().system?.id);
                    throw new Error(moduleName + ' | System not supported : ' + getGame().system?.id);
                  }
                  break;
                }
              }
            }
          } finally {
            if (interactorItem) {
              interactorToken.actor?.deleteEmbeddedDocuments('Item', [interactorItem.id]);
            }
          }
        } finally {
          interactorToken.actor?.deleteEmbeddedDocuments('Item', [<string>ownedItem.id]);
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
