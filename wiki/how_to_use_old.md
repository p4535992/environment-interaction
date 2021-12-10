~~An environment token is created like any other token. Once placed on the canvas, the token can be set as an "environment token" using the token configuration window.~~

~~Double clicking an environment token will open its Select Action dialog window. GM users will also have a button to open the character sheet.~~

<img src="../img/token-config.png" height="280"/> 

<img src="../img/action-selection.png" height="280"/>

~~Selecting an action will use the currently selected token (player character) as the character performing the action. The action will be rolled and carried out using the character's game stats.~~

~~To move an environment token, first select it by drag-selection.~~

~~Interactions are automatically generated from the items on the environment token's actor sheet.~~

~~### Interaction Types~~

~~The type of interaction an item has depends on its item type:~~
~~* Weapon: Function as if the character had the item on its own actor sheet.~~
~~* Consumable:~~
  ~~- If the item action type is set to "Ability Check," a chat card will be created allowing the character to perform the corresponding check, based on the ability select drop-down.~~
  ~~- If the item action type is set to "Saving Throw," the chat card will allow the character to perform the corresponding saving throw, based on the saving throw select drop-down.~~
~~* Loot: Loot-type items allow the character to execute a macro. To set the macro to be executed, enter the macro's name (exactly) into the "source" input of the item.~~

~~See [these images](./img/example-interactions) for example items.~~
