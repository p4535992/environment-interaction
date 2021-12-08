import { debug, error, i18n } from '../environment-interaction-main';
import { ContestedRoll } from '../lib/tokenbarapi/ContestedRoll';
import { EnvironmentInteractionNote } from './environment-interaction-note';
import { EnvironmentInteraction } from './environment-interaction';
import { Flags } from './environment-interaction-models';
import { getCanvas, getGame, moduleName } from './settings';
import { MonkTokenBarMessageOptions, MonkTokenBarMessageRequestoption } from '../lib/tokenbarapi/MonksTokenBarAPI';
import { executeEIMacro } from './environment-interaction-utils';

export const readyHooks = async () => {
  // Register hook callbacks
  // @ts-ignore
  getGame().EnvironmentInteraction.registerHooks();

  Hooks.on('tokenBarUpdateRoll', (tokenBarApp: ContestedRoll | Roll, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
    // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
    const interactToken = <Token>getCanvas().tokens?.get(updateId);
    const monkTokenBarDetail = <MonkTokenBarMessageOptions>(<any>message.data.flags['monks-tokenbar'])?.options;
    
    const actorId = <string>getCanvas().tokens?.controlled[0].data.actorId;
    const currentActor = <Actor>getGame().actors?.get(actorId);
    const interactActor = <Actor>getGame().actors?.get(<string>interactToken.data.actorId);

    // const itemRef:HTMLElement|undefined = $(message.data.content).find('.item').length > 0
    //   ? <HTMLElement>$(message.data.content).find('.item')[0]
    //   : undefined;
    // const itemId = <string>$((<HTMLElement>itemRef).outerHTML).attr('data-item-id');

    const dc = <number>monkTokenBarDetail.dc;
    const total = <number>msgtokenRoll?.total;
    const itemId = monkTokenBarDetail.flavor;

    // TODO find a better method this is ugly
    let currentItem;
    getCanvas().tokens?.placeables.find((token: Token) => {
      const actor = <Actor>getGame().actors?.find((actor: Actor) => {
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

  // Hooks.on('forceUpdateTokenActionHUD', (args) => {
  //   const checkout = args;
  // });

  /*
  Hooks.on('renderChatMessage', async (message: ChatMessage, html: JQuery<HTMLElement>, speakerInfo) => {
    if(!message.roll){
      return;
    }
    const scene = getGame().scenes?.find((scene:Scene) =>{
      return scene.id == speakerInfo.message.speaker.scene;
    });
    const actor = getGame().actors?.find((actor:Actor) =>{
      return actor.id == speakerInfo.message.speaker.actor;
    });
    const token = getCanvas().tokens?.placeables.find((token:Token) =>{
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
    getCanvas().tokens?.placeables.find((token: Token) => {
      const actor = <Actor>getGame().actors?.find((actor: Actor) => {
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
    const isgm = getGame().user?.isGM;
    if (!isgm) {
      const actorEntity = <Actor>getGame().actors?.get(actorObject.actor._id);
      // <li class="item context-enabled" data-item-id="crr7HgNpCvoWNL3D" draggable="true">
      const list = htmlElement.find('li.item');
      for (const li of list) {
        const li2 = $(li);
        const itemId = li2.attr('data-item-id');
        const item = actorEntity.items?.find((item: Item) => {
          return item && item.id == itemId;
        });
        if (item?.getFlag(moduleName, Flags.notes)) {
          li2.hide();
        }
      }
    } else {
      //
    }
  });

  Hooks.on('renderItemSheet', (app, html, data) => {
    EnvironmentInteractionNote._initEntityHook(app, html, data);
  });

  // //@ts-ignore
  // Item.prototype.hasEIMacro = function () {
  //   return !!this.getFlag(moduleName, Flags.notes)?.data?.command;
  // };
  // //@ts-ignore
  // Item.prototype.executeEIMacro = function (...args) {
  //   if (!this.hasEIMacro()) {
  //     return;
  //   }
  //   // switch(this.getMacro().data.type){
  //   //   case "chat" :
  //   //     //left open if chat macros ever become a thing you would want to do inside an item?
  //   //     break;
  //   // case "script" :
  //   return this._executeEIScript(...args);
  //   // }
  // };
  // //@ts-ignore
  // Item.prototype._executeEIScript = function (macroFlag:string, ...args) {
  //   //add variable to the evaluation of the script
  //   const item = <Item>this;
  //   const macro = <Macro>item.getFlag(moduleName, macroFlag);
  //   const speaker = ChatMessage.getSpeaker({ actor: <Actor>item.actor });
  //   const actor = item.actor ?? getGame().actors?.get(<string>speaker.actor);
  //   const token = item.actor?.token ?? getCanvas().tokens?.get(<string>speaker.token);
  //   const character = getGame().user?.character;
  //   const event = getEvent();

  //   debug(macro);
  //   debug(speaker);
  //   debug(actor);
  //   debug(token);
  //   debug(character);
  //   debug(item);
  //   debug(event);
  //   debug(args);

  //   //build script execution
  //   const body = `(async ()=>{
  //     ${macro.data.command}
  //   })();`;
  //   const fn = Function('item', 'speaker', 'actor', 'token', 'character', 'event', 'args', body);

  //   //attempt script execution
  //   try {
  //     fn.call(macro, item, speaker, actor, token, character, event, args);
  //   } catch (err) {
  //     ui.notifications?.error(i18n(`${moduleName}.macroExecution`));
  //     error(err);
  //   }

  //   function getEvent() {
  //     const a = args[0];
  //     if (a instanceof Event) return args[0].shift();
  //     if (a?.originalEvent instanceof Event) return args.shift().originalEvent;
  //     return undefined;
  //   }
  // };
};

export const initHooks = async () => {
  // Open module API
  // @ts-ignore
  getGame().EnvironmentInteraction = EnvironmentInteraction;

  // Register settings
  // @ts-ignore
  // getGame().EnvironmentInteraction.registerSettings();

  // Register Handlebars helpers
  // @ts-ignore
  // getGame().EnvironmentInteraction.registerHandlebarsHelpers();
};

export const setupHooks = async () => {
  // Do anything after initialization but before ready
  // Register wrappers
  // @ts-ignore
  getGame().EnvironmentInteraction.registerWrappers();
};

/*
export const setupTinyMCEEditor = function () {
  // Add custom stylesheet to TinyMCE Config
  //@ts-ignore
  CONFIG.TinyMCE.content_css.push(`/modules/${moduleName}/styles/environment-interaction-secret.css`);
  if (getGame().user?.isGM) {
    // Add GM Secret section type
    //@ts-ignore
    const customFormats = CONFIG.TinyMCE.style_formats.find((x) => x.title === 'Custom');
    //@ts-ignore
    customFormats.items.push({
      title: 'GM Secret',
      block: 'section',
      classes: 'secret gm-secret',
      wrapper: true,
    });

    // If the user is a GM, add a unique class to the body of the document so that we can selectively hide content when this class doesn't exist.
    $('body').addClass('game-master');
  }
};

// Wrap TextEditor.create to add the appropriate class to the created editor
export const textEditorCreateHandler = function (wrapped, ...args) {
  // const oldCreate = TextEditor.create;
  // const editor = await oldCreate.apply(this, arguments);
  const editor = this as any;
  // If the user is a GM, add the "game-master" class to the tinyMCE iframe body.
  if (getGame().user?.isGM) {
    editor.dom.addClass('tinymce', 'game-master');
  }

  return editor;
  // return wrapped(...args);
};

// Wrap TextEditor.enrichHTML to remove GM secret sections if the user is not a GM
export const textEditorEnrichHTMLHandler = function (wrapped, ...args) {
  // const oldEnrichHTML = TextEditor.enrichHTML;
  // const content = oldEnrichHTML.apply(this, arguments);
  const content = this as string;
  const html = document.createElement('div');
  html.innerHTML = content;

  if (!getGame().user?.isGM) {
    const elements: NodeListOf<Element> = html.querySelectorAll('section.gm-secret');
    elements.forEach((e) => e?.parentNode?.removeChild(e));
  }
  return html.innerHTML;
  // return wrapped(...args);
};
*/
