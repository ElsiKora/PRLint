export interface IPrLintConfig {
	forbiddenPlaceholders: ReadonlyArray<string>;
	requiredSections: ReadonlyArray<string>;
	titlePattern: string;
}
