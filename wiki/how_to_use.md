
# Steps to follow

## Step 1: Activate a token like a 'Environment Token'

An environment token is created like any other token. Once placed on the canvas, the token can be set as an "environment token" using the token configuration window.

Double clicking an environment token will open its Select Action dialog window. GM users will also have a button to open the character sheet.

![img](../img/steps/step1.png)

After setting the token we add or create some objects


| Environment Type | Description                | Module Involved       |
|:----------------:|:--------------------------:|:---------------------:|
| save             |                            | Monk Token Bar        |
| ability          |                            | Monk Token Bar        |
| dice             |                            | Monk Token Bar        |
| attack           |                            |                       |
| utility          |                            |                       |
| macro            |                            |                       |


The syntax of the rquest label is

<ENVIRONMENT_TYPE>|<REQUEST_LABEL>|<DC>

The 'success' and 'failure' can indicate a external macro by is name or id with syntax `@macro[macro name or macro id]`

Examples

| Detail | Info | Event | Macro Condition (Optional) | Macro Success (Optional) | Macro Failure (Optional) | Module Involved (only info) |
|:-------------------:|:----------:|:----------------------:|:----------------:|:----:|:----:|:--------:|
| This is a sub label | some info  | save\|save:dex,save:dex | return item.name |  |  | Monk Token Bar   |
| sub label 1         |            | save\|save:dex\|17       |                  |  |  | Monk Token Bar   |
| sub label 2         |            | ability\|ability:dex\|17 |                  |  |  | Monk Token Bar   |
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
