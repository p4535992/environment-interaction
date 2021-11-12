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
import { getGame, moduleName, registerSettings } from './module/settings';
import { preloadTemplates } from './module/preloadTemplates';
import { initHooks, readyHooks, setupHooks } from './module/Hooks';

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
  return getGame().i18n.localize(key);
};
export const i18nFormat = (key, data = {}) => {
  return getGame().i18n.format(key, data);
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
  if (!getGame().modules.get('lib-wrapper')?.active && getGame().user?.isGM) {
    ui.notifications?.error(`The "${moduleName}" module requires to install and activate the "libWrapper" module.`);
    return;
  }
  // if (!getGame().modules.get("lib-df-hotkey")?.active && getGame().user.isGM){
  //   ui.notifications.error(`The "${moduleName}" module requires to install and activate the "lib-df-hotkey" module.`);
  //   return;
  // }
  readyHooks();
});

// Add any additional hooks if necessary
