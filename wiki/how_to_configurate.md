## The syntax of the code

In this document i'll try to explain how this module can be configurate to work with these other modules:

- [Monk's TokenBar](https://github.com/ironmonk88/monks-tokenbar)
- [Token Action HUD](https://github.com/Drental/fvtt-tokenactionhud)
- [Let Me Roll That For You!](https://github.com/League-of-Foundry-Developers/fvtt-module-lmrtfy)
- [Item Macro](https://github.com/Kekilla0/Item-Macro)

The syntax of the request label is:

<ENVIRONMENT_TYPE>|<MACRO_NAME_OR_TYPE_REQUEST>|<LABEL_FOR_OTHER_PARAMETERS>

### Environment Type

| Environment Type | Description                | Module Involved       |
|:----------------:|:--------------------------:|:---------------------:|
| misc             |                            | Token Action HUD        |
| save             |                            | Monk Token Bar/Token Action HUD        |
| ability          |                            | Monk Token Bar/Token Action HUD        |
| skill            |                            | Monk Token Bar/Token Action HUD        |
| dice             | Simple dice roll           |         |
| attack           |                            | Token Action HUD      |
| macro            | Simple macro to roll       |                       |
| item             |                            | Token Action HUD                       |
| <EMPTY LABEL>    |                            | Monk Token Bar/Token Action HUD        |

### Macro or type request

only two value are presente here

- **macro name** : name of the macro to run, WORK ONLY WITH ENVIROMENT TYPE 'macro'
- **<MODULE LABEL TYPE>** : name key used for check the type of request for example Monk Token Bar with system dnd5e accept these labels _dice,misc,ability,save,skill_   

**NOTE : If you set the 'macro' label on the 'Macro or type request' you mus set empty 'Request Label' here o anyway the code not read this label**

### Label or other parameters (need more developing...)

The 'SUCCESS' and 'FAILURE' can indicate a external macro by is name or id with syntax `@macro[macro name or macro id]`

## Examples

| Detail | Info | Event | Macro Condition (Optional) | Macro Success (Optional) | Macro Failure (Optional) | Module Involved (only info) |
|:-------------------:|:----------:|:----------------------:|:----------------:|:----:|:----:|:--------:|
| This is a sub label | some info  | save\|save:dex,save:dex\| | return item.name |  |  | Monk Token Bar   |
| sub label 1         |            | save\|save:dex\|       |                  |  |  | Monk Token Bar   |
| sub label 2         |            | ability\|ability:dex\| |                  |  |  | Monk Token Bar   |
| sleight of hand     | stole pouch| ability\|ability:dex\| |                  |  |  | Monk Token Bar   |
| sub label 3         |            | dice\|dice:dex\|      |                  |  |  | Monk Token Bar   |
| sub label           |            | attack\|item\|           |                  |  |  | Token Action HUD |
| sub label           |            | attack\|ability\|        |                  |  |  | Token Action HUD |
| sub label           |            | attack\|skill\|          |                  |  |  | Token Action HUD |
| sub label           |            | attack\|abilitySave,dex\||                  |  |  | Token Action HUD |
| sub label           |            | attack\|abilityCheck\|   |                  |  |  | Token Action HUD |
| sub label           |            | attack\|item\|           |                  |  |  | Token Action HUD |
| sub label           |            | attack\|spell\|          |                  |  |  | Token Action HUD |
| sub label           |            | attack\|feat\|           |                  |  |  | Token Action HUD |
| sub label           |            | attack\|utility\|        |                  |  |  | Token Action HUD |
| sub label           |            | attack\|effect\|         |                  |  |  | Token Action HUD |
| sub label           |            | attack\|condition\|      |                  |  |  | Token Action HUD |
| sub label           |            | dice\|d20 + d15\|      |                  |  |  | |

Other examples

Launch skill Sleight of hand on System Dnd5e : `skill|skill:slt,skill:prc|`
