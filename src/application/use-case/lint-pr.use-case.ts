import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { IPrLintConfig } from "../../domain/interface/pr-lint-config.interface";
import type { IPrLintIssue } from "../../domain/interface/pr-lint-issue.interface";
import type { IPrLintResult } from "../../domain/interface/pr-lint-result.interface";
import type { ITicketConfig } from "../../domain/interface/ticket-config.interface";

import { EPrLintIssueCode } from "../../domain/enum/pr-lint-issue-code.enum";

/** Lints a PR title and body against configured rules. */
export class LintPrUseCase {
	/**
	 * @param {IPrContext} context - The PR context to lint.
	 * @param {IPrLintConfig} lintConfig - Lint rule configuration.
	 * @param {ITicketConfig} ticketConfig - Ticket configuration for correlation checks.
	 * @returns {IPrLintResult} Lint result with pass/fail and any issues found.
	 */
	execute(context: IPrContext, lintConfig: IPrLintConfig, ticketConfig?: ITicketConfig): IPrLintResult {
		const issues: Array<IPrLintIssue> = [];

		if (lintConfig.titlePattern) {
			const regex: RegExp = new RegExp(lintConfig.titlePattern);

			if (!regex.test(context.title)) {
				issues.push({
					code: EPrLintIssueCode.TITLE_FORMAT,
					details: `Title "${context.title}" does not match pattern: ${lintConfig.titlePattern}`,
				});
			}
		}

		for (const section of lintConfig.requiredSections) {
			if (!hasSection(context.body, section)) {
				issues.push({
					code: EPrLintIssueCode.BODY_SECTIONS_ORDER,
					details: `Missing required section: ## ${section}`,
				});
			}
		}

		const existingSectionIndexes: Array<{ index: number; section: string }> = lintConfig.requiredSections
			.map((section: string) => ({
				index: getSectionIndex(context.body, section),
				section,
			}))
			.filter((entry: { index: number; section: string }) => entry.index >= 0);

		for (let index: number = 1; index < existingSectionIndexes.length; index++) {
			const previous: { index: number; section: string } | undefined = existingSectionIndexes[index - 1];
			const current: { index: number; section: string } | undefined = existingSectionIndexes[index];

			if (!previous || !current) {
				continue;
			}

			if (current.index < previous.index) {
				issues.push({
					code: EPrLintIssueCode.BODY_SECTIONS_ORDER,
					details: `Section order is invalid: ## ${current.section} appears before ## ${previous.section}`,
				});

				break;
			}
		}

		for (const placeholder of lintConfig.forbiddenPlaceholders) {
			const lowerPlaceholder: string = placeholder.toLowerCase();

			if (context.body.toLowerCase().includes(lowerPlaceholder) || context.title.toLowerCase().includes(lowerPlaceholder)) {
				issues.push({
					code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER,
					details: `Contains forbidden placeholder: "${placeholder}"`,
				});
			}
		}

		if (ticketConfig && context.ticketId && lintConfig.titlePattern) {
			const ticketRegex: RegExp = new RegExp(ticketConfig.pattern, ticketConfig.patternFlags);
			const titleMatch: null | RegExpExecArray = ticketRegex.exec(context.title);

			if (titleMatch) {
				const titleTicket: string = titleMatch[0].toUpperCase();
				const branchTicket: string = context.ticketId.toUpperCase();

				if (titleTicket !== branchTicket) {
					issues.push({
						code: EPrLintIssueCode.TICKET_CORRELATION,
						details: `Title ticket "${titleMatch[0]}" does not match branch ticket "${context.ticketId}"`,
					});
				}
			}
		}

		return {
			isPassed: issues.length === 0,
			issues,
		};
	}
}

/**
 * @param {string} body - The PR body text to search.
 * @param {string} section - The section heading to find.
 * @returns {number} The index of the section heading, or -1 if not found.
 */
function getSectionIndex(body: string, section: string): number {
	const sectionHeading: string = `## ${section}`;

	return body.indexOf(sectionHeading);
}

/**
 * @param {string} body - The PR body text to search.
 * @param {string} section - The section heading to check.
 * @returns {boolean} Whether the section exists in the body.
 */
function hasSection(body: string, section: string): boolean {
	const sectionHeading: string = `## ${section}`;

	return body.includes(sectionHeading);
}
