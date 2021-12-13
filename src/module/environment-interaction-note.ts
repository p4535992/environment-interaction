import { i18n } from '../environment-interaction-main';
import { Flags } from './environment-interaction-models';
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

  get editorCondition(): any{
    //@ts-ignore
    return ace.edit(`macroEditor-${this.entity.id}-condition`);
    //@ts-ignore
    // const editor = ace.edit(`macroEditor-${this.entity.id}`);
  }

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
    // data.showExtraButtons = this.showExtraButtons;

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // html.find('.moveToNote').click(ev => this._moveToNotes());
    // html.find('.moveToDescription').click(ev => this._moveToDescription());
    // html.find('.ei-info').click((ev) => this._showInfo());

    // ==================================
    // SET UP EDITOR FOR CONDITION
    // ===================================

    /** @type {JQuery} */
    const configElement = $(html);
    configElement
      .find("div.form-group.stacked.command.condition")
      .append(
        `<button type="button" class="ei-macro-editor-expand" title="Expand Editor"><i class="fas fa-expand-alt"></i></button><div class="ei-macro-editor" id="macroEditor-${this.entity.id}-condition"></div>`
      );
    //if (game.settings.get("macroeditor", "defaultShow")) {
      configElement.find('.command textarea[name="flags.environment-interaction.notes-condition"]').css("display", "none");

      // furnace compat
      const furnace = configElement.find("div.furnace-macro-command");
      if (furnace.length !== 0) {
        furnace.css("display", "none");
      }
    // } else {
    //   configElement.find(".ei-macro-editor").css("display", "none");
    //   configElement.find(".ei-macro-editor-expand").css("display", "none");
    // }

    configElement
      //.find(".sheet-footer")
      .find("div.form-group.stacked.command.condition")
      .append('<button type="button" class="ei-macro-editor-button" title="Toggle Code Editor" name="editorButton"><i class="fas fa-terminal"></i></button>');

    this.editorCondition.session.on("changeMode", function (e, session) {
      if ("ace/mode/javascript" === session.getMode().$id) {
        if (session.$worker) {
          session.$worker.send("setOptions", [
            {
              esversion: 9,
              esnext: false,
            },
          ]);
        }
      }
    });

    // Merge ace-lib user-settings with module settings
    this.editorCondition.setOptions(
      //@ts-ignore
      mergeObject(ace.userSettings, {
        mode: "ace/mode/javascript",
        wrap: true, //game.settings.get("macroeditor", "lineWrap"),
      })
    );

    configElement.find(".ei-macro-editor-button").on("click", (event) => {
      event.preventDefault();
      if (configElement.find(".ei-macro-editor").css("display") == "none") {
        configElement.find('.command textarea[name="flags.environment-interaction.notes-condition"]').css("display", "none");
        configElement.find(".ei-macro-editor").css("display", "");
        configElement.find(".ei-macro-editor-expand").css("display", "");
        this.editorCondition.setValue(configElement.find('.command textarea[name="flags.environment-interaction.notes-condition"]').val(), -1);

        // furnace compat
        const furnace = configElement.find("div.furnace-macro-command");
        if (furnace.length !== 0) {
          furnace.css("display", "none");
        }
      } else {
        configElement.find('.command textarea[name="flags.environment-interaction.notes-condition"]').css("display", "");
        configElement.find(".ei-macro-editor").css("display", "none");
        configElement.find(".ei-macro-editor-expand").css("display", "none");

        // furnace compat
        const furnace = configElement.find("div.furnace-macro-command");
        if (furnace.length !== 0) {
          furnace.css("display", "");
          furnace.trigger("change");
        }
      }
    });

    configElement.find(".ei-macro-editor-expand").on("click", (event) => {
      event.preventDefault();
      if (configElement.find(".ei-macro-editor").hasClass("fullscreen")) {
        configElement.find(".ei-macro-editor").removeClass("fullscreen");
        configElement.find(".ei-macro-editor-expand").removeClass("fullscreen");
        configElement.find(".ei-macro-editor-expand").prop("title", "Expand Editor");
        configElement.find(".ei-macro-editor-expand i.fas.fa-compress-alt").attr("class", "fas fa-expand-alt");
        configElement.find(".window-resizable-handle").css("display", "");
      } else {
        configElement.find(".ei-macro-editor").addClass("fullscreen");
        configElement.find(".ei-macro-editor-expand").addClass("fullscreen");
        configElement.find(".ei-macro-editor-expand").prop("title", "Shrink Editor");
        configElement.find(".ei-macro-editor-expand i.fas.fa-expand-alt").attr("class", "fas fa-compress-alt");
        configElement.find(".window-resizable-handle").css("display", "none");
      }
    });

    this.editorCondition.setValue(configElement.find('textarea[name="flags.environment-interaction.notes-condition"]').val(), -1);

    this.editorCondition.getSession().on("change", () => {
      configElement.find('textarea[name="flags.environment-interaction.notes-condition"]').val(this.editorCondition.getSession().getValue());
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

    // watch for resizing of editor
    new ResizeObserver(() => {
      this.editorCondition.resize();
      this.editorCondition.renderer.updateFull();
    }).observe(this.editorCondition.container);

    //createMacroConfigHook(macroConfig.id, editor);
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
      if (formData[`flags.${moduleName}.${Flags.notesuseei}`]) {
        await this.entity.setFlag(moduleName, Flags.notesuseei, formData[`flags.${moduleName}.${Flags.notesuseei}`]);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesuseei, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notesuseitemmacro}`]) {
        await this.entity.setFlag(moduleName, Flags.notesuseitemmacro, formData[`flags.${moduleName}.${Flags.notesuseitemmacro}`]);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesuseitemmacro, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notesuseitemenvironment}`]) {
        await this.entity.setFlag(moduleName, Flags.notesuseitemenvironment, formData[`flags.${moduleName}.${Flags.notesuseitemenvironment}`]);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesuseitemenvironment, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notesdetail}`]) {
        await this.entity.setFlag(moduleName, Flags.notesdetail, formData[`flags.${moduleName}.${Flags.notesdetail}`]);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesdetail, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notesinfo}`]) {
        await this.entity.setFlag(moduleName, Flags.notesinfo, formData[`flags.${moduleName}.${Flags.notesinfo}`]);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesinfo, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notes}`]) {
        await this.entity.setFlag(moduleName, Flags.notes, formData[`flags.${moduleName}.${Flags.notes}`]);
      } else {
        await this.entity.setFlag(moduleName, Flags.notes, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notescondition}`]) {
        let macroCondition = formData[`flags.${moduleName}.${Flags.notescondition}`];
        if (!macroCondition?.startsWith('return')) {
          macroCondition = 'return ' + macroCondition;
        }
        await this.entity.setFlag(moduleName, Flags.notescondition, macroCondition);
      } else {
        await this.entity.setFlag(moduleName, Flags.notescondition, null);
        // await this.entity.setFlag(moduleName, Flags.notesconditionmacro, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notessuccess}`]) {
        await this.entity.setFlag(moduleName, Flags.notessuccess, formData[`flags.${moduleName}.${Flags.notessuccess}`]);
      } else {
        await this.entity.setFlag(moduleName, Flags.notessuccess, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notesfailure}`]) {
        await this.entity.setFlag(moduleName, Flags.notesfailure, formData[`flags.${moduleName}.${Flags.notesfailure}`]);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesfailure, null);
      }
      this.render();
    } else {
      ui.notifications?.error('You have to be GM to edit Environment Interaction Notes.');
    }
  }

  static _initEntityHook(app, html, data) {
    if (getGame().user?.isGM) {
      let labelTxt = '';
      let labelStyle = '';
      const title = i18n(`${moduleName}.note.label`);
      const notes = app.entity.getFlag(moduleName, Flags.notes);

      if (getGame().settings.get(moduleName, 'hideLabel') === false) {
        labelTxt = ' ' + title;
      }
      if (getGame().settings.get(moduleName, 'colorLabel') === true && notes) {
        labelStyle = "style='color:green;'";
      }

      // const openBtn = $(`<a class="open-environment-interaction-note" title="${title}" ${labelStyle} ><i class="fas fa-people-carry${notes ? '-check' : ''}"></i>${labelTxt}</a>`);
      const openBtn = $(`<a class="open-environment-interaction-note" title="${title}" ${labelStyle} ><i class="fas fa-people-carry"></i>${labelTxt}</a>`);
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

  async close(){
    super.close();
    this.editorCondition.destroy();
  }
}
