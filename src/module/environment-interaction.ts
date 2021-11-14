import { ACTION_TYPE, ENVIROMENT_TYPE, ITEM_TYPE, MACRO_TYPE, useData } from './environment-interaction-models';
import { i18n } from '../environment-interaction-main.js';
// import { libWrapper } from '../lib/shim.js';
import { getCanvas, getGame, getMonkTokenBarAPI, getTokenActionHUDRollHandler, moduleName } from './settings.js';
import Document from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { MonkTokenBarContestedRollRequest, MonkTokenBarRollOptions } from '../lib/tokenbarapi/MonksTokenBarAPI';
import { data } from 'jquery';
import { converToEnviromentType } from './environment-interaction-utils';

export class EnvironmentInteraction {
  // Handlebars Helpers
  static registerHandlebarsHelpers() {
    // if (getGame().system.id == 'dnd5e') {
    //   // dnd5e specific
    //   Handlebars.registerHelper('ei-type', (item) => {
    //     const { type } = item;
    //     const actionType = <string>item.data.data.actionType;
    //     let consumableLabel = 'Unknown';
    //     if (actionType === ACTION_TYPE.abil) {
    //       consumableLabel = i18n('DND5E.ActionAbil');
    //     } else if (actionType === ACTION_TYPE.save) {
    //       consumableLabel = i18n('DND5E.ActionSave');
    //     } else {
    //       consumableLabel = i18n(`${moduleName}.ActionSkill`);
    //     }
    //     const typeDict = {
    //       weapon: i18n('DND5E.ItemTypeWeapon'),
    //       consumable: consumableLabel,
    //       loot: i18n(`${moduleName}.handlebarsHelper.Macro`),
    //     };

    //     return typeDict[type];
    //   });
    // } else {
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

    // Removed we try a mutlisystem thing here dnd5e handling of chat message buttons
    // if (getGame().system.id === 'dnd5e') {
    //   //@ts-ignore
    //   libWrapper.register(moduleName, 'CONFIG.Item.documentClass._onChatCardAction', getGame().EnvironmentInteraction._onChatCardAction, 'MIXED');
    // }
  }

  static _canView(wrapped, ...args) {
    const token = <Token>(<unknown>this);
    // If token is an environment token, then any use can "view" (allow _clickLeft2 callback)
    if (token.document.getFlag(moduleName, 'environmentToken')) {
      return true;
    } else {
      return wrapped(...args);
    }
  }

  static _onClickLeft(wrapped, event) {
    const token = <Token>(<unknown>this);
    // Prevent deselection of currently controlled token when clicking environment token
    if (!token.document.getFlag(moduleName, 'environmentToken')) {
      return wrapped(event);
    }
  }

  static _onClickLeft2(wrapped, event) {
    const token = <Token>(<unknown>this);
    if (!token.document.getFlag(moduleName, 'environmentToken')) {
      return wrapped(event);
    } else {
      EnvironmentInteraction.interactWithEnvironment(token, event);
    }
  }

  // static async _onChatCardAction(wrapped, event) {
  //   const button = event.currentTarget;
  //   const chatMessageID = <string>$(button).closest(`li.chat-message`).data('message-id');
  //   const chatMessage = <ChatMessage>getGame().messages?.get(chatMessageID);
  //   const useData = <useData>chatMessage.getFlag(moduleName, 'useData');

  //   if (!useData) {
  //     return wrapped(event);
  //   }
  //   const { itemID, environmentTokenID, interactorTokenID } = useData;
  //   const environment = <Actor>getCanvas().tokens?.get(environmentTokenID)?.actor;
  //   const interactor = <Actor>getCanvas().tokens?.get(interactorTokenID)?.actor;
  //   const environmentItem = <Item>environment.items.get(itemID);

  //   const action = $(button).data('action');
  //   let interactorItem;

  //   if ([ENVIROMENT_TYPE.ATTACK, ENVIROMENT_TYPE.DAMAGE].includes(action)) {
  //     [interactorItem] = <Item[]>await interactor.createEmbeddedDocuments('Item', [environmentItem.toObject()]);
  //   }
  //   if ([ENVIROMENT_TYPE.ABILITY, ENVIROMENT_TYPE.SAVE].includes(action)) {
  //     Hooks.once('renderDialog', (dialog, html, dialogData) => {
  //       dialog.setPosition({ top: event.clientY - 50 ?? null, left: window.innerWidth - 710 });
  //     });
  //   }

  //   switch (action) {
  //     // may need to update certain item properties like proficiency/equipped
  //     case ENVIROMENT_TYPE.ATTACK: {
  //       let prof: any = null;
  //       if (getGame().settings.get(moduleName, 'autoProficiency')) {
  //         prof = true;
  //       } else {
  //         prof = <boolean>await Dialog.confirm({
  //           title: i18n(`${moduleName}.Proficiency`),
  //           content: i18n(`${moduleName}.autoProficiency.content`),
  //           options: { top: event.clientY ?? null, left: window.innerWidth - 560, width: 250 },
  //         });
  //       }
  //       if (prof === null) {
  //         return interactor.deleteEmbeddedDocuments('Item', [interactorItem.id]);
  //       } else {
  //         await interactorItem.update({ proficiency: prof });
  //       }

  //       await interactorItem.rollAttack({ event });
  //       break;
  //     }
  //     case ENVIROMENT_TYPE.DAMAGE: {
  //       await interactorItem.rollDamage({ critical: event.altKey, event });
  //       break;
  //     }
  //     case ENVIROMENT_TYPE.ABILITY: {
  //       //const ability = environmentItem.data.data.ability;
  //       //interactor.rollAbilityTest(ability);
  //       getMonkTokenBarAPI().requestRoll([interactorTokenID]);
  //       break;
  //     }
  //     case ENVIROMENT_TYPE.SAVE: {
  //       //const save = environmentItem.data.data.save.ability;
  //       //interactor.rollAbilitySave(save);
  //       getMonkTokenBarAPI().requestRoll([interactorTokenID]);
  //       // getMonkTokenBarAPI().requestContestedRoll([interactorTokenID]);
  //       break;
  //     }
  //   }

  //   if (interactorItem) await interactor.deleteEmbeddedDocuments('Item', [interactorItem.id]);
  // }

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
          // REMOVED WE USE TOKENBAR  MODULE CHAT
          /*
          Hooks.once('preCreateChatMessage', (card, data, options, userID) => {
            const content = $(card.data.content);
            const actionType = converToEnviromentType(item.data.data.actionType);

            if ([ITEM_TYPE.LOOT, ITEM_TYPE.CONSUMABLE].includes(item.type)) {
              content.find(`footer`).remove();
              if (item.type === ITEM_TYPE.LOOT) content.find(`div.card-buttons`).remove();
            }

            if (actionType === ENVIROMENT_TYPE.ABILITY) {
              if (getGame().system.id == 'dnd5e') {
                //@ts-ignore
                content.find(`div.card-buttons`).append(`<button data-action="ability">${CONFIG.DND5E.abilities[item.data.data.ability]} ${i18n(`${moduleName}.interactWithEnvironment.Check`)}</button>`);
              }
            }

            if (actionType === ENVIROMENT_TYPE.ATTACK) {
              //@ts-ignore
              ownedItem.rollDamage({ critical: event.altKey, event });
              //@ts-ignore
              content.find(`div.card-buttons`).append(`<button data-action="damage">${CONFIG.DND5E.abilities[item.data.data.damage]} ${i18n(`${moduleName}.interactWithEnvironment.Check`)}</button>`);
            }
            card.data.update({ content: content.prop('outerHTML') });
          });
          */
          //@ts-ignore
          // const chatCard = await interactorToken.actor?.items?.get(<string>ownedItem.id)?.roll();
          // chatCard?.setFlag(moduleName, 'useData', {
          //   itemID,
          //   environmentTokenID: environmentToken.id,
          //   interactorTokenID: interactorToken.id,
          // });
          // // Integration with item macro
          // //@ts-ignore
          // if (ownedItem.data.flags.itemacro?.macro && getGame().modules.get('itemacro')?.active) {
          //   //@ts-ignore
          //   ownedItem.executeMacro();
          // }
          // await interactorToken.actor?.deleteEmbeddedDocuments('Item', [<string>ownedItem.id]);

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
            if (ownedItem.data.flags.itemacro?.macro && getGame().modules.get('itemacro')?.active) {
              if (ownedItem.type === ITEM_TYPE.LOOT) {
                //@ts-ignore
                const macroName = ownedItem.data.data.source;
                const macro = <Macro>(<Macros>getGame().macros).getName(macroName);

                macro.execute({ actor: <Actor>interactorToken.actor, token: interactorToken });
              } else {
                //@ts-ignore
                ownedItem.executeMacro();
              }
            } else {
              switch (actionType) {
                // may need to update certain item properties like proficiency/equipped
                case ENVIROMENT_TYPE.ATTACK: {
                  // Is managed from the system with manual intervetion
                  /*
                  let prof: any = null;
                  if (getGame().settings.get(moduleName, 'autoProficiency')) {
                    prof = true;
                  } else {
                    prof = <boolean>await Dialog.confirm({
                      title: i18n(`${moduleName}.Proficiency`),
                      content: i18n(`${moduleName}.autoProficiency.content`),
                      options: { top: event.clientY ?? null, left: window.innerWidth - 560, width: 250 },
                    });
                  }
                  if (prof === null) {
                    return interactorToken.actor?.deleteEmbeddedDocuments('Item', [interactorItem.id]);
                  } else {
                    await interactorItem.update({ proficiency: prof });
                  }
                  */
                  // await interactorItem.rollAttack({ event });
                  // Macro type depends for now on the system used
                  const macroType = MACRO_TYPE.ITEM;
                  const tokenId = interactorToken.id;
                  const actionId = interactorItem.id;
                  const payload = macroType + '|' + tokenId + '|' + actionId;
                  //@ts-ignore
                  await getTokenActionHUDRollHandler().doHandleActionEvent(event, payload);
                  break;
                }
                // case ENVIROMENT_TYPE.DAMAGE: {
                //   await interactorItem.rollDamage({ critical: event.altKey, event });
                //   break;
                // }
                case ENVIROMENT_TYPE.ABILITY: {
                  //const ability = environmentItem.data.data.ability;
                  //interactor.rollAbilityTest(ability);
                  const options = new MonkTokenBarRollOptions();
                  options.silent = true;
                  options.fastForward = true;
                  //@ts-ignore
                  options.request = ownedItem.data.data.source;
                  if (options.request.includes(':')) {
                    getMonkTokenBarAPI().requestRoll([interactorToken], options);
                  } else {
                    ui.notifications?.warn(i18n(`${moduleName}.interactWithEnvironment.noValidRequestWarn`));
                  }
                  break;
                }
                case ENVIROMENT_TYPE.SAVE: 
                case ENVIROMENT_TYPE.UTILITY: {
                  //const save = environmentItem.data.data.save.ability;
                  //interactor.rollAbilitySave(save);
                  const options = new MonkTokenBarRollOptions();
                  options.silent = true;
                  options.fastForward = true;
                  //@ts-ignore
                  options.request = ownedItem.data.data.source;
                  if (options.request.includes(':')) {
                    if(options.request.includes('|')){

                      const [req0, req1] = options.request.split('|');

                      // Is a contested roll
                      const request1 = new MonkTokenBarContestedRollRequest();
                      request1.token= environmentToken;
                      //@ts-ignore
                      request1.request = req1;//'save:'+ environmentItem.data.data.save.ability;

                      const request0 = new MonkTokenBarContestedRollRequest();
                      request0.token= interactorToken;
                      //@ts-ignore
                      request0.request = req0;//'save:'+ interactorItem.data.data.save.ability;
                      //@ts-igno
                      // options.dc = environmentItem.data.data.save.dc;
                      //@ts-ignore
                      options.request = undefined;
                      getMonkTokenBarAPI().requestContestedRoll(request1, request0, options);
                    }else{
                      getMonkTokenBarAPI().requestRoll([interactorToken], options);
                    }
                  } else {
                    ui.notifications?.warn(i18n(`${moduleName}.interactWithEnvironment.noValidRequestWarn`));
                  }
                  break;
                }
              }
            }
          } finally {
            if (interactorItem) {
              await interactorToken.actor?.deleteEmbeddedDocuments('Item', [interactorItem.id]);
            }
          }
        } finally {
          await interactorToken.actor?.deleteEmbeddedDocuments('Item', [<string>ownedItem.id]);
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
      const checked = app.object.getFlag(moduleName, 'environmentToken') ? 'checked' : '';
      const snippet = `
                <div class="form-group">
                    <label>${i18n(`${moduleName}.tokenConfig.label`)}</label>
                    <input type="checkbox" name="flags.${moduleName}.environmentToken" data-dtype="Boolean" ${checked} />
                </div>
            `;
      html.find(`div[data-tab="character"]`).append(snippet);
      html.css('height', 'auto');
    });
  }
}
