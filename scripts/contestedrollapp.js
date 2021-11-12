export class ContestedRollApp extends Application {
  constructor(item0, item1, options = {}) {
      super(options);
      this.opts = options;

      this.item0 = item0 || {token: null, request: null};
      this.item0.token = (this.item0.token || (canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled[0] : null));
      this.item0.request = (this.item0.request || 'ability:str'); //(this.item0.request || MonksTokenBar.system.defaultContested());
      this.item1 = item1 || { token: null, request: null };
      this.item1.token = (this.item1.token || (game.user.targets.values()?.next()?.value || (canvas.tokens.controlled.length > 1 ? canvas.tokens.controlled[1] : null)));
      this.item1.request = (this.item1.request || 'ability:str'); //(this.item1.request || MonksTokenBar.system.defaultContested());

      this.rollmode = options?.rollmode || (game.user.getFlag("environment-interaction", "lastmodeCR") || 'roll');
      this.requestoptions = (options.requestoptions || MonksTokenBar.system.contestedoptions);
      this.hidenpcname = (options?.hidenpcname != undefined ? options?.hidenpcname : null) || (game.user.getFlag("environment-interaction", "lastmodeHideNPCName") != undefined ? game.user.getFlag("environment-interaction", "lastmodeHideNPCName") : null) || false;
  }

  static get defaultOptions() {
      let top = ($('#tokenbar').position()?.top || $('#hotbar').position()?.top || 300) - 260;
      return mergeObject(super.defaultOptions, {
          id: "contestedroll",
          title: i18n("environment-interaction.ContestedRoll"),
          template: "./modules/environment-interaction/templates/contested-roll-dialog.html",
          width: 450,
          height: 280,
          top: top,
          popOut: true
      });
  }

  getData(options) {
      return {
          item0: this.item0,
          item1: this.item1,
          rollmode: this.rollmode,
          options: this.requestoptions,
          hidenpcname: this.hidenpcname
      };
  }

  removeToken(e) {
      let item = $(e.currentTarget).attr('data-type');
      this[item].token = null;
      this.render(true);
  }

  async request() {
      if (this.item0.token != undefined && this.item1.token != undefined) {
          let tokens = [this.item0, this.item1].map((item, index) => {
              let parts = this['item' + index].request.split(':'); //$('.request-roll[data-type="item' + index + '"]', this.element).val().split(':');
              let requesttype = (parts.length > 1 ? parts[0] : '');
              let request = (parts.length > 1 ? parts[1] : parts[0]);
              let requestname = MonksTokenBar.getRequestName(this.requestoptions, requesttype, request);
              //let requestname = $('.request-roll[data-type="item' + index + '"] option:selected', this.element).html() + " " + (requesttype == 'ability' ? i18n("environment-interaction.AbilityCheck") : (requesttype == 'save' ? i18n("environment-interaction.SavingThrow") : i18n("environment-interaction.Check")));
              return {
                  id: item.token.id,
                  uuid: item.token.document.uuid,
                  actorid: item.token.actor.id,
                  requesttype: requesttype,
                  request: request,
                  requestname: requestname,
                  icon: (VideoHelper.hasVideoExtension(item.token.data.img) ? item.token.actor.data.img : item.token.data.img),
                  name: item.token.name,
                  showname: item.token.actor.hasPlayerOwner || this.hidenpcname !== true,
                  showtoken: item.token.actor.hasPlayerOwner || item.token.data.hidden !== true,
                  npc: item.token.actor.hasPlayerOwner,
                  passed: 'waiting'
              };
          });

          let rollmode = this.rollmode; //$('#contestedroll-rollmode', this.element).val();
          game.user.setFlag("environment-interaction", "lastmodeCR", rollmode);
          game.user.setFlag("environment-interaction", "lastmodeHideNPCName", this.hidenpcname);
          let modename = (rollmode == 'roll' ? i18n("environment-interaction.PublicRoll") : (rollmode == 'gmroll' ? i18n("environment-interaction.PrivateGMRoll") : (rollmode == 'blindroll' ? i18n("environment-interaction.BlindGMRoll") : i18n("environment-interaction.SelfRoll"))));
          let requestdata = {
              rollmode: rollmode,
              modename: modename,
              tokens: tokens,
              canGrab: ['dnd5e', 'sw5e'].includes(game.system.id),
              options: this.opts
          };
          const html = await renderTemplate("./modules/environment-interaction/templates/contestedrollchatmsg.html", requestdata);

          delete requestdata.tokens;
          delete requestdata.canGrab;
          for (let i = 0; i < tokens.length; i++)
              requestdata["token" + tokens[i].id] = tokens[i];
          //requestdata.tokens = tokens.map(t => t.id);

          log('create chat request');
          let chatData = {
              user: game.user.id,
              content: html
          };
          if (rollmode == 'selfroll')
              chatData.whisper = [game.user.id];
          else if (rollmode == 'blindroll') {
              chatData.whisper = [game.user.id];
              for (let item of [this.item0, this.item1]) {
                  if (item.token.actor != undefined) {
                      for (var key in item.token.actor.data.permission) {
                          if (key != 'default' && item.token.actor.data.permission[key] >= CONST.ENTITY_PERMISSIONS.OWNER) {
                              if (chatData.whisper.find(t => t == key) == undefined)
                                  chatData.whisper.push(key);
                          }
                      }
                  }
              }
          }
          //chatData.flags["environment-interaction"] = {"testmsg":"testing"};
          setProperty(chatData, "flags.environment-interaction", requestdata);
          ChatMessage.create(chatData, {});
          if (setting('request-roll-sound-file') != '' && rollmode != 'selfroll')
              AudioHelper.play({ src: setting('request-roll-sound-file') }, true);
          this.close();
      } else
          ui.notifications.warn(i18n("environment-interaction.RequestActorMissing"));
  }

  activateListeners(html) {
      super.activateListeners(html);

      $('.item-delete', html).click($.proxy(this.removeToken, this));

      $('.dialog-buttons.request', html).click($.proxy(this.request, this));

      $('#contestedroll-hidenpc', html).change($.proxy(function (e) {
          this.hidenpcname = $(e.currentTarget).is(':checked');
      }, this));

      $('.request-roll', html).change($.proxy(function (e) {
          this[e.target.dataset.type].request = $(e.currentTarget).val();
      }, this));
      $('#contestedroll-rollmode', html).change($.proxy(function (e) {
          this.rollmode = $(e.currentTarget).val();
      }, this));
  };
}
