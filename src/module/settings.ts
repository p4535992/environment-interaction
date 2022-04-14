import type { RollHandler } from './lib/tokenActionHUD/RollHandler';
import type { MonksTokenBarAPI } from './lib/tokenbarapi/MonksTokenBarAPI';
import CONSTANTS from './constants';

export function getMonkTokenBarAPI(): MonksTokenBarAPI {
  //@ts-ignore
  return game.MonksTokenBar;
}

export function getTokenActionHUDRollHandler(): RollHandler {
  //@ts-ignore
  return game.tokenActionHUD.systemManager.getRollHandler();
}

const systemsMonkTokenBarSupported = ['dnd5e', 'sw5e', 'd35e', 'dnd4ebeta', 'pf1', 'pf2e', 'tormenta20', 'sfrpg', 'ose', 'swade', 'coc7'];

export function isSystemMonkTokenBarSupported() {
  return systemsMonkTokenBarSupported.includes(game?.system.id.toLowerCase());
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
  return systemsTokenActionHUDSupported.includes(game?.system.id.toLowerCase());
}

const systemsLmrtfySupported = ['dnd5ejp', 'dnd5e', 'sw5e', 'pf1', 'pf2e', 'd35e', 'cof', 'coc'];

export function isSystemLmrtfySupported() {
  return systemsLmrtfySupported.includes(game?.system.id.toLowerCase());
}

const systemsItemMacroSupported = ['dnd5e', 'sfrpg', 'swade', 'dungeonworld', 'ose', 'demonlord', 'cyberpunk-red-core'];

export function isSystemItemMacroSupported() {
  return systemsItemMacroSupported.includes(game?.system.id.toLowerCase());
}

export function isItemMacroModuleActive() {
  return <boolean>game.modules.get(CONSTANTS.MODULE_NAME)?.active;
}

export function isMonkTokensBarModuleActive() {
  return <boolean>game.modules.get(CONSTANTS.ENVIRONMENT_INTERACTION_MONKS_TOKENBAR_MODULE_NAME)?.active;
}

export function isLmrtfyActive() {
  return <boolean>game.modules.get(CONSTANTS.ENVIRONMENT_INTERACTION_LMRTFY)?.active;
}

export function isTokenActionHudActive() {
  return <boolean>game.modules.get(CONSTANTS.ENVIRONMENT_INTERACTION_TOKEN_ACTION_HUD)?.active;
}

export const registerSettings = function () {
  // Automatically close interaction selection dialog
  game.settings.register(CONSTANTS.MODULE_NAME, 'closeDialog', {
    name: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.settings.closeDialog.name`),
    hint: '',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  // Automatically add proficiency to attack rolls
  // game.settings.register(CONSTANTS.MODULE_NAME, 'autoProficiency', {
  //   name: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.settings.autoProficiency.name`),
  //   hint: '',
  //   scope: 'world',
  //   config: true,
  //   type: Boolean,
  //   default: true,
  // });

  // game.settings.register(CONSTANTS.MODULE_NAME, 'integrationWithPolyglot', {
  //   name: i18n(`${CONSTANTS.MODULE_NAME}.settings.integrationWithPolyglot.name`),
  //   hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.integrationWithPolyglot.hint`),
  //   scope: 'world',
  //   config: true,
  //   default: false,
  //   type: Boolean,
  // });

  // game.settings.register(CONSTANTS.MODULE_NAME, 'hideLabel', {
  //   name: i18n(`${CONSTANTS.MODULE_NAME}.settings.notehidelabel.name`),
  //   hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.notehidelabel.hint`),
  //   scope: 'world',
  //   config: false,
  //   default: true,
  //   type: Boolean,
  // });

  // game.settings.register(CONSTANTS.MODULE_NAME, 'colorLabel', {
  //   name: i18n(`${CONSTANTS.MODULE_NAME}.settings.notecolorlabel.name`),
  //   hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.notecolorlabel.hint`),
  //   scope: 'world',
  //   config: true,
  //   default: false,
  //   type: Boolean,
  // });

  // game.settings.register(CONSTANTS.MODULE_NAME, 'acelibDefaultShow', {
  //   name: i18n(`${CONSTANTS.MODULE_NAME}.settings.acelibDefaultShow.name`),
  //   hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.acelibDefaultShow.hint`),
  //   default: true,
  //   type: Boolean,
  //   scope: 'world',
  //   config: false,
  // });

  // game.settings.register(CONSTANTS.MODULE_NAME, 'acelibLineWrap', {
  //   name: i18n(`${CONSTANTS.MODULE_NAME}.settings.acelibLineWrap.name`),
  //   hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.acelibLineWrap.hint`),
  //   default: true,
  //   type: Boolean,
  //   scope: 'world',
  //   config: false,
  // });
};
