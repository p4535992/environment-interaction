export const ENVIRONMENT_TYPE = {
  MISC: 'misc',
  SAVE: 'save',
  ABILITY: 'ability',
  SKILL: 'skill',
  DICE: 'dice',
  // DAMAGE: 'damage',
  ATTACK: 'attack',
  MACRO: 'macro',
  ITEM: 'item',
};

// export const MACRO_TYPE = {
//   ABILITY: 'ability',
//   SKILL: 'skill',
//   ABILITY_SAVE: 'abilitySave',
//   ABILITY_CHECK: 'abilityCheck',
//   ITEM: 'item',
//   SPELL: 'spell',
//   FEAT: 'feat',
//   UTILITY: 'utility',
//   EFFECT: 'effect',
//   CONDITION: 'condition',
// };

// export const ACTION_TYPE = {
//   // From DnD5e system
//   mwak: 'mwak', //Melee Weapon Attack
//   rwak: 'rwak', //Ranged Weapon Attack
//   msak: 'msak', //Melee Spell Attack
//   rsak: 'rsak', //Ranged Spell Attack
//   save: 'save', //Saving Throw
//   heal: 'heal', //Healing
//   abil: 'abil', // Ability Check
//   util: 'util', // Utility
//   other: 'other', // Other
// };

// export const ITEM_TYPE = {
//   LOOT: 'loot',
//   WEAPON: 'weapon',
//   CONSUMABLE: 'consumable',
//   TOOL: 'tool',
// };

// export class useData {
//   itemID: string;
//   environmentTokenID: string;
//   interactorTokenID: string;
// }

export const Flags = {
  environmentToken: 'environmentToken',
  notesuseei: 'notes-use-environment-interaction',
  notesuseitemmacro: 'notes-use-item-macro',
  notesuseitemenvironment: 'notes-use-item-environment',
  notesdetail: 'notes-detail',
  notesinfo: 'notes-info',
  notes: 'notes',
  notescondition: 'notes-condition',
  notessuccess: 'notes-success',
  notesfailure: 'notes-failure',
  notesconditionargs: 'notes-condition-args',
  notessuccessargs: 'notes-success-args',
  notesfailureargs: 'notes-failure-args',
  // notesmacro: 'notes-macro',
  // notesconditionmacro: 'notes-condition-macro',
  // notessuccessmacro: 'notes-success-macro',
  // notesfailuremacro: 'notes-failure-macro',
};

/**
 * A model for embed all the info we need to decide a success or a failure
 */
export class customInfoEnvironmentInteraction {
  environmentTokenID = '';
  environmentActorID = '';
  environmentItemID = '';
  environmentDC = NaN;
  interactorTokenID = '';
  interactorActorID = '';
  interactorItemID = '';
  requestLabel = '';
}
