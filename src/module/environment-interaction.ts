import { ACTION_TYPE, ITEM_TYPE, useData } from './environment-interaction-models';
import { i18n } from '../environment-interaction-main.js';
// import { libWrapper } from '../lib/shim.js';
import { getCanvas, getGame, moduleName } from './settings.js';
import Document from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';

export class EnvironmentInteraction {
  // Handlebars Helpers
  static registerHandlebarsHelpers() {
    if (getGame().system.id == 'dnd5e') {
      // dnd5e specific
      Handlebars.registerHelper('ei-type', (item) => {
        const { type } = item;
        const actionType = <string>item.data.data.actionType;
        const typeDict = {
          weapon: i18n('DND5E.ItemTypeWeapon'),
          consumable: actionType === ACTION_TYPE.ABILITY ? i18n('DND5E.ActionAbil') : actionType === ACTION_TYPE.SAVE ? i18n('DND5E.ActionSave') : i18n(`${moduleName}.ActionSkill`),
          loot: i18n(`${moduleName}.handlebarsHelper.Macro`),
        };

        return typeDict[type];
      });
    } else {
      // generic system
      Handlebars.registerHelper('ei-type', (item) => {
        const { type } = item;
        const actionType = <string>item.data.data.actionType;
        const typeDict = {
          weapon: i18n(`${moduleName}.ItemTypeWeapon`),
          consumable: actionType === ACTION_TYPE.ABILITY ? i18n(`${moduleName}.ActionAbil`) : actionType === ACTION_TYPE.SAVE ? i18n(`${moduleName}.ActionSave`) : i18n(`${moduleName}.ActionSkill`),
          loot: i18n(`${moduleName}.handlebarsHelper.Macro`),
        };

        return typeDict[type];
      });
    }
  }

  // Wrappers
  static registerWrappers() {
    // Alter mouse interaction for tokens flagged as environment
    //@ts-ignore
    libWrapper.register(moduleName, 'CONFIG.Token.objectClass.prototype._canView', window.EnvironmentInteraction._canView, 'MIXED');
    //@ts-ignore
    libWrapper.register(moduleName, 'CONFIG.Token.objectClass.prototype._onClickLeft', window.EnvironmentInteraction._onClickLeft, 'MIXED');
    //@ts-ignore
    libWrapper.register(moduleName, 'CONFIG.Token.objectClass.prototype._onClickLeft2', window.EnvironmentInteraction._onClickLeft2, 'MIXED');

    // dnd5e handling of chat message buttons
    if (getGame().system.id === 'dnd5e') {
      //@ts-ignore
      libWrapper.register(moduleName, 'CONFIG.Item.documentClass._onChatCardAction', window.EnvironmentInteraction._onChatCardAction, 'MIXED');
    }
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

  static async _onChatCardAction(wrapped, event) {
    const button = event.currentTarget;
    const chatMessageID = $(button).closest(`li.chat-message`).data('message-id');
    const chatMessage = <ChatMessage>getGame().messages?.get(chatMessageID);
    const useData = chatMessage.getFlag(moduleName, 'useData');

    if (!useData) {
      return wrapped(event);
    }
    const { itemID, environmentTokenID, interactorTokenID } = <useData>useData;
    const environment = <Actor>getCanvas().tokens?.get(environmentTokenID)?.actor;
    const interactor = <Actor>getCanvas().tokens?.get(interactorTokenID)?.actor;
    const environmentItem = <Item>environment.items.get(itemID);

    const action = $(button).data('action');
    let interactorItem;

    if ([ACTION_TYPE.ATTACK, ACTION_TYPE.DAMAGE].includes(action)) {
      [interactorItem] = await interactor.createEmbeddedDocuments('Item', [environmentItem.toObject()]);
    }
    if ([ACTION_TYPE.ABILITY, ACTION_TYPE.SAVE].includes(action)) {
      Hooks.once('renderDialog', (dialog, html, dialogData) => {
        dialog.setPosition({ top: event.clientY - 50 ?? null, left: window.innerWidth - 710 });
      });
    }

    switch (action) {
      // may need to update certain item properties like proficiency/equipped
      case ACTION_TYPE.ATTACK: {
        let prof: any = null;
        if (getGame().settings.get(moduleName, 'autoProficiency')) {
          prof = true;
        } else {
          prof = <boolean>await Dialog.confirm({
            title: i18n('DND5E.Proficiency'),
            content: i18n(`${moduleName}.autoProficiency.content`),
            options: { top: event.clientY ?? null, left: window.innerWidth - 560, width: 250 },
          });
        }
        if (prof === null) {
          return interactor.deleteEmbeddedDocuments('Item', [interactorItem.id]);
        } else {
          await interactorItem.update({ proficiency: prof });
        }

        await interactorItem.rollAttack({ event });
        break;
      }
      case ACTION_TYPE.DAMAGE: {
        await interactorItem.rollDamage({ critical: event.altKey, event });
        break;
      }
      case ACTION_TYPE.ABILITY: {
        const ability = environmentItem.data.data.ability;
        interactor.rollAbilityTest(ability);
        break;
      }
      case ACTION_TYPE.SAVE: {
        const save = environmentItem.data.data.save.ability;
        interactor.rollAbilitySave(save);
        break;
      }
    }

    if (interactorItem) await interactor.deleteEmbeddedDocuments('Item', [interactorItem.id]);
  }

  // Environment Interaction
  static async interactWithEnvironment(environmentToken, event) {
    // TODO: dnd5e specific; create a helper function to handle different systems
    // Sort to mimic order of items on character sheet
    const items: Item[] = [];
    for (const type of [ITEM_TYPE.WEAPON, ACTION_TYPE.ABILITY, ACTION_TYPE.SAVE, ITEM_TYPE.LOOT]) {
      environmentToken.actor.items
        .filter((i) => {
          if (i.type === ITEM_TYPE.CONSUMABLE) {
            return i.data.data.actionType === type;
          } else return i.type === type;
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
        const item = environmentToken.actor.items.get(itemID);
        const [ownedItem] = <Document<any, Actor>[]>await interactorToken.actor?.createEmbeddedDocuments('Item', [item.toObject()]);

        // TODO Transfer to hooks file

        Hooks.once('preCreateChatMessage', (card, data, options, userID) => {
          const content = $(card.data.content);

          if ([ITEM_TYPE.LOOT, ITEM_TYPE.CONSUMABLE].includes(item.type)) {
            content.find(`footer`).remove();
            if (item.type === ITEM_TYPE.LOOT) content.find(`div.card-buttons`).remove();
          }

          if (item.data.data.actionType === ACTION_TYPE.ABILITY) {
            if (getGame().system.id == 'dnd5e') {
              //@ts-ignore
              content.find(`div.card-buttons`).append(`<button data-action="ability">${CONFIG.DND5E.abilities[item.data.data.ability]} ${i18n(`${moduleName}.interactWithEnvironment.Check`)}</button>`);
            }
          }

          card.data.update({ content: content.prop('outerHTML') });
        });

        //@ts-ignore
        const chatCard = await interactorToken.actor?.items?.get(<string>ownedItem.id)?.roll();
        chatCard.setFlag(moduleName, 'useData', {
          itemID,
          environmentTokenID: environmentToken.id,
          interactorTokenID: interactorToken.id,
        });

        // Integration with item macro
        if (ownedItem.data.flags.itemacro?.macro && getGame().modules.get('itemacro')?.active) {
          //@ts-ignore
          ownedItem.executeMacro();
        }
        await interactorToken.actor?.deleteEmbeddedDocuments('Item', [<string>ownedItem.id]);

        if (getGame().settings.get(moduleName, 'closeDialog')) {
          const appID = html.closest(`div.app`).data('appid');
          ui.windows[appID].close();
        }

        if (item.type === ITEM_TYPE.LOOT) {
          const macroName = item.data.data.source;
          const macro = <Macro>(<Macros>getGame().macros).getName(macroName);

          macro.execute({ actor: <Actor>interactorToken.actor, token: interactorToken });
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
