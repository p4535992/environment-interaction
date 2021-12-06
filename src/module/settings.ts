import { i18n } from '../environment-interaction-main';
import { RollHandler } from '../lib/tokenActionHUD/RollHandler';
import { MonksTokenBarAPI } from './../lib/tokenbarapi/MonksTokenBarAPI';
import { ENVIROMENT_TYPE } from './environment-interaction-models';

export const moduleName = 'environment-interaction';

export const ENVIROMENT_INTERACTION_ITEM_MACRO_MODULE_NAME = 'itemacro';

/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
export function getCanvas(): Canvas {
  if (!(canvas instanceof Canvas) || !canvas.ready) {
    throw new Error('Canvas Is Not Initialized');
  }
  return canvas;
}
/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
export function getGame(): Game {
  if (!(game instanceof Game)) {
    throw new Error('Game Is Not Initialized');
  }
  return game;
}

export function getMonkTokenBarAPI(): MonksTokenBarAPI {
  //@ts-ignore
  return getGame().MonksTokenBar;
}

export function getTokenActionHUDRollHandler(): RollHandler {
  //@ts-ignore
  return getGame().tokenActionHUD.systemManager.getRollHandler();
}

const systemsMonkTokenBarSupported = ['dnd5e', 'sw5e', 'd35e', 'dnd4ebeta', 'pf1', 'pf2e', 'tormenta20', 'sfrpg', 'ose', 'swade', 'coc7'];

export function isSystemMonkTokenBarSupported() {
  return systemsMonkTokenBarSupported.includes(getGame()?.system.id.toLowerCase());
}

const systemsTokenActionHUDSupported = [
  'dnd5e',
  'dungeonworld',
  'pf2e',
  'wfrp4e',
  'sfrpg',
  'sw5e',
  'demonlord',
  'pf1',
  'lancer',
  'd35e',
  'swade',
  'starwarsffg',
  'tormenta20',
  'blades-in-the-dark',
  'symbaroum',
  'od6s',
  'alienrpg',
  'cthack',
  'kamigakari',
  'tagmar',
  'tagmar_rpg',
  'ds4',
  'coc',
  'cof',
  'forbidden-lands',
];

export function isSystemTokenActionHUDSupported() {
  return systemsTokenActionHUDSupported.includes(getGame()?.system.id.toLowerCase());
}

const systemsLmrtfySupported = ['dnd5ejp', 'dnd5e', 'sw5e', 'pf1', 'pf2e', 'd35e', 'cof', 'coc'];

export function isSystemLmrtfySupported() {
  return systemsLmrtfySupported.includes(getGame()?.system.id.toLowerCase());
}

const systemsItemMacroSupported = [
  'dnd5e', 'sfrpg', 'swade', 'dungeonworld', 'ose', 'demonlord', 'cyberpunk-red-core'
];

export function isSystemItemMacroSupported() {
  return systemsItemMacroSupported.includes(getGame()?.system.id.toLowerCase());
}

export function isItemMacroModuleActive(){
  return <boolean>getGame().modules.get(ENVIROMENT_INTERACTION_ITEM_MACRO_MODULE_NAME)?.active;
}

export const registerSettings = function () {
  // Automatically close interaction selection dialog
  getGame().settings.register(moduleName, 'closeDialog', {
    name: getGame().i18n.localize(`${moduleName}.settings.closeDialog.name`),
    hint: '',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  // Automatically add proficiency to attack rolls
  getGame().settings.register(moduleName, 'autoProficiency', {
    name: getGame().i18n.localize(`${moduleName}.settings.autoProficiency.name`),
    hint: '',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  getGame().settings.register(moduleName, 'integrationWithPolyglot', {
    name: i18n(`${moduleName}.settings.integrationWithPolyglot.name`),
    hint: i18n(`${moduleName}.settings.integrationWithPolyglot.hint`),
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });
};
