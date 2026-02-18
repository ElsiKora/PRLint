import { EPrLintIssueCode } from "../../domain/enum/pr-lint-issue-code.enum";
import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { IPrLintConfig } from "../../domain/interface/pr-lint-config.interface";
import type { IPrLintIssue } from "../../domain/interface/pr-lint-issue.interface";
import type { IPrLintResult } from "../../domain/interface/pr-lint-result.interface";
import type { ITicketConfig } from "../../domain/interface/ticket-config.interface";

/** Lints a PR title and body against configured rules. */
export class LintPrUseCase {
	/** @param context - The PR context to lint. @param lintConfig - Lint rule configuration. @param ticketConfig - Ticket configuration for correlation checks. @returns Lint result with pass/fail and any issues found. */
	async execute(context: IPrContext, lintConfig: IPrLintConfig, ticketConfig?: ITicketConfig): Promise<IPrLintResult> {
		const issues: Array<IPrLintIssue> = [];

		if (lintConfig.titlePattern) {
			const regex = new RegExp(lintConfig.titlePattern);

			if (!regex.test(context.title)) {
				issues.push({
					code: EPrLintIssueCode.TITLE_FORMAT,
					details: `Title "${context.title}" does not match pattern: ${lintConfig.titlePattern}`,
				});
			}
		}

		for (const section of lintConfig.requiredSections) {
			if (!context.body.includes(`## ${section}`)) {
				issues.push({
					code: EPrLintIssueCode.BODY_SECTIONS_ORDER,
					details: `Missing required section: ## ${section}`,
				});
			}
		}

		for (const placeholder of lintConfig.forbiddenPlaceholders) {
			const lowerPlaceholder = placeholder.toLowerCase();

			if (context.body.toLowerCase().includes(lowerPlaceholder) || context.title.toLowerCase().includes(lowerPlaceholder)) {
				issues.push({
					code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER,
					details: `Contains forbidden placeholder: "${placeholder}"`,
				});
			}
		}

		if (ticketConfig && context.ticketId && lintConfig.titlePattern) {
			const ticketRegex = new RegExp(ticketConfig.pattern, ticketConfig.patternFlags);
			const titleMatch = ticketRegex.exec(context.title);

			if (titleMatch) {
				const titleTicket = titleMatch[0].toUpperCase();
				const branchTicket = context.ticketId.toUpperCase();

				if (titleTicket !== branchTicket) {
					issues.push({
						code: EPrLintIssueCode.TICKET_CORRELATION,
						details: `Title ticket "${titleMatch[0]}" does not match branch ticket "${context.ticketId}"`,
					});
				}
			}
		}

		return {
			issues,
			pass: issues.length === 0,
		};
	}
}
