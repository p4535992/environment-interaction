
# Steps to follow

## Step 1: Activate a token like a 'Environment Token'

An environment token is created like any other token. Once placed on the canvas, the token can be set as an "environment token" using the token configuration window.

Double clicking an environment token will open its Select Action dialog window. GM users will also have a button to open the character sheet.

![img](../img/steps/step1.png)

After setting the token we add or create some objects.

## The syntax of the code

The syntax of the request label is

<ENVIRONMENT_TYPE>|<MACRO_NAME_OR_TYPE_REQUEST>|<REQUEST_LABEL>|<DC_OR_NUMBER_TO_PASS>

### Environment Type

| Environment Type | Description                | Module Involved       |
|:----------------:|:--------------------------:|:---------------------:|
| save             |                            | Monk Token Bar/Token Action HUD        |
| ability          |                            | Monk Token Bar/Token Action HUD        |
| dice             |                            | Monk Token Bar/Token Action HUD        |
| attack           |                            | Token Action HUD      |
| item             |                            | Token Action HUD                       |
| macro            |                            |                       |
| <EMPTY LABEL>    |                            | Monk Token Bar/Token Action HUD        |

### Macro or type request

only two value are presente here

- **macro name** : name of the macro to run, WORK ONLY WITH ENVIROMENT TYPE 'macro'
- **<MODULE LABEL TYPE>** : name key used for check the type of request for example Monk Token Bar with system dnd5e accept these labels _dice,misc,ability,save,skill_   

**NOTE : If you set the 'macro' label on the 'Macro or type request' you mus set empty 'Request Label' here o anyway the code not read this label**

| Request Label | Description                | Module Involved       |



The 'success' and 'failure' can indicate a external macro by is name or id with syntax `@macro[macro name or macro id]`

Examples

| Detail | Info | Event | Macro Condition (Optional) | Macro Success (Optional) | Macro Failure (Optional) | Module Involved (only info) |
|:-------------------:|:----------:|:----------------------:|:----------------:|:----:|:----:|:--------:|
| This is a sub label | some info  | save\|save:dex,save:dex | return item.name |  |  | Monk Token Bar   |
| sub label 1         |            | save\|save:dex\|17       |                  |  |  | Monk Token Bar   |
| sub label 2         |            | ability\|ability:dex\|17 |                  |  |  | Monk Token Bar   |
| sleight of hand     | stole pouch| ability\|ability:dex\|17 |                  |  |  | Monk Token Bar   |
| sub label 3         |            | dice\|dice:dex\|17       |                  |  |  | Monk Token Bar   |
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


    skill|skill:slt,skill:prc|18