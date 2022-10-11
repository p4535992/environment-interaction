export interface AppTokenBar {
	buttons: any;

	tokens: Token[];

	thumbnails: any[];

	_hover: boolean;

	get defaultOptions();

	getData(options);

	getPos();

	setPos();

	refresh();

	processStat(formula, data);

	getCurrentTokens();

	getResourceBar(token, bar);

	updateToken(tkn, refresh);

	activateListeners(html);

	_contextMenu(html);

	getEntry(id);

	_onClickToken(event);

	_onDblClickToken(event);

	_onHoverToken(event);
}
