export const ENVIROMENT_TYPE = {
  // From DnD5e system
  SAVE: 'save',
  ABILITY: 'ability',
  // DAMAGE: 'damage',
  ATTACK: 'attack',
  UTILITY: 'utility',
};

export const MACRO_TYPE = {
  ABILITY: 'ability',
  SKILL: 'skill',
  ABILITY_SAVE: 'abilitySave',
  ABILITY_CHECK: 'abilityCheck',
  ITEM: 'item',
  SPELL: 'spell',
  FEAT: 'feat',
  UTILITY: 'utility',
  EFFECT: 'effect',
  CONDITION: 'condition',
};

export const ACTION_TYPE = {
  // From DnD5e system
  mwak: 'mwak', //Melee Weapon Attack
  rwak: 'rwak', //Ranged Weapon Attack
  msak: 'msak', //Melee Spell Attack
  rsak: 'rsak', //Ranged Spell Attack
  save: 'save', //Saving Throw
  heal: 'heal', //Healing
  abil: 'abil', // Ability Check
  util: 'util', // Utility
  other: 'other', // Other
};

export const ITEM_TYPE = {
  LOOT: 'loot',
  WEAPON: 'weapon',
  CONSUMABLE: 'consumable',
  TOOL: 'tool',
};

export class useData {
  itemID: string;
  environmentTokenID: string;
  interactorTokenID: string;
}

export const Flags = {
  environmentToken: 'environmentToken',
  notes: 'notes',
  notescondition: 'notes-condition',
  notessuccess: 'notes-success',
  notesfailure: 'notes-failure',
  notesmacro: 'notes-macro',
  notesconditionmacro: 'notes-condition-macro',
  notessuccessmacro: 'notes-success-macro',
  notesfailuremacro: 'notes-failure-macro',
};
