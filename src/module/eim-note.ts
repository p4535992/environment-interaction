import { executeEIMacro, executeEIMacroContent } from './eim-utils';
import { field } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/fields.mjs';
import { i18n } from '../eim-main';
import { Flags } from './eim-models';
import { getGame, moduleName } from './settings';
export class EnvironmentInteractionNote extends FormApplication {
  constructor(object, options) {
    super(object, options);
    //@ts-ignore
    this.entity.apps[this.appId] = this;
  }

  get entity(): any {
    return this.object;
  }

  editor;
  editorCondition;
  editorSuccess;
  editorFailure;

  // get editorCondition(): any {
  //   //@ts-ignore
  //   return ace.edit(`macroEditor-${this.entity.id}-${Flags.notescondition}`);
  // }

  // get editorSuccess(): any {
  //   //@ts-ignore
  //   return ace.edit(`macroEditor-${this.entity.id}-${Flags.notessuccess}`);
  // }

  // get editorFailure(): any {
  //   //@ts-ignore
  //   return ace.edit(`macroEditor-${this.entity.id}-${Flags.notesfailure}`);
  // }

  // get showExtraButtons() {
  //     return (getGame().dnd5e && this.entity.constructor.name !== 'RollTable');
  // }

  static get defaultOptions() {
    const options = <any>super.defaultOptions;
    options.template = `modules/${moduleName}/templates/interaction-note.hbs`;
    options.width = '600';
    options.height = '700';
    options.classes = ['macro-sheet', 'sheet']; // 'macro-sheet''environment-interaction-notes'
    options.title = i18n(`${moduleName}.note.label`);
    options.resizable = true;
    options.editable = true;
    return options;
  }

  getData() {
    const data = <any>super.getData();

    data.notes = this.entity.getFlag(moduleName, Flags.notes);
    data.flags = this.entity.data.flags;
    data.owner = getGame().user?.id;
    data.isGM = getGame().user?.isGM;
    data.img = this.entity.img;
    data.name = this.entity.name;
    data.id = this.entity.id;
    // data.showExtraButtons = this.showExtraButtons;

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // html.find('.moveToNote').click(ev => this._moveToNotes());
    // html.find('.moveToDescription').click(ev => this._moveToDescription());
    // html.find('.ei-info').click((ev) => this._showInfo());

    if (getGame().modules.get('acelib')?.active) {
      // if (this._retrieveVal($(html), Flags.notesuseasmacro)) {
      this.editor = this._addAceLibEditorToElement(html, `div.form-group.stacked.command.${Flags.notes}`, this.entity.id, Flags.notes);
      // } else {
      // TODO HIDE notes-args element...
      //html.find('.ei-info')
      // }

      this.editorCondition = this._addAceLibEditorToElement(
        html,
        `div.form-group.stacked.command.${Flags.notescondition}`,
        this.entity.id,
        Flags.notescondition, //"flags.environment-interaction.notes-condition",
      );

      this.editorSuccess = this._addAceLibEditorToElement(
        html,
        `div.form-group.stacked.command.${Flags.notessuccess}`,
        this.entity.id,
        Flags.notessuccess, //"flags.environment-interaction.notes-success",
      );

      this.editorFailure = this._addAceLibEditorToElement(
        html,
        `div.form-group.stacked.command.${Flags.notesfailure}`,
        this.entity.id,
        Flags.notesfailure, //"flags.environment-interaction.notes-failure",
      );
    }

    //html.find('[data-toggle="tooltip"]').tooltip();
  }

  _addAceLibEditorToElement(html, entityClassName, entityFieldId, flagRef): any {
    const entityFieldName = `flags.${moduleName}.${flagRef}`;
    const flagArgs = `flags.${moduleName}.${flagRef}-args`;
    /** @type {JQuery} */
    const configElement = $(html);
    configElement
      //.find("div.form-group.stacked.command.condition")
      .find(entityClassName).append(`<button type="button" class="ei-macro-editor-expand ei-macro-editor-expand-${entityFieldId}-${flagRef}" title="Expand Editor"><i class="fas fa-expand-alt"></i></button>
        <div class="ei-macro-editor ei-macro-editor-${entityFieldId}-${flagRef}" id="macroEditor-${entityFieldId}-${flagRef}"></div>`);
    //if (game.settings.get("macroeditor", "defaultShow")) {
    configElement.find(`.command textarea[name="${entityFieldName}"]`).css('display', 'none');

    // furnace compat
    const furnace = configElement.find('div.furnace-macro-command');
    if (furnace.length !== 0) {
      furnace.css('display', 'none');
    }
    // } else {
    //   configElement.find(".ei-macro-editor").css("display", "none");
    //   configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).css("display", "none");
    // }

    configElement
      //.find(".sheet-footer")
      .find(`div.form-group.stacked.command.${flagRef}`)
      // .append(`<input type="text" class="ei-macro-execute-args-button-${entityFieldId}-${flagArgs}" title="Additional args for macro" name="flags.${moduleName}.${flagArgs}"
      //   placeHolder="Additional args e.g.'arg0,arg1,ecc.' on the macro are recovered from args[0],args[1],ecc."></input>`)
      .append(`<button type="button" class="ei-macro-editor-button-${entityFieldId}-${flagRef}" title="Toggle Code Editor" name="editorButton"><i class="fas fa-terminal"></i></button>`)
      .append(`<button type="button" class="ei-macro-execute-button-${entityFieldId}-${flagRef}" title="Execute Macro" name="executeButton"><i class="fas fa-running"></i></button>`);

    //@ts-ignore
    const editorElement = ace.edit(`macroEditor-${entityFieldId}-${flagRef}`);

    editorElement.session.on('changeMode', function (e, session) {
      if ('ace/mode/javascript' === session.getMode().$id) {
        if (session.$worker) {
          session.$worker.send('setOptions', [
            {
              esversion: 9,
              esnext: false,
            },
          ]);
        }
      }
    });

    // Merge ace-lib user-settings with module settings
    editorElement.setOptions(
      //@ts-ignore
      mergeObject(ace.userSettings, {
        mode: 'ace/mode/javascript',
        wrap: true, //getGame().settings.get(moduleName, 'acelibLineWrap'),
      }),
    );

    configElement.find(`.ei-macro-editor-button-${entityFieldId}-${flagRef}`).on('click', (event) => {
      event.preventDefault();
      if (configElement.find(`.ei-macro-editor-${entityFieldId}-${flagRef}`).css('display') == 'none') {
        configElement.find(`.command textarea[name="${entityFieldName}"]`).css('display', 'none');
        configElement.find(`.ei-macro-editor-${entityFieldId}-${flagRef}`).css('display', '');
        configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).css('display', '');
        editorElement.setValue(configElement.find(`.command textarea[name="${entityFieldName}"]`).val(), -1);

        // furnace compat
        const furnace = configElement.find('div.furnace-macro-command');
        if (furnace.length !== 0) {
          furnace.css('display', 'none');
        }
      } else {
        configElement.find(`.command textarea[name="${entityFieldName}"]`).css('display', '');
        configElement.find(`.ei-macro-editor-${entityFieldId}-${flagRef}`).css('display', 'none');
        configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).css('display', 'none');

        // furnace compat
        const furnace = configElement.find('div.furnace-macro-command');
        if (furnace.length !== 0) {
          furnace.css('display', '');
          furnace.trigger('change');
        }
      }
    });

    configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).on('click', (event) => {
      event.preventDefault();
      if (configElement.find(`.ei-macro-editor-${entityFieldId}-${flagRef}`).hasClass('fullscreen')) {
        configElement.find(`.ei-macro-editor-${entityFieldId}-${flagRef}`).removeClass('fullscreen');
        configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).removeClass('fullscreen');
        configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).prop('title', 'Expand Editor');
        configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef} i.fas.fa-compress-alt`).attr('class', 'fas fa-expand-alt');
        // configElement.find('.window-resizable-handle').css('display', '');
        // configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).css("display", "");
        configElement.find(`.ei-macro-editor-expand`).css('display', '');
      } else {
        configElement.find(`.ei-macro-editor-${entityFieldId}-${flagRef}`).addClass('fullscreen');
        configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).addClass('fullscreen');
        configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).prop('title', 'Shrink Editor');
        configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef} i.fas.fa-expand-alt`).attr('class', 'fas fa-compress-alt');
        // configElement.find('.window-resizable-handle').css('display', 'none');
        // configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).css("display", "none");
        configElement.find(`.ei-macro-editor-expand`).css('display', 'none');
        configElement.find(`.ei-macro-editor-expand-${entityFieldId}-${flagRef}`).css('display', '');
      }
    });

    editorElement.setValue(configElement.find(`textarea[name="${entityFieldName}"]`).val(), -1);

    editorElement.getSession().on('change', () => {
      configElement.find(`textarea[name="${entityFieldName}"]`).val(editorElement.getSession().getValue());
    });

    // editor.commands.addCommand({
    //   name: "Save",
    //   bindKey: { win: "Ctrl-S", mac: "Command-S" },
    //   exec: () => configElement.find("form.editable").trigger("submit"),
    // });

    // editor.commands.addCommand({
    //   name: "Execute",
    //   bindKey: { win: "Ctrl-E", mac: "Command-E" },
    //   exec: () => configElement.find("button.execute").trigger("click"),
    // });

    configElement.find(`.ei-macro-execute-button-${entityFieldId}-${flagRef}`).on('click', (event) => {
      event.preventDefault();

      let args: string[] = [];
      const contentLabel = this._retrieveVal(configElement, flagArgs);
      //<string>configElement.find(`input[name="${flagArgs}"]`).val();
      if (contentLabel) {
        args = <string[]>contentLabel.split(',');
      }
      const macroContent: string = this._retrieveVal(configElement, entityFieldName);
      //this._updateObjectForExcecuteMacro(event,this.entity,configElement);
      // if(macroContent){
      //   if (macroContent?.startsWith('return')) {
      //     //macroContent = 'return ' + macroContent;
      //     macroContent = macroContent.substring(6,macroContent.length);
      //   }
      //   if (!macroContent?.startsWith('alert')) {
      //     macroContent = 'alert(' + macroContent + ')';
      //   }
      // }
      executeEIMacroContent(<Item>this.entity, macroContent, args);
    });

    // watch for resizing of editor
    new ResizeObserver(() => {
      editorElement.resize();
      editorElement.renderer.updateFull();
    }).observe(editorElement.container);

    //createMacroConfigHook(macroConfig.id, editor);
    return editorElement;
  }

  // _showInfo() {
  //   let content = this.entity.getFlag(moduleName, Flags.notesinfo);
  //   if(!content){
  //     content = 'No info provided';
  //   }
  //   const d = new Dialog({
  //     title: this.entity.data.name,
  //     content: content,
  //     buttons: {},
  //     default: '',
  //     render: (html) => {
  //       //$(".ei.info").parent().next().addClass(".customcss");
  //     },
  //     close: (html) => {
  //       console.log('Conferma finestra chiusa');
  //     },
  //   });
  //   d.render(true);
  // }

  async _updateObject(event, formData) {
    if (getGame().user?.isGM) {
      const useei = formData[`flags.${moduleName}.${Flags.notesuseei}`];
      if (useei != null && useei != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesuseei, useei);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesuseei, null);
      }

      const useitemmacro = formData[`flags.${moduleName}.${Flags.notesuseitemmacro}`];
      if (useitemmacro != null && useitemmacro != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesuseitemmacro, useitemmacro);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesuseitemmacro, null);
      }

      const useitemenvironment = formData[`flags.${moduleName}.${Flags.notesuseitemenvironment}`];
      if (useitemenvironment != null && useitemenvironment != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesuseitemenvironment, useitemenvironment);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesuseitemenvironment, null);
      }

      const useasmacro = formData[`flags.${moduleName}.${Flags.notesuseasmacro}`];
      if (useasmacro != null && useasmacro != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesuseasmacro, useasmacro);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesuseasmacro, null);
      }

      const detail = formData[`flags.${moduleName}.${Flags.notesdetail}`];
      if (detail != null && detail != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesdetail, detail);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesdetail, null);
      }

      const info = formData[`flags.${moduleName}.${Flags.notesinfo}`];
      if (info != null && info != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesinfo, info);
      } else {
        // await this.entity.setFlag(moduleName, Flags.notesinfo, null);
      }

      const explicitdc = formData[`flags.${moduleName}.${Flags.notesexplicitdc}`];
      if (explicitdc != null && explicitdc != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesexplicitdc, explicitdc);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesexplicitdc, null);
      }

      const notes = formData[`flags.${moduleName}.${Flags.notes}`];
      if (notes != null && notes != undefined) {
        if (useasmacro) {
          let macroUseAsMacro = notes;
          if (!macroUseAsMacro?.startsWith('return')) {
            macroUseAsMacro = 'return ' + macroUseAsMacro;
          }
          await this.entity.setFlag(moduleName, Flags.notes, macroUseAsMacro);
        } else {
          await this.entity.setFlag(moduleName, Flags.notes, notes);
        }
      } else {
        await this.entity.setFlag(moduleName, Flags.notes, null);
      }

      const notesargs = formData[`flags.${moduleName}.${Flags.notesargs}`];
      if (notesargs != null && notesargs != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesargs, notesargs);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesargs, null);
      }

      const notescondition = formData[`flags.${moduleName}.${Flags.notescondition}`];
      if (notescondition != null && notescondition != undefined) {
        let macroCondition = notescondition;
        if (!macroCondition?.startsWith('return')) {
          macroCondition = 'return ' + macroCondition;
        }
        await this.entity.setFlag(moduleName, Flags.notescondition, macroCondition);
      } else {
        await this.entity.setFlag(moduleName, Flags.notescondition, null);
      }

      const notesconditionargs = formData[`flags.${moduleName}.${Flags.notesconditionargs}`];
      if (notesconditionargs != null && notesconditionargs != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesconditionargs, notesconditionargs);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesconditionargs, null);
      }

      const notessuccess = formData[`flags.${moduleName}.${Flags.notessuccess}`];
      if (notessuccess != null && notessuccess != undefined) {
        await this.entity.setFlag(moduleName, Flags.notessuccess, notessuccess);
      } else {
        await this.entity.setFlag(moduleName, Flags.notessuccess, null);
      }

      const notessuccessargs = formData[`flags.${moduleName}.${Flags.notessuccessargs}`];
      if (notessuccessargs != null && notessuccessargs != undefined) {
        await this.entity.setFlag(moduleName, Flags.notessuccessargs, notessuccessargs);
      } else {
        await this.entity.setFlag(moduleName, Flags.notessuccessargs, null);
      }

      const notesfailure = formData[`flags.${moduleName}.${Flags.notesfailure}`];
      if (notesfailure != null && notesfailure != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesfailure, notesfailure);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesfailure, null);
      }

      const notesfailureargs = formData[`flags.${moduleName}.${Flags.notesfailureargs}`];
      if (notesfailureargs != null && notesfailureargs != undefined) {
        await this.entity.setFlag(moduleName, Flags.notesfailureargs, notesfailureargs);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesfailureargs, null);
      }

      this.render();
    } else {
      ui.notifications?.error('You have to be GM to edit Environment Interaction Notes.');
    }
  }

  _retrieveVal(configElement, flagname) {
    return configElement.find(`[name="${flagname}"]`).val();
  }

  // async _updateObjectForExcecuteMacro(event, entity, configElement) {
  //   if (getGame().user?.isGM) {
  //     // if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesuseei}`)) {
  //     //   await entity.setFlag(moduleName, Flags.notesuseei, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesuseei}`));
  //     // } else {
  //     //   await entity.setFlag(moduleName, Flags.notesuseei, null);
  //     // }

  //     // if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesuseitemmacro}`)) {
  //     //   await entity.setFlag(moduleName, Flags.notesuseitemmacro, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesuseitemmacro}`));
  //     // } else {
  //     //   await entity.setFlag(moduleName, Flags.notesuseitemmacro, null);
  //     // }

  //     // if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesuseitemenvironment}`)) {
  //     //   await entity.setFlag(moduleName, Flags.notesuseitemenvironment, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesuseitemenvironment}`));
  //     // } else {
  //     //   await entity.setFlag(moduleName, Flags.notesuseitemenvironment, null);
  //     // }

  //     // if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesdetail}`)) {
  //     //   await entity.setFlag(moduleName, Flags.notesdetail, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesdetail}`));
  //     // } else {
  //     //   await entity.setFlag(moduleName, Flags.notesdetail, null);
  //     // }

  //     // if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesinfo}`)) {
  //     //   await entity.setFlag(moduleName, Flags.notesinfo, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesinfo}`));
  //     // } else {
  //     //   await entity.setFlag(moduleName, Flags.notesinfo, null);
  //     // }

  //     // if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notes}`)) {
  //     //   await entity.setFlag(moduleName, Flags.notes, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notes}`));
  //     // } else {
  //     //   await entity.setFlag(moduleName, Flags.notes, null);
  //     // }

  //     if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notescondition}`)) {
  //       let macroCondition = this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notescondition}`);
  //       if (!macroCondition?.startsWith('return')) {
  //         macroCondition = 'return ' + macroCondition;
  //       }
  //       await entity.setFlag(moduleName, Flags.notescondition, macroCondition);
  //     } else {
  //       await entity.setFlag(moduleName, Flags.notescondition, null);
  //     }

  //     if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesconditionargs}`)) {
  //       // let macroCondition = this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesconditionargs}`);
  //       // if (!macroCondition?.startsWith('return')) {
  //       //   macroCondition = 'return ' + macroCondition;
  //       // }
  //       // await this.entity.setFlag(moduleName, Flags.notesconditionargs, macroCondition);
  //       await entity.setFlag(moduleName, Flags.notesconditionargs, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesconditionargs}`));
  //     } else {
  //       await entity.setFlag(moduleName, Flags.notesconditionargs, null);
  //     }

  //     if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notessuccess}`)) {
  //       await entity.setFlag(moduleName, Flags.notessuccess, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notessuccess}`));
  //     } else {
  //       await entity.setFlag(moduleName, Flags.notessuccess, null);
  //     }

  //     if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notessuccessargs}`)) {
  //       await entity.setFlag(moduleName, Flags.notessuccessargs, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notessuccess}`));
  //     } else {
  //       await entity.setFlag(moduleName, Flags.notessuccessargs, null);
  //     }

  //     if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesfailure}`)) {
  //       await entity.setFlag(moduleName, Flags.notesfailure, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesfailure}`));
  //     } else {
  //       await entity.setFlag(moduleName, Flags.notesfailure, null);
  //     }

  //     if (this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesfailureargs}`)) {
  //       await entity.setFlag(moduleName, Flags.notesfailureargs, this._retrieveVal(configElement,`flags.${moduleName}.${Flags.notesfailureargs}`));
  //     } else {
  //       await entity.setFlag(moduleName, Flags.notesfailureargs, null);
  //     }

  //     // this.render();
  //   } else {
  //     ui.notifications?.error('You have to be GM to edit Environment Interaction Notes.');
  //   }
  // }

  static _initEntityHook(app, html, data) {
    if (getGame().user?.isGM) {
      const labelTxt = '';
      const labelStyle = '';
      const title = i18n(`${moduleName}.note.label`);
      const notes = app.entity.getFlag(moduleName, Flags.notes);
      const notesuseei = app.entity.getFlag(moduleName, Flags.notesuseei);
      // if (getGame().settings.get(moduleName, 'hideLabel') === false) {
      //   labelTxt = ' ' + title;
      // }
      // if (getGame().settings.get(moduleName, 'colorLabel') === true && notes) {
      //   labelStyle = "style='color:green;'";
      // }

      // const openBtn = $(`<a class="open-environment-interaction-note" title="${title}" ${labelStyle} ><i class="fas fa-people-carry${notes ? '-check' : ''}"></i>${labelTxt}</a>`);
      let openBtn;
      if (notesuseei) {
        openBtn = $(`<a class="open-environment-interaction-note" title="${title}" ${labelStyle} >
          <i class="fas fa-people-carry"></i>${labelTxt}</a>`);
      } else {
        openBtn = $(`<a class="open-environment-interaction-note" title="${title}" ${labelStyle} >
          <i class="fas fa-hands"></i>${labelTxt}</a>`);
      }
      openBtn.click((ev) => {
        let noteApp: any = null;
        for (const key in app.entity.apps) {
          const obj = app.entity.apps[key];
          if (obj instanceof EnvironmentInteractionNote) {
            noteApp = obj;
            break;
          }
        }
        if (!noteApp) {
          noteApp = new EnvironmentInteractionNote(app.entity, { submitOnClose: true, closeOnSubmit: false, submitOnUnfocus: true });
        }
        noteApp.render(true);
      });
      html.closest('.app').find('.open-environment-interaction-note').remove();
      const titleElement = html.closest('.app').find('.window-title');
      openBtn.insertAfter(titleElement);
    }
  }

  async close() {
    super.close();
    if (this.editor) {
      this.editor.destroy();
    }
    if (this.editorCondition) {
      this.editorCondition.destroy();
    }
    if (this.editorSuccess) {
      this.editorSuccess.destroy();
    }
    if (this.editorFailure) {
      this.editorFailure.destroy();
    }
  }
}
