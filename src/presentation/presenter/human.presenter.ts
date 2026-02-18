import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { IPrLintResult } from "../../domain/interface/pr-lint-result.interface";

import chalk from "chalk";

import { SEPARATOR_WIDTH } from "../../domain/constant/numeric.constant";

/** Formats domain results for human-readable terminal output. */
export const HumanPresenter: { presentContext: (context: IPrContext) => string; presentLintResult: (result: IPrLintResult) => string } = {
	/**
	 * @param {IPrContext} context - PR context to format.
	 * @returns {string} Colored terminal string.
	 */
	presentContext(context: IPrContext): string {
		const lines: Array<string> = [chalk.bold.cyan("PR Context"), chalk.gray("─".repeat(SEPARATOR_WIDTH)), `${chalk.bold("Branch:")}  ${context.branch}`, `${chalk.bold("Ticket:")}  ${context.ticketId ?? chalk.dim("none")}`, `${chalk.bold("Files:")}   ${String(context.files.length)} changed`];

		if (context.files.length > 0) {
			for (const file of context.files) {
				lines.push(`  ${chalk.dim("•")} ${file}`);
			}
		}

		if (context.title) {
			lines.push(`${chalk.bold("Title:")}   ${context.title}`);
		}

		if (context.diff) {
			lines.push(`${chalk.bold("Diff:")}    ${String(context.diff.split("\n").length)} lines`);
		}

		return lines.join("\n");
	},

	/**
	 * @param {IPrLintResult} result - Lint result to format.
	 * @returns {string} Colored terminal string with pass/fail status.
	 */
	presentLintResult(result: IPrLintResult): string {
		const lines: Array<string> = [];

		if (result.isPassed) {
			lines.push(chalk.green.bold("✔ PR lint passed"));
		} else {
			lines.push(chalk.red.bold(`✘ PR lint failed — ${String(result.issues.length)} issue(s)`), chalk.gray("─".repeat(SEPARATOR_WIDTH)));

			for (const issue of result.issues) {
				const codeLabel: string = `[${issue.code}]`;
				lines.push(`  ${chalk.red("•")} ${chalk.yellow(codeLabel)} ${issue.details}`);
			}
		}

		return lines.join("\n");
	},
};
