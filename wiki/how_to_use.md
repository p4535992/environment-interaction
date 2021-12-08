


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