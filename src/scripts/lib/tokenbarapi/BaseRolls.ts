export interface BaseRolls {
	get _supportedSystem(): boolean;

	activateHooks(): void;

	get requestoptions(): any;

	get contestedoptions(): any;

	get config(): any;

	get showXP(): boolean;

	getXP(actor): { value: number; max: number };

	getLevel(actor): number;

	get dcLabel(): string;

	get defaultStats(): any[];

	getButtons(): any[];

	defaultRequest(): any;

	defaultContested(): any;

	dynamicRequest(tokens): any[];

	roll({ id }, callback, e): { id: string; error: boolean; msg: string };

	assignXP(msgactor): Promise<void>;
}
