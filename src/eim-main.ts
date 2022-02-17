/**
 * This is your TypeScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your module, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your module
 */
// Import JavaScript modules

// Import TypeScript modules
import { moduleName, registerSettings } from './module/settings';
import { preloadTemplates } from './module/preloadTemplates';
import { initHooks, readyHooks, setupHooks } from './module/module';
import { game } from './module/settings';

export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3
export const debug = (...args) => {
  if (debugEnabled > 1) console.log(`DEBUG:${moduleName} | `, ...args);
};
export const log = (...args) => console.log(`${moduleName} | `, ...args);
export const warn = (...args) => {
  if (debugEnabled > 0) console.warn(`${moduleName} | `, ...args);
};
export const error = (...args) => console.error(`${moduleName} | `, ...args);
export const timelog = (...args) => warn(`${moduleName} | `, Date.now(), ...args);

export const i18n = (key) => {
  return game.i18n.localize(key);
};
export const i18nFormat = (key, data = {}) => {
  return game.i18n.format(key, data);
};

export const setDebugLevel = (debugText: string) => {
  debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
  // 0 = none, warnings = 1, debug = 2, all = 3
  if (debugEnabled >= 3) CONFIG.debug.hooks = true;
};

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async () => {
  console.log(`${moduleName} | Initializing ${moduleName}`);

  // Register custom module settings
  registerSettings();

  initHooks();
  // Assign custom classes and constants here

  // Register custom module settings
  //registerSettings();
  //fetchParams();

  // Preload Handlebars templates
  await preloadTemplates();
  // Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
Hooks.once('setup', function () {
  // Do anything after initialization but before ready
  //setupModules();

  setupHooks();

  registerSettings();
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', () => {
  if (!game.modules.get('lib-wrapper')?.active && game.user?.isGM) {
    ui.notifications?.error(`The "${moduleName}" module requires to install and activate the "libWrapper" module.`);
    return;
  }
  if (!game.modules.get('acelib')?.active && game.user?.isGM) {
    ui.notifications?.error(`The "${moduleName}" module requires to install and activate the "acelib" module.`);
    return;
  }
  // if (!game.modules.get("lib-df-hotkey")?.active && game.user.isGM){
  //   ui.notifications.error(`The "${moduleName}" module requires to install and activate the "lib-df-hotkey" module.`);
  //   return;
  // }
  readyHooks();
});

// Add any additional hooks if necessary
