import { EPrLintIssueCode } from "../enum/pr-lint-issue-code.enum";
import type { IPrLintIssue } from "../interface/pr-lint-issue.interface";
import type { PrTitle } from "../value-object/pr-title.value-object";

/** Validates that a PR title matches a required format pattern. */
export class TitleFormatPolicy {
	/** Returns an issue if the title does not match the given regex pattern. */
	public static validate(title: PrTitle, pattern: string): IPrLintIssue | undefined {
		const regex: RegExp = new RegExp(pattern);

		if (!regex.test(title.getValue())) {
			return {
				code: EPrLintIssueCode.TITLE_FORMAT,
				details: `Title "${title.getValue()}" does not match required pattern: ${pattern}`,
			};
		}

		return undefined;
	}
}
