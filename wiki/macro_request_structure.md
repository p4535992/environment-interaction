# Macro structure

In the enviroment interaction there are may field where you can apply a customize macro:

1. The element 'ITEM MACRO' from the form setting let you use the macro of the 'Item macro' module, the explanation on how to use this is in that module description, usually is the most simple case you click on the environment voice and a generic macro start
2. The element 'EVENT' usually is not a macro, but if you checked the field 'EVENT AS MACRO' the text of this field it will be run like a macro, it must be a macro where we recover a numeric value like `1` or `return 1` something we can compare with the 'DC o NUMBER FLAG' field.
3. The element 'CONDITION' from the form setting, it must be a macro where we recover a boolean value like `"1"=="1"` or `return "1"=="1"`, it very useful when you want to hide or show some choice to a specific token, if true the voice is show on the list, if false the choice is not loaded on the list
4. The element 'SUCCESS' from the form setting, a generic macro is launched when the roll number is >= at the dc setted on the request label
5. The element 'FAILURE' from the form setting, a generic macro is launched when the roll number is < at the dc setted on the request labe

All the macros follow the 'item macro' strcuture here the variables you can use

- **item** : current item used (can be the enviroment item or the interactor item)
- **speaker** : the chat speaker build from the current token used
- **actor** : current actor used (can be the enviroment actor or the interactor actor)
- **token** : current token used (can be the enviroment token or the interactor token)
- **character** : current character used (can be the enviroment character or the interactor character)
- **interactorToken**: is the interactor token (the selected one) recovered from the code `getCanvas().tokens?.controlled[0]`
- **interactorActor**: is the interactor actor linked to the interactor token;
- **event:** ??? (asking to the author of item macro for this)
- **args**: some additional variable for now no ui can be used for this i will put htis on the roadmap of developing

