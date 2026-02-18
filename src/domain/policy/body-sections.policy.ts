import { EPrLintIssueCode } from "../enum/pr-lint-issue-code.enum";
import type { IPrLintIssue } from "../interface/pr-lint-issue.interface";
import type { PrBody } from "../value-object/pr-body.value-object";

/** Validates that all required sections exist in the PR body in the correct order. */
export class BodySectionsPolicy {
	/** Returns an issue if any required sections are missing or appear out of order. */
	public static validate(body: PrBody, requiredSections: Array<string>): IPrLintIssue | undefined {
		const bodyText: string = body.getValue();
		const missingSections: Array<string> = [];
		let lastIndex: number = -1;
		let outOfOrder: boolean = false;

		for (const section of requiredSections) {
			const escapedSection: string = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const pattern: RegExp = new RegExp(`^#{1,6}\\s+${escapedSection}`, "mi");
			const match: RegExpExecArray | null = pattern.exec(bodyText);

			if (!match) {
				missingSections.push(section);
			} else if (match.index < lastIndex) {
				outOfOrder = true;
			} else {
				lastIndex = match.index;
			}
		}

		if (missingSections.length === 0 && !outOfOrder) {
			return undefined;
		}

		const details: Array<string> = [];

		if (missingSections.length > 0) {
			details.push(`Missing sections: ${missingSections.join(", ")}`);
		}

		if (outOfOrder) {
			details.push("Sections are not in the expected order");
		}

		return {
			code: EPrLintIssueCode.BODY_SECTIONS_ORDER,
			details: details.join(". "),
		};
	}
}
