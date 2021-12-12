# Macro structure

In the enviroment interaction there 5 possible macro:

1. The element 'ITEM MACRO' from the form setting let you use the macro of the 'Item macro' module, the explanation on how to use this is in that module description, usually is the most simple case you click on the environment voice and a generic macro start
2. The element 'CONDTION' from the form setting, it must be a macro where we recover a boolean value like `"1"=="1"` or `return "1"=="1"`, it very useful when you want to hide or show some choice to a specific token, if true the voice is show on the list, if false the choice is not loaded on the list
3. The element 'SUCCESS' from the form setting, a generic macro is launched when the roll number is >= at the dc setted on the request label
4. The element 'FAILURE' from the form setting, a generic macro is launched when the roll number is < at the dc setted on the request labe

All the macros follow the 'item macro' strcuture here the variables you can use

- item : current item used (can be the enviroment item or the interactor item)
- speaker : the chat speaker build from the current token used
- actor : current actor used (can be the enviroment actor or the interactor actor)
- token : current token used (can be the enviroment token or the interactor token)
- character : current character used (can be the enviroment character or the interactor character)
- event: ??? (asking to the author of item macro for this)
- args: some additional variable for now no ui can be used for this i will put htis on the roadmap of developing

