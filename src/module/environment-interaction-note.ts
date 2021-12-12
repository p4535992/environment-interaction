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

  // get showExtraButtons() {
  //     return (getGame().dnd5e && this.entity.constructor.name !== 'RollTable');
  // }

  static get defaultOptions() {
    const options = <any>super.defaultOptions;
    options.template = `modules/${moduleName}/templates/interaction-note.hbs`;
    options.width = '600';
    options.height = '700';
    options.classes = ['environment-interaction-notes', 'sheet'];
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
        // CANNOT BE A MACRO THERE IS ITEM MACRO FOR THAT
        // const macro = new Macro({
        //   name: this.entity.data.name + '',
        //   type: 'script',
        //   scope: 'global',
        //   command: formData[`flags.${moduleName}.${Flags.notes}`],
        //   author: getGame().user?.id,
        // });
        // await this.entity.setFlag(moduleName, Flags.notesmacro, macro);
      } else {
        await this.entity.setFlag(moduleName, Flags.notes, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notescondition}`]) {
        let macroCondition = formData[`flags.${moduleName}.${Flags.notescondition}`];
        if (!macroCondition?.startsWith('return')) {
          macroCondition = 'return ' + macroCondition;
        }
        await this.entity.setFlag(moduleName, Flags.notescondition, macroCondition);
        // const macroCondition = new Macro({
        //   name: this.entity.data.name + ' - condition',
        //   type: 'script',
        //   scope: 'global',
        //   command: formData[`flags.${moduleName}.${Flags.notescondition}`],
        //   author: getGame().user?.id,
        // });
        // await this.entity.setFlag(moduleName, Flags.notesconditionmacro, macroCondition);
      } else {
        await this.entity.setFlag(moduleName, Flags.notescondition, null);
        // await this.entity.setFlag(moduleName, Flags.notesconditionmacro, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notessuccess}`]) {
        await this.entity.setFlag(moduleName, Flags.notessuccess, formData[`flags.${moduleName}.${Flags.notessuccess}`]);
        // const macroSuccess = new Macro({
        //   name: this.entity.data.name + ' - success',
        //   type: 'script',
        //   scope: 'global',
        //   command: formData[`flags.${moduleName}.${Flags.notessuccess}`],
        //   author: getGame().user?.id,
        // });
        // await this.entity.setFlag(moduleName, Flags.notessuccessmacro, macroSuccess);
      } else {
        await this.entity.setFlag(moduleName, Flags.notessuccess, null);
        // await this.entity.setFlag(moduleName, Flags.notessuccessmacro, null);
      }

      if (formData[`flags.${moduleName}.${Flags.notesfailure}`]) {
        await this.entity.setFlag(moduleName, Flags.notesfailure, formData[`flags.${moduleName}.${Flags.notesfailure}`]);
        // const macroFailure = new Macro({
        //   name: this.entity.data.name + ' - failure',
        //   type: 'script',
        //   scope: 'global',
        //   command: formData[`flags.${moduleName}.${Flags.notesfailure}`],
        //   author: getGame().user?.id,
        // });
        // await this.entity.setFlag(moduleName, Flags.notesfailuremacro, macroFailure);
      } else {
        await this.entity.setFlag(moduleName, Flags.notesfailure, null);
        // await this.entity.setFlag(moduleName, Flags.notesfailuremacro, null);
      }

      // await this.updateMacro(
      //   formData[`flags.${moduleName}.${Flags.notes}`],
      //   'script',
      //   ''
      // );
      // await this.updateMacro(
      //   formData[`flags.${moduleName}.${Flags.notescondition}`],
      //   'script',
      //   ' - condition'
      // );
      // await this.updateMacro(
      //   formData[`flags.${moduleName}.${Flags.notessuccess}`],
      //   'script',
      //   ' - success'
      // );
      // await this.updateMacro(
      //   formData[`flags.${moduleName}.${Flags.notesfailure}`],
      //   'script',
      //   ' - failure'
      // );
      this.render();
    } else {
      ui.notifications?.error('You have to be GM to edit Environment Interaction Notes.');
    }
  }

  // async updateMacro(mycommand, mytype, suffix:string){
  //   //@ts-ignore
  //   await this.object.setMacro(new Macro({
  //     //@ts-ignore
  //     name : this.object.data.name + suffix,
  //     type: mytype,
  //     scope : "global",
  //     command: mycommand,
  //     author : getGame().user?.id,
  //   }));
  // }

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
}
