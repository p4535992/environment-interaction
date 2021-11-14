export const ENVIROMENT_TYPE = {
  SAVE: 'save',
  ABILITY: 'ability',
  DAMAGE: 'damage',
  ATTACK: 'attack',
  OTHER: 'other',
};

export const ACTION_TYPE = {
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
