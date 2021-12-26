
import { getGame, getCanvas, moduleName } from './settings';


export class TriggerHappyEim{

  static triggerHappyActive;

  static setTriggerHappyActive(en){
    TriggerHappyEim.triggerHappyActive = en;
  }

  static triggerHappy_onPreUpdateToken(scene:Scene, embedded, update:Token, options:any, userId:string) {
    if (!scene.isView || TriggerHappyEim.triggerHappyActive == false){
      return true;
    }
    if (update.x === undefined && update.y === undefined){
      return true;
    }
    const token = <TokenDocument>scene.data.tokens.find(t => t.id === update.id);

    const position = {
      x: (update.x || token.data.x) + token.data.width * scene.data.grid / 2,
      y: (update.y || token.data.y) + token.data.height * scene.data.grid / 2
    };
    const movementTokens = getCanvas().tokens?.placeables.filter((tok) => tok.data._id !== token.id);
    //@ts-ignore
    const tokens = getGame().triggers._getPlaceablesAt(movementTokens, position);
    //@ts-ignore
    const drawings = getGame().triggers._getPlaceablesAt(getCanvas().drawings?.placeables, position);
    if (tokens.length === 0 && drawings.length === 0){
      return true;
    }
    //@ts-ignore
    const triggers = getGame().triggers._getTriggersFromTokens(getGame().triggers.triggers, tokens, 'move');
    //@ts-ignore
    triggers.push(...getGame().triggers._getTriggersFromDrawings(getGame().triggers.triggers, drawings, 'move'));

    if (triggers.length === 0){
      return true;
    }
    for (const t of triggers) {
      const options = t.options;
      Hooks.once('updateToken', () => TriggerHappyEim.triggerHappy_AnalyzeOptions(options));
    }
  }

  static triggerHappy_ControlToken(token,controlled){
    if (!controlled || TriggerHappyEim.triggerHappyActive == false){
      return;
    }
    const tokens = [token];
    //@ts-ignore
    const triggers = getGame().triggers._getTriggersFromTokens(getGame().triggers.triggers, tokens, 'click');
    if (triggers.length === 0){
      return;
    }
    const options = triggers[0].options;
    TriggerHappyEim.triggerHappy_AnalyzeOptions(options)
  }

  static triggerHappy_AnalyzeOptions(options){
    for (const o of options) {
      if (o.includes('eim')) {
        // TODO
        /*
        let enable;
        const data = o.replace('shareVision=','');
        if (data == 'true'){
          enable = true;
        }
        else if (data == 'false'){
          enable = false;
        }
        else if (data == 'toggle'){
          enable = !getGame().settings.get(moduleName,'enable');
        }

        if (enable != getGame().settings.get(moduleName,'enable')) {
          if (getGame().user?.isGM){
            shareVision(enable);
            ui.controls?.controls?.find(controls => controls.name == "token").tools.find(tools => tools.name == "enableSharedVision").active = enable;
            ui.controls?.render();
          }
          else
            userSet(enable);
        }
        */
      }
    }
  }
}
