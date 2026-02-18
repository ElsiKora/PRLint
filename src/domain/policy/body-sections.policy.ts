import type { IPrLintIssue } from "../interface/pr-lint-issue.interface";
import type { PrBody } from "../value-object/pr-body.value-object";

import { EPrLintIssueCode } from "../enum/pr-lint-issue-code.enum";

/** Validates that all required sections exist in the PR body in the correct order. */
export class BodySectionsPolicy {
	/**
	 * @param {PrBody} body - The pull request body to validate.
	 * @param {Array<string>} requiredSections - The required section headings.
	 * @returns {IPrLintIssue | undefined} An issue if any required sections are missing or appear out of order.
	 */
	public static validate(body: PrBody, requiredSections: Array<string>): IPrLintIssue | undefined {
		const bodyText: string = body.getValue();
		const missingSections: Array<string> = [];
		let lastIndex: number = -1;
		let isOutOfOrder: boolean = false;

		for (const section of requiredSections) {
			const escapedSection: string = section.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
			const pattern: RegExp = new RegExp(`^#{1,6}\\s+${escapedSection}`, "im");
			const match: null | RegExpExecArray = pattern.exec(bodyText);

			if (!match) {
				missingSections.push(section);
			} else if (match.index < lastIndex) {
				isOutOfOrder = true;
			} else {
				lastIndex = match.index;
			}
		}

		if (missingSections.length === 0 && !isOutOfOrder) {
			return undefined;
		}

		const details: Array<string> = [];

		if (missingSections.length > 0) {
			details.push(`Missing sections: ${missingSections.join(", ")}`);
		}

		if (isOutOfOrder) {
			details.push("Sections are not in the expected order");
		}

		return {
			code: EPrLintIssueCode.BODY_SECTIONS_ORDER,
			details: details.join(". "),
		};
	}
}
