export const ACTION_TYPE = {
  SAVE: 'save',
  ABILITY: 'ability', // for dnd5e is 'abil' ???
  DAMAGE: 'damage',
  ATTACK: 'attack',
};

export const ITEM_TYPE = {
  LOOT: 'loot',
  WEAPON: 'weapon',
  CONSUMABLE: 'consumable',
};

export class useData {
  itemID: string;
  environmentTokenID: string;
  interactorTokenID: string;
}
