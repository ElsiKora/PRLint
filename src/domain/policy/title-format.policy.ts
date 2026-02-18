import type { IPrLintIssue } from "../interface/pr-lint-issue.interface";
import type { PrTitle } from "../value-object/pr-title.value-object";

import { EPrLintIssueCode } from "../enum/pr-lint-issue-code.enum";

/** Validates that a PR title matches a required format pattern. */
export class TitleFormatPolicy {
	/**
	 * @param {PrTitle} title - The pull request title to validate.
	 * @param {string} pattern - The regex pattern the title must match.
	 * @returns {IPrLintIssue | undefined} An issue if the title does not match the given regex pattern.
	 */
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
