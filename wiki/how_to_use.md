


| Environment Type | Description                | [INFO] Module Involved|
|:----------------:|:--------------------------:|:---------------------:|
| save             |                            |                       |
| ability          |                            |                       |
| attack           |                            |                       |
| utility          |                            |                       |
| macro            |                            |                       |


The syntax of the rquest label is

<ENVIRONMENT_TYPE>|<REQUEST_LABEL>|<DC>

Examples

| Detail | Info | Event | Condition | Success | Failure | Module |
|:------:|:----:|:-----:|:---------:|:-------:|:-------:|
| This is a sub label | some info  | save|save:dex,save:dex | return item.name |  |  | Monk Token Bar |
| sub label 1         |            | save|save:dex|17       |                  |  |  | Monk Token Bar |
| sub label 1         |            | ability|ability:dex|17 |                  |  |  | Monk Token Bar |
| sub label 1         |            | dice|dice:dex|17       |                  |  |  | Monk Token Bar |
