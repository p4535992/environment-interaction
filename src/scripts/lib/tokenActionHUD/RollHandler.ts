export interface RollHandler {
	preRollHandlers: any[];

	i18n(toTranslate): string;

	getActor(tokenId): Actor;

	getItem(actor, itemId): Item;

	getToken(tokenId): Token;

	throwInvalidValueErr(err): void;

	handleActionEvent(event, encodedValue): Promise<void>;

	doHandleActionEvent(event, encodedValue): void;

	addPreRollHandler(handler): void;

	registerKeyPresses(event): void;

	doRenderItem(tokenId, itemId): void;

	isRenderItem(): boolean;

	isRightClick(event): boolean;

	isAlt(event): boolean;

	isCtrl(event): boolean;

	isShift(event): boolean;

	_isMultiGenericAction(encodedValue): boolean;

	_doMultiGenericAction(encodedValue): Promise<void>;
}
