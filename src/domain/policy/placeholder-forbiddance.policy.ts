import { EPrLintIssueCode } from "../enum/pr-lint-issue-code.enum";
import type { IPrLintIssue } from "../interface/pr-lint-issue.interface";
import type { PrBody } from "../value-object/pr-body.value-object";
import type { PrTitle } from "../value-object/pr-title.value-object";

/** Validates that no forbidden placeholders remain in the PR title or body. */
export class PlaceholderForbiddancePolicy {
	/** Returns an issue for each forbidden placeholder found in the title or body. */
	public static validate(title: PrTitle, body: PrBody, forbiddenPlaceholders: Array<string>): Array<IPrLintIssue> {
		const issues: Array<IPrLintIssue> = [];
		const titleText: string = title.getValue();
		const bodyText: string = body.getValue();

		for (const placeholder of forbiddenPlaceholders) {
			const lowerPlaceholder: string = placeholder.toLowerCase();
			const inTitle: boolean = titleText.toLowerCase().includes(lowerPlaceholder);
			const inBody: boolean = bodyText.toLowerCase().includes(lowerPlaceholder);

			if (inTitle || inBody) {
				const locations: Array<string> = [];

				if (inTitle) {
					locations.push("title");
				}

				if (inBody) {
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
