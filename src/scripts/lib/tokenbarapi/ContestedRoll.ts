export interface ContestedRoll {
	rollDice(dice): Roll;

	returnRoll(
		id,
		roll,
		actor,
		rollmode
	): { id: string; roll: Roll; finish: { id: string; reveal: boolean; userid: string } };

	_rollAbility(data, request, requesttype, rollmode, ffwd, e): Roll;

	onRollAbility(ids, message, fastForward: boolean, evt): void;

	updateMessage(updates, message, reveal): void;

	finishRolling(updates, message): void;

	getTokens(message): Token[];

	checkResult(message): void;

	checkReveal(actors): boolean;

	setRollSuccess(tokenid, message, success): void;

	onRollAll(tokentype, message, e): Roll;

	_onClickToken(tokenId, event): boolean;
}
