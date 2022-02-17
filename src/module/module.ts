import { debug, error, i18n } from '../eim-main';
import { ContestedRoll } from './lib/tokenbarapi/ContestedRoll';
import { EnvironmentInteractionNote } from './eim-note';
import { EnvironmentInteraction } from './eim';
import { customInfoEnvironmentInteraction, Flags } from './eim-models';
import { moduleName } from './settings';
import { canvas, game } from './settings';
import { MonkTokenBarMessageOptions, MonkTokenBarMessageRequestoption } from './lib/tokenbarapi/MonksTokenBarAPI';
import { executeEIMacro } from './eim-utils';
import { EnvironmentInteractionPlaceableConfig } from './eim-paceable-config';

let currentContestedRollTokenBar = NaN;

export const initHooks = async () => {
  // Open module API
  // @ts-ignore
  game.EnvironmentInteraction = EnvironmentInteraction;
  // @ts-ignore
  game.EnvironmentInteraction.EnvironmentInteractionPlaceableConfig = EnvironmentInteractionPlaceableConfig;

  // Register settings
  // @ts-ignore
  // game.EnvironmentInteraction.registerSettings();

  // Register Handlebars helpers
  // @ts-ignore
  // game.EnvironmentInteraction.registerHandlebarsHelpers();
  Handlebars.registerHelper('checkedIf', function (condition) {
    return condition ? 'checked' : '';
  });

  if (game.modules.get('acelib')?.active) {
    // Loading acelib module
    //@ts-ignore
    ['ace/mode/json', 'ace/ext/language_tools', 'ace/ext/error_marker', 'ace/theme/twilight', 'ace/snippets/json'].forEach((s) => ace.config.loadModule(s));
  }
};

export const setupHooks = async () => {
  // Do anything after initialization but before ready
  // Register wrappers
  // @ts-ignore
  // game.EnvironmentInteraction.registerWrappers();

  // Alter mouse interaction for tokens flagged as environment

  // ====================
  // TOKEN
  // ====================

  //@ts-ignore
  libWrapper.register(
    moduleName,
    'CONFIG.Token.objectClass.prototype._canView',
    //@ts-ignore
    game.EnvironmentInteraction._canViewToken,
    'MIXED',
  );

  //@ts-ignore
  libWrapper.register(
    moduleName,
    'CONFIG.Token.objectClass.prototype._onClickLeft',
    //@ts-ignore
    game.EnvironmentInteraction._onClickLeftToken,
    'MIXED',
  );
  //@ts-ignore
  libWrapper.register(
    moduleName,
    'CONFIG.Token.objectClass.prototype._onClickLeft2',
    //@ts-ignore
    game.EnvironmentInteraction._onClickLeft2Token,
    'MIXED',
  );

  // =======================
  // WALL/DOOR
  // =======================

  //@ts-ignore
  libWrapper.register(
    moduleName,
    'DoorControl.prototype._onMouseDown',
    //@ts-ignore
    game.EnvironmentInteraction._DoorControlPrototypeOnMouseDownHandler,
    'MIXED',
  );

  // //@ts-ignore
  // libWrapper.register(
  //   moduleName,
  //   'CONFIG.Wall.objectClass.prototype._onClickLeft',
  //   //@ts-ignore
  //   game.EnvironmentInteraction._onClickLeftWall,
  //   'MIXED',
  // );

  // //@ts-ignore
  // libWrapper.register(
  //   moduleName,
  //   'CONFIG.Wall.objectClass.prototype._onClickLeft2',
  //   //@ts-ignore
  //   game.EnvironmentInteraction._onClickLeft2Wall,
  //   'MIXED',
  // );

  // ========================
  // NOTE/JOURNAL
  // ========================

  //@ts-ignore
  libWrapper.register(
    moduleName,
    'Note.prototype._onClickLeft',
    //@ts-ignore
    game.EnvironmentInteraction._NotePrototypeOnClickLeftHandler,
    'MIXED',
  );

  //@ts-ignore
  libWrapper.register(
    moduleName,
    'Note.prototype._onClickLeft2',
    //@ts-ignore
    game.EnvironmentInteraction._NotePrototypeOnClickLeftHandler,
    'MIXED',
  );
};

export const readyHooks = async () => {
  // Register hook callbacks
  // @ts-ignore
  game.EnvironmentInteraction.EnvironmentInteractionPlaceableConfig.registerHooks();

  Hooks.on('tokenBarUpdateRoll', (tokenBarApp: ContestedRoll | Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
    // tokenBarApp can be any app of token bar moduel e.g. SavingThrow

    const customInfo = <customInfoEnvironmentInteraction>(<any>message.data.flags['monks-tokenbar'])?.options?.ei;

    const interactorTokenTokenBar = <Token>canvas.tokens?.get(updateId);

    const total = <number>msgtokenRoll?.total;

    const environmentItemId = customInfo.environmentItemID;
    const environmentActorId = customInfo.environmentActorID;
    const environmentActor = <Actor>game.actors?.get(environmentActorId);
    const environmentTokenId = customInfo.environmentTokenID;
    const environmentToken = <Token>canvas.tokens?.get(environmentTokenId);

    let dc = customInfo.environmentDC;

    const interactorItemId = customInfo.interactorItemID;
    const interactorActorId = customInfo.interactorActorID;
    const interactorActor = <Actor>game.actors?.get(interactorActorId);
    const interactorTokenId = customInfo.interactorTokenID;
    const interactorToken = <Token>canvas.tokens?.get(interactorTokenId);

    const isInteractor = interactorTokenTokenBar.id == interactorTokenId;
    // This work because the interactor is the last one called ??
    if (isInteractor) {
      const environmentItem = <Item>environmentActor.items.find((item: Item) => {
        return item.id == environmentItemId;
      });

      if (environmentItem) {
        // if (dc == null || dc == undefined || isNaN(dc)) {
        if (currentContestedRollTokenBar != null && currentContestedRollTokenBar != undefined && !isNaN(currentContestedRollTokenBar)) {
          dc = currentContestedRollTokenBar;
        }
        // }
        if (dc != null && dc != undefined && !isNaN(dc)) {
          if (total >= dc) {
            executeEIMacro(environmentItem, Flags.notessuccess);
          } else {
            executeEIMacro(environmentItem, Flags.notesfailure);
          }
        } else {
          const macroSuccess = environmentItem?.getFlag(moduleName, Flags.notessuccess);
          // const macroFailure = environmentItem?.getFlag(moduleName, Flags.notesfailure);
          if (macroSuccess) {
            executeEIMacro(environmentItem, Flags.notessuccess);
          }
        }
      } else {
        ui.notifications?.error(moduleName + " | Can't retrieve original item");
        throw new Error(moduleName + " | Can't retrieve original item");
      }
      currentContestedRollTokenBar = NaN;
    } else {
      currentContestedRollTokenBar = total;
    }
  });

  // Hooks.on('forceUpdateTokenActionHUD', (args) => {
  //   const checkout = args;
  // });

  /*
  Hooks.on('renderChatMessage', async (message: ChatMessage, html: JQuery<HTMLElement>, speakerInfo) => {
    if(!message.roll){
      return;
    }
    const scene = game.scenes?.find((scene:Scene) =>{
      return scene.id == speakerInfo.message.speaker.scene;
    });
    const actor = game.actors?.find((actor:Actor) =>{
      return actor.id == speakerInfo.message.speaker.actor;
    });
    const token = canvas.tokens?.placeables.find((token:Token) =>{
      return token.id == speakerInfo.message.speaker.token;
    });
    const alias = speakerInfo.message.speaker.alias;

    const totalRef:HTMLElement|undefined = $(message.data.content).find('.part-total').length > 0
      ? <HTMLElement>$(message.data.content).find('.part-total')[0]
      : undefined;

    const dc = 0;
    const total = 0;
    const itemId = '';

    // TODO find a better method this is ugly
    let currentItem;
    canvas.tokens?.placeables.find((token: Token) => {
      const actor = <Actor>game.actors?.find((actor: Actor) => {
        return token.data.actorId == actor.id;
      });
      if (actor) {
        currentItem = actor.items.find((item: Item) => {
          return item.id == itemId;
        });
        if (currentItem) {
          return currentItem;
        }
      }
    });
    // const currentItem = <Item>interactActor.items.find((item:Item) =>{
    //   return item.id == itemId;
    // });
    if (currentItem) {
      if (dc != null && dc != undefined && !isNaN(dc)) {
        if (total >= dc) {
          executeEIMacro(currentItem, Flags.notessuccess);
        } else {
          executeEIMacro(currentItem, Flags.notesfailure);
        }
      } else {
        const macroSuccess = currentItem?.getFlag(moduleName, Flags.notessuccess);
        const macroFailure = currentItem?.getFlag(moduleName, Flags.notesfailure);
        if (macroFailure) {
          executeEIMacro(currentItem, Flags.notesfailure);
        }
      }
    }else{
      ui.notifications?.error(moduleName + ' | Can\'t retrieve original item');
      throw new Error(moduleName + ' | Can\'t retrieve original item');
    }
  });
  */

  /*
  setupTinyMCEEditor();
  //@ts-ignore
  libWrapper.register(moduleName, 'TextEditor.enrichHTML', textEditorEnrichHTMLHandler, 'MIXED');
  //@ts-ignore
  libWrapper.register(moduleName, 'TextEditor.create', textEditorCreateHandler, 'MIXED');
  */

  Hooks.on('renderActorSheet', async function (actorSheet: ActorSheet, htmlElement: JQuery<HTMLElement>, actorObject: any) {
    const isgm = game.user?.isGM;
    if (!isgm) {
      const actorEntity = <Actor>game.actors?.get(actorObject.actor._id);
      if (actorEntity) {
        // <li class="item context-enabled" data-item-id="crr7HgNpCvoWNL3D" draggable="true">
        const list = htmlElement.find('li.item');
        for (const li of list) {
          const liOnInventory = $(li);
          const itemId = liOnInventory.attr('data-item-id');
          const item = actorEntity.items?.find((item: Item) => {
            return item && item.id == itemId;
          });
          if (item?.getFlag(moduleName, Flags.notesuseei)) {
            liOnInventory.hide();
          }
        }
      }
    } else {
      const actorEntity = <Actor>game.actors?.get(actorObject.actor._id);
      if (actorEntity) {
        // <li class="item context-enabled" data-item-id="crr7HgNpCvoWNL3D" draggable="true">
        const list = htmlElement.find('li.item');
        for (const li of list) {
          const liOnInventory = $(li);
          const itemId = liOnInventory.attr('data-item-id');
          const item = actorEntity.items?.find((item: Item) => {
            return item && item.id == itemId;
          });
          if (item?.getFlag(moduleName, Flags.notesuseei)) {
            liOnInventory.css('background', 'rgba(233, 103, 28, 0.2)');
          }
        }
      }
    }
  });

  Hooks.on('renderItemSheet', (app, html, data) => {
    // Activate only for item in a actor
    // TODO we really need this ???
    //if (app?.actor?.id) {
    EnvironmentInteractionNote._initEntityHook(app, html, data);
    // }
  });

  // =============================
  // TRIGGER HAPPY INTEGRATION
  // =============================

  // const triggerHappy = game.modules.get("trigger-happy");
  // TriggerHappyEim.setTriggerHappyActive(triggerHappy != undefined && triggerHappy.active == true)

  // Hooks.on('controlToken',(token,controlled) =>  {
  //   TriggerHappyEim.triggerHappy_ControlToken(token,controlled);
  // });
  // Hooks.on('preUpdateToken',(scene, embedded, update) =>  {
  //   TriggerHappyEim.triggerHappy_onPreUpdateToken(scene, embedded, update, undefined, <string>game.userId)
  // });
};
