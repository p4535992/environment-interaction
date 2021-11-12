![All Downloads](https://img.shields.io/github/downloads/jessev14/environment-interaction/total?style=for-the-badge)

![Latest Release Download Count](https://img.shields.io/github/downloads/jessev14/environment-interaction/latest/EI.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fenvironment-interaction&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=environment-interaction)

# Environment Interaction

## THIS IS NOT A OFFICIAL MODULE, I'm just learning how to write code for Foundry VTT.

Environment Interaction allows GM users to create "environment tokens" that characters can interact with. These interactions can include weapon attacks, skill checks and saves, and even executing macros.

**Note: This is module is inspired from the  wonderful work done by [jessev14](https://github.com/jessev14) with its [Environment Interaction](https://github.com/jessev14/environment-interaction) module and the work done by [ironmonk88](https://github.com/ironmonk88) with [Monk's TokenBar](https://github.com/ironmonk88/monks-tokenbar).
If you want to support more modules of this kind, I invite you to go and support his patreon or kofi below the links**

#### jessev14 Kofi

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/jessev14)

#### ironmonk88 Patreon

[![alt-text](https://img.shields.io/badge/-Patreon-%23ff424d?style=for-the-badge)](https://www.patreon.com/ironmonk)

## Scope of this fork ???

- Learn new things on foundry
- Manage the multisystem 
- Integration with a automatic rolls
- Make a PR to the official master project [Environment Interaction](https://github.com/jessev14/environment-interaction)
- Some friend request
## Usage

<img src="./img/environment-interaction-demo.gif" height="450"/>

An environment token is created like any other token. Once placed on the canvas, the token can be set as an "environment token" using the token configuration window.

Double clicking an environment token will open its Select Action dialog window. GM users will also have a button to open the charcter sheet.

<img src="./img/token-config.png" height="280"/> 

<img src="./img/action-selection.png" height="280"/>

Selecting an action will use the currently selected token (player character) as the character performing the action. The action will be rolled and carried out using the character's game stats.

To move an environment token, first select it by drag-selection.

Interactions are automatically generated from the items on the environment token's actor sheet.

### Interaction Types
The type of interaction an item has depends on its item type:
* Weapon: Function as if the character had the item on its own actor sheet.
* Consumable:
  - If the item action type is set to "Ability Check," a chat card will be created allowing the character to perform the corresponding check, based on the ability select drop-down.
  - If the item action type is set to "Saving Throw," the chat card will allow the character to perform the corresponding saving throw, based on the saving throw select drop-down.
* Loot: Loot-type items allow the character to execute a macro. To set the macro to be executed, enter the macro's name (exactly) into the "source" input of the item.

See [these images](https://github.com/jessev14/environment-interaction/tree/main/img/example-interactions) for example items.

### Item Macro
If an item on an environment token has a set Item Macro, after rolling the item to chat, the Item Macro will be executed.

## System
Environment Interaction currently only supports dnd5e, but please reach out if you'd like to help me support your system!

## Compatibility
Environment Interactions *should* be compatible with custom rollers (e.g. Midi-QOL, Better Rolls for 5e, MRE), but please submit an issue if anything seems to not work correctly.

## Technical Notes

When an interaction is selected, the correponding item on the environment token's actor sheet is created on the character's actor sheet. After rolling the item to chat, the item is deleted from the character's actor sheet. In this way, the character's actor sheet is the same before and after the interaction.

A similar method is used to handle attack and damage rolls. When attack/damage buttons are clicked, the weapon is temporarily created on the character's actor sheet and used for the attack/damage roll before being deleted. This allows the character's relevant game stats to be used for the roll.

# Build

## Install all packages

```bash
npm install
```
## npm build scripts

### build

will build the code and copy all necessary assets into the dist folder and make a symlink to install the result into your foundry data; create a
`foundryconfig.json` file with your Foundry Data path.

```json
{
  "dataPath": "~/.local/share/FoundryVTT/"
}
```

`build` will build and set up a symlink between `dist` and your `dataPath`.

```bash
npm run-script build
```

### NOTE:

You don't need to build the `foundryconfig.json` file you can just copy the content of the `dist` folder on the module folder under `modules` of Foundry

### build:watch

`build:watch` will build and watch for changes, rebuilding automatically.

```bash
npm run-script build:watch
```

### clean

`clean` will remove all contents in the dist folder (but keeps the link from build:install).

```bash
npm run-script clean
```
### lint and lintfix

`lint` launch the eslint process based on the configuration [here](./.eslintrc)

```bash
npm run-script lint
```

`lintfix` launch the eslint process with the fix argument

```bash
npm run-script lintfix
```

### prettier-format

`prettier-format` launch the prettier plugin based on the configuration [here](./.prettierrc)

```bash
npm run-script prettier-format
```

### package

`package` generates a zip file containing the contents of the dist folder generated previously with the `build` command. Useful for those who want to manually load the module or want to create their own release

```bash
npm run-script package
```

## [Changelog](./changelog.md)

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/p4535992/environment-interaction/issues ), or using the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).

## License

- **[Environment Interaction](https://github.com/jessev14/environment-interaction)**: [MIT](https://github.com/jessev14/environment-interaction/blob/main/LICENSE)

- **[Monk's TokenBar](https://github.com/ironmonk88/monks-tokenbar)**: [GPL-3.0 License](https://github.com/ironmonk88/monks-tokenbar/blob/main/LICENSE)

This package is under an [GPL-3.0 License](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).

## Credits

- [jessev14](https://github.com/jessev14) for the module [Environment Interaction](https://github.com/jessev14/environment-interaction)
- [ironmonk88](https://github.com/ironmonk88) for the module [Monk's TokenBar](https://github.com/ironmonk88/monks-tokenbar)

## Acknowledgements

Feel free to reach out on Discord (`enso#0361`) if you want to discuss any aspect of the module!

Bootstrapped with League of Extraordinary FoundryVTT Developers  [foundry-vtt-types](https://github.com/League-of-Foundry-Developers/foundry-vtt-types).

Mad props to the 'League of Extraordinary FoundryVTT Developers' community which helped me figure out a lot.
