import { EnvironmentInteraction } from './environment-interaction';
import { getGame } from './settings';

export const readyHooks = async () => {
  // Register hook callbacks
  // @ts-ignore
  getGame().EnvironmentInteraction.registerHooks();

  Hooks.on('tokenBarUpdateRoll', (tokenBarApp: any, message: ChatMessage, updateId: string, msgtokenRoll: Roll) => {
    // tokenBarApp can be any app of token bar moduel e.g. SavingThrow
    const checkout = msgtokenRoll.total;
  });

  Hooks.callAll("forceUpdateTokenActionHUD", (args) => {
    const checkout = args;
  });
};

export const initHooks = async () => {
  // Open module API
  // @ts-ignore
  getGame().EnvironmentInteraction = EnvironmentInteraction;

  // Register settings
  // @ts-ignore
  // getGame().EnvironmentInteraction.registerSettings();

  // Register Handlebars helpers
  // @ts-ignore
  getGame().EnvironmentInteraction.registerHandlebarsHelpers();
};

export const setupHooks = async () => {
  // Do anything after initialization but before ready
  // Register wrappers
  // @ts-ignore
  getGame().EnvironmentInteraction.registerWrappers();
};
