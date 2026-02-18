import type { IPrLintIssue } from "../interface/pr-lint-issue.interface";
import type { PrBody } from "../value-object/pr-body.value-object";
import type { PrTitle } from "../value-object/pr-title.value-object";

import { EPrLintIssueCode } from "../enum/pr-lint-issue-code.enum";

/** Validates that no forbidden placeholders remain in the PR title or body. */
export class PlaceholderForbiddancePolicy {
	/**
	 * @param {PrTitle} title - The pull request title to check.
	 * @param {PrBody} body - The pull request body to check.
	 * @param {Array<string>} forbiddenPlaceholders - The forbidden placeholder strings.
	 * @returns {Array<IPrLintIssue>} An issue for each forbidden placeholder found in the title or body.
	 */
	public static validate(title: PrTitle, body: PrBody, forbiddenPlaceholders: Array<string>): Array<IPrLintIssue> {
		const issues: Array<IPrLintIssue> = [];
		const titleText: string = title.getValue();
		const bodyText: string = body.getValue();

		for (const placeholder of forbiddenPlaceholders) {
			const escaped: string = placeholder.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
			const regex: RegExp = new RegExp(`(?<![a-zA-Z0-9-])${escaped}(?![a-zA-Z0-9-])`, "iu");
			const isInTitle: boolean = regex.test(titleText);
			const isInBody: boolean = regex.test(bodyText);

			if (isInTitle || isInBody) {
				const locations: Array<string> = [];

				if (isInTitle) {
					locations.push("title");
				}

				if (isInBody) {
					locations.push("body");
				}

				issues.push({
					code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER,
					details: `Forbidden placeholder "${placeholder}" found in ${locations.join(" and ")}`,
				});
			}
		}

		return issues;
	}
}
