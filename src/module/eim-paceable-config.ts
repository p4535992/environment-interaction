import { i18n } from './lib/lib';
import { EnvironmentInteractionFlags } from './eim-models';
import CONSTANTS from './constants';

export class EnvironmentInteractionPlaceableConfig {
  // Hooks
  static registerHooks() {
    // Add checkbox to token config to flag token as environment token
    /*
    Hooks.on('renderTokenConfig', (app, html, appData) => {
      if (!game.user?.isGM) {
        return;
      }
      const checked = app.object.getFlag(CONSTANTS.MODULE_NAME, Flags.environmentToken) ? 'checked' : '';
      const snippet = `
                <div class="form-group">
                    <label>${i18n(`${CONSTANTS.MODULE_NAME}.tokenConfig.label`)}</label>
                    <input type="checkbox" name="flags.${CONSTANTS.MODULE_NAME}.${Flags.environmentToken}" data-dtype="Boolean" ${checked} />
                </div>
            `;
      html.find(`div[data-tab="character"]`).append(snippet);
      html.css('height', 'auto');
    });
    */

    Hooks.on('renderFormApplication', EnvironmentInteractionPlaceableConfig._handleRenderFormApplication);

    Hooks.on('preUpdateActor', EnvironmentInteractionPlaceableConfig._applyEnviroments.bind(EnvironmentInteractionPlaceableConfig));
    Hooks.on('preUpdateToken', EnvironmentInteractionPlaceableConfig._applyEnviroments.bind(EnvironmentInteractionPlaceableConfig));
    Hooks.on('preUpdateTile', EnvironmentInteractionPlaceableConfig._applyEnviroments.bind(EnvironmentInteractionPlaceableConfig));
    Hooks.on('preUpdateDrawing', EnvironmentInteractionPlaceableConfig._applyEnviroments.bind(EnvironmentInteractionPlaceableConfig));
    Hooks.on('preUpdateWall', EnvironmentInteractionPlaceableConfig._applyEnviroments.bind(EnvironmentInteractionPlaceableConfig));
    Hooks.on('preUpdateLight', EnvironmentInteractionPlaceableConfig._applyEnviroments.bind(EnvironmentInteractionPlaceableConfig));
    Hooks.on('preUpdateAmbientSound', EnvironmentInteractionPlaceableConfig._applyEnviroments.bind(EnvironmentInteractionPlaceableConfig));
    Hooks.on('preUpdateMeasuredTemplate', EnvironmentInteractionPlaceableConfig._applyEnviroments.bind(EnvironmentInteractionPlaceableConfig));
    Hooks.on('preUpdateNote', EnvironmentInteractionPlaceableConfig._applyEnviroments.bind(EnvironmentInteractionPlaceableConfig));
  }

  static configHandlers = [
    { classType: TokenConfig, method: '_handleTokenConfig' },
    { classType: TileConfig, method: '_handleTileConfig' },
    { classType: DrawingConfig, method: '_handleDrawingConfig' },
    { classType: WallConfig, method: '_handleGenericConfig' },
    { classType: LightConfig, method: '_handleGenericConfig' },
    { classType: AmbientSoundConfig, method: '_handleGenericConfig' },
    { classType: MeasuredTemplateConfig, method: '_handleGenericConfig' },
    { classType: NoteConfig, method: '_handleGenericConfig' },
  ];

  static _handleRenderFormApplication(app, html) {
    const found = EnvironmentInteractionPlaceableConfig.configHandlers.find((config) => app instanceof config.classType);
    if (!found) return;
    EnvironmentInteractionPlaceableConfig[found.method](app, html, true);
  }

  static _handleTokenConfig(app, html) {
    const elem = html.find(`div[data-tab="character"]`);
    EnvironmentInteractionPlaceableConfig._applyHtml(app, elem);
  }

  static _handleTileConfig(app, html) {
    const elem = html.find(`div[data-tab="basic"]`);
    EnvironmentInteractionPlaceableConfig._applyHtml(app, elem);
  }

  static _handleDrawingConfig(app, html) {
    const elem = html.find(`div[data-tab="position"]`);
    EnvironmentInteractionPlaceableConfig._applyHtml(app, elem);
  }

  static _handleGenericConfig(app, html) {
    const elem = html.find(`button[name="submit"]`);
    EnvironmentInteractionPlaceableConfig._applyHtml(app, elem, true);
  }

  static _applyHtml(app, html, insertBefore = false) {
    if (!html) {
      return;
    }
    if (!game.user?.isGM) {
      return;
    }

    // TODO MAKE THIS SYNC BETWEEN TOKEN AND PROTOTYPE TOKEN BETTER
    /*
    let obj = app?.object;
    if (obj instanceof Actor) {
      obj = obj.data.token;
    } else if (!(obj instanceof TokenDocument)) {
      obj = app?.object?._object;
    }
    if (obj instanceof TokenDocument && obj.actor) {
      obj = obj.actor.data.token;
    }
    */
    const obj = app?.object;
    // We not show this configuration on prototype token
    if (obj instanceof Actor) {
      return;
    }

    const enviromentActorId = EnvironmentInteractionPlaceableConfig.getEnviroments(obj, EnvironmentInteractionFlags.environmentTokenRef);
    const enviromentChecked = EnvironmentInteractionPlaceableConfig.getEnviroments(obj, EnvironmentInteractionFlags.environmentToken) ? 'checked' : '';

    const actorsOrderByName = <Actor[]>game.actors?.contents.sort((a, b) => a.data.name.localeCompare(b.data.name));
    // TODO ADD SOME FILTER ???
    //.filter((actor) => actor.displayed)
    //.map((actor) => `<option value="${actor.id}">${actor.name}</option>`).join("\n");
    let formConfig = ``;
    const options: string[] = [];
    options.push(`<option value="">${i18n('None')}</option>`);
    actorsOrderByName.forEach((a: Actor) => {
      if (enviromentActorId == a.id) {
        options.push(`<option data-image="${a.img}"  selected="selected" value="${a.id}">${a.name}</option>`);
      } else {
        options.push(`<option data-image="${a.img}"  value="${a.id}">${a.name}</option>`);
      }
    });

    formConfig = `
      <div class="form-group stacked">
        <div class="form-group">
          <label>${i18n(`${CONSTANTS.MODULE_NAME}.tokenConfig.labelPlaceableObject`)}</label>
          <input 
            type="checkbox" 
            name="flags.${CONSTANTS.MODULE_NAME}.${EnvironmentInteractionFlags.environmentToken}" 
            data-dtype="Boolean" ${enviromentChecked} />
        </div>
        <div class="form-group">
          <label>${i18n(`${CONSTANTS.MODULE_NAME}.tokenConfig.labelActor`)}</label>
          <select 
            class="actor-template" 
            name="flags.${CONSTANTS.MODULE_NAME}.${EnvironmentInteractionFlags.environmentTokenRef}" 
            value="${enviromentActorId}"
            data-dtype="String" is="ms-dropdown-eim">
            ${options.join('')}
          </select>
        </div>
      </div>
    `;
    
    if (insertBefore) {
      $(formConfig).insertBefore(html);
    } else {
      html.append(formConfig);
    }
    app.setPosition({ height: 'auto' });
  }

  static _applyEnviroments(document, updateData) {
    const properties: string[] = [];
    properties.push(`flags.${CONSTANTS.MODULE_NAME}.${EnvironmentInteractionFlags.environmentToken}`);
    properties.push(`flags.${CONSTANTS.MODULE_NAME}.${EnvironmentInteractionFlags.environmentTokenRef}`);
    for (const propertyName of properties) {
      let propertyNameOr = propertyName;
      if (document instanceof Actor) {
        propertyNameOr = 'token.' + propertyNameOr;
      }
      if (hasProperty(updateData, propertyNameOr)) {
        const eis = getProperty(updateData, propertyNameOr);
        if (eis != null && eis != undefined) {
          let actor: Actor;
          if (document instanceof Actor) {
            actor = document;
            if (actor) {
              // Set placeable object flag
              setProperty(updateData, propertyNameOr, eis);
            }
          } else if (document instanceof TokenDocument) {
            actor = <Actor>document.actor;
            if (actor) {
              // Set placeable object flag
              setProperty(updateData, propertyNameOr, eis);
            }
          } else {
            const actorNameOrId = eis;
            actor = <Actor>game.actors?.getName(actorNameOrId);
            if (!actor) {
              actor = <Actor>game.actors?.get(actorNameOrId);
            }
            if (actor) {
              // Set placeable object flag
              setProperty(updateData, propertyNameOr, eis);
            }
          }
          // TODO MAKE THIS SYNC BETWEEN TOKEN AND PROTOTYPE TOKEN BETTER
          /*
          if (actor) {
            // Set actor reference
            // setProperty(actor.data, propertyNameOr, eis);
            setProperty(actor.data.token, propertyNameOr, eis);
            // actor.setFlag(CONSTANTS.MODULE_NAME, Flags.environmentToken, eis);
          } else {
            ui.notifications?.warn(`${CONSTANTS.MODULE_NAME} | Can't find the actor`);
          }
          */
        }
      }
    }
  }

  //   static _applyEnviromentsSyncCanvas(document, updateData) {
  //     const properties: string[] = [];
  //     properties.push(`flags.${CONSTANTS.MODULE_NAME}.${Flags.environmentToken}`);
  //     properties.push(`flags.${CONSTANTS.MODULE_NAME}.${Flags.environmentTokenRef}`);
  //     let noPropertyFound = true;
  //     for (const propertyName of properties) {
  //       let propertyNameOr = propertyName;
  //       if (document instanceof Actor) {
  //         propertyNameOr = 'token.' + propertyNameOr;
  //       }
  //       if (hasProperty(updateData, propertyNameOr)) {
  //         noPropertyFound = false;
  //         const eis = getProperty(updateData, propertyNameOr);
  //         if (eis != null && eis != undefined) {
  //           let actor: Actor;
  //           if (document instanceof Actor) {
  //             actor = document;
  //             if (actor) {
  //               // Set placeable object flag
  //               setProperty(updateData, propertyNameOr, eis);
  //             }
  //           } else if (document instanceof TokenDocument) {
  //             actor = <Actor>document.actor;
  //             if (actor) {
  //               // Set placeable object flag
  //               setProperty(updateData, propertyNameOr, eis);
  //             }
  //           } else {
  //             const actorNameOrId = eis;
  //             actor = <Actor>game.actors?.getName(actorNameOrId);
  //             if (!actor) {
  //               actor = <Actor>game.actors?.get(actorNameOrId);
  //             }
  //             if (actor) {
  //               // Set placeable object flag
  //               setProperty(updateData, propertyNameOr, eis);
  //             }
  //           }
  //           if (actor) {
  //             // Set actor reference
  //             // setProperty(actor.data, propertyNameOr, eis);
  //             setProperty(actor.data.token, propertyNameOr, eis);
  //             // actor.setFlag(CONSTANTS.MODULE_NAME, Flags.environmentToken, eis);
  //           } else {
  //             ui.notifications?.warn(`${CONSTANTS.MODULE_NAME} | Can't find the actor`);
  //           }
  //         }
  //       }
  //     }
  //     // TODO MAKE THIS SYNC BETWEEN TOKEN AND PROTOTYPE TOKEN BETTER
  //     if (noPropertyFound && document.data.flags[CONSTANTS.MODULE_NAME]) {
  //       if (document instanceof TokenDocument) {
  //         // For each token
  //         canvas.tokens?.placeables.forEach((t: Token) => {
  //           if (document.actor?.id == t.actor?.id) {
  //             t.document.setFlag(CONSTANTS.MODULE_NAME, Flags.environmentToken, document.getFlag(CONSTANTS.MODULE_NAME, Flags.environmentToken));
  //             t.document.setFlag(CONSTANTS.MODULE_NAME, Flags.environmentTokenRef, document.getFlag(CONSTANTS.MODULE_NAME, Flags.environmentTokenRef));
  //             setProperty((<Actor>t.actor).data.token, `flags.${CONSTANTS.MODULE_NAME}.${Flags.environmentToken}`, document.getFlag(CONSTANTS.MODULE_NAME, Flags.environmentToken));
  //             setProperty((<Actor>t.actor).data.token, `flags.${CONSTANTS.MODULE_NAME}.${Flags.environmentTokenRef}`, document.getFlag(CONSTANTS.MODULE_NAME, Flags.environmentTokenRef));
  //           }
  //         });
  //       }
  //     }
  //   }

  /**
   * Gets all enviroments from a given PlaceableObject or Document
   *
   * @param    {PlaceableObject}  inObject    The PlaceableObject or Document get enviroments from
   *
   * @returns  {Array}                        An array of enviroments from the Document
   */
  static getEnviroments(inObject, flag) {
    const relevantDocument = inObject?.document ?? inObject;
    if (inObject.flags) {
      if (flag == EnvironmentInteractionFlags.environmentTokenRef) {
        const enviroments = getProperty(inObject, `flags.${CONSTANTS.MODULE_NAME}.${flag}`) ?? [];
        return EnvironmentInteractionPlaceableConfig._validateEnviroments(enviroments, 'getEnviroments');
      } else if (flag == EnvironmentInteractionFlags.environmentToken) {
        const enviroment = getProperty(inObject, `flags.${CONSTANTS.MODULE_NAME}.${flag}`) ?? false;
        return enviroment;
      } else {
        return null;
      }
    } else if (inObject.data) {
      if (flag == EnvironmentInteractionFlags.environmentTokenRef) {
        const enviroments = relevantDocument?.getFlag(CONSTANTS.MODULE_NAME, flag) ?? [];
        return EnvironmentInteractionPlaceableConfig._validateEnviroments(enviroments, 'getEnviroments');
      } else if (flag == EnvironmentInteractionFlags.environmentToken) {
        const enviroment = relevantDocument?.getFlag(CONSTANTS.MODULE_NAME, flag) ?? false;
        return enviroment;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  static _validateEnviroments(inEnviroments, inFunctionName) {
    if (!(typeof inEnviroments === 'string' || typeof inEnviroments === 'string' || Array.isArray(inEnviroments))) {
      throw new Error(`${CONSTANTS.MODULE_NAME} | ${inFunctionName} | inEnviroments must be of type string or array`);
    }
    const providedEnviroments = typeof inEnviroments === 'string' ? inEnviroments.split(',') : inEnviroments;

    providedEnviroments.forEach((t) => {
      if (typeof t !== 'string') throw new Error(`${CONSTANTS.MODULE_NAME} | ${inFunctionName} | enviroments in array must be of type string`);
    });

    return providedEnviroments.map((t) => t.trim());
  }
}
