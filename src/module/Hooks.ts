import { ACTION_TYPE, ITEM_TYPE } from './environment-interaction-models';
import { getGame } from './settings';

export const readyHooks = async () => {
  // Register hook callbacks
  // @ts-ignore
  window.EnvironmentInteraction.registerHooks();
};

export const initHooks = async () => {
  // Open module API
  // @ts-ignore
  window.EnvironmentInteraction = EnvironmentInteraction;

  // Register settings
  // @ts-ignore
  window.EnvironmentInteraction.registerSettings();

  // Register Handlebars helpers
  // @ts-ignore
  window.EnvironmentInteraction.registerHandlebarsHelpers();
};

export const setupHooks = async () => {
  // Do anything after initialization but before ready
  // Register wrappers
  // @ts-ignore
  window.EnvironmentInteraction.registerWrappers();
};
